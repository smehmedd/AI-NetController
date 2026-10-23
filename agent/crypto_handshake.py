"""
Zero-Trust Cryptographic Channel & Ephemeral ECDH Handshake
---------------------------------------------------------------------
Implements:
- Curve25519 (X25519) Ephemeral Key Agreement (Perfect Forward Secrecy)
- HKDF-SHA256 (RFC 5869) Key Derivation
- ChaCha20-Poly1305 AEAD (RFC 8439) Authenticated Encryption with Associated Data
- Opcode 0x06 Handshake & Monotonic Nonce Replay Prevention
"""

import os
import struct
import hmac
import hashlib
import secrets
import time
from typing import Tuple, Optional

# Try hardware-accelerated OpenSSL bindings from cryptography library;
# provide mathematically exact pure-Python fallbacks for RFC 7748 and RFC 8439
# so the agent runs anywhere with zero required native DLL dependencies.
try:
    from cryptography.hazmat.primitives.asymmetric import x25519
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes
    from cryptography.hazmat.primitives.ciphers.aead import ChaCha20Poly1305
    HAS_CRYPTOGRAPHY_LIB = True
except ImportError:
    HAS_CRYPTOGRAPHY_LIB = False


# =====================================================================
# CONSTANTS & PROTOCOL STRUCTS
# =====================================================================
KEY_SIZE = 32          # 256-bit symmetric key
NONCE_SIZE = 12        # 96-bit ChaCha20-Poly1305 nonce
TAG_SIZE = 16          # 128-bit Poly1305 authentication tag
SALT_SIZE = 16         # 128-bit HKDF salt
HANDSHAKE_MAGIC = b'CST_ECDH_V1'
INFO_STRING = b"cst-autonomous-lan-session-key-v1"


# =====================================================================
# RFC 7748 PURE PYTHON CURVE25519 / X25519 ARITHMETIC FALLBACK
# =====================================================================
_P = 2**255 - 19
_A24 = 121665

def _clamp_scalar(k_bytes: bytes) -> int:
    a = bytearray(k_bytes)
    a[0] &= 248
    a[31] &= 127
    a[31] |= 64
    return int.from_bytes(a, 'little')

def _x25519_eval(k: int, u: int) -> int:
    x_1 = u
    x_2, z_2 = 1, 0
    x_3, z_3 = u, 1
    swap = 0

    for t in reversed(range(255)):
        k_t = (k >> t) & 1
        swap ^= k_t
        if swap:
            x_2, x_3 = x_3, x_2
            z_2, z_3 = z_3, z_2
        swap = k_t

        A = (x_2 + z_2) % _P
        AA = (A * A) % _P
        B = (x_2 - z_2) % _P
        BB = (B * B) % _P
        E = (AA - BB) % _P
        C = (x_3 + z_3) % _P
        D = (x_3 - z_3) % _P
        DA = (D * A) % _P
        CB = (C * B) % _P
        x_3 = ((DA + CB) ** 2) % _P
        z_3 = (x_1 * ((DA - CB) ** 2)) % _P
        x_2 = (AA * BB) % _P
        z_2 = (E * (AA + _A24 * E)) % _P

    if swap:
        x_2, x_3 = x_3, x_2
        z_2, z_3 = z_3, z_2

    return (x_2 * pow(z_2, _P - 2, _P)) % _P


class PurePythonX25519:
    @staticmethod
    def generate_private_key() -> bytes:
        return secrets.token_bytes(32)

    @staticmethod
    def public_key_from_private(private_key: bytes) -> bytes:
        k = _clamp_scalar(private_key)
        pub_int = _x25519_eval(k, 9)
        return pub_int.to_bytes(32, 'little')

    @staticmethod
    def compute_shared_secret(private_key: bytes, peer_public_key: bytes) -> bytes:
        k = _clamp_scalar(private_key)
        u = int.from_bytes(peer_public_key, 'little')
        shared_int = _x25519_eval(k, u)
        return shared_int.to_bytes(32, 'little')


# =====================================================================
# RFC 5869 HKDF-SHA256 (EXTRACT & EXPAND)
# =====================================================================
def hkdf_extract(salt: bytes, ikm: bytes) -> bytes:
    if not salt:
        salt = b'\x00' * 32
    return hmac.new(salt, ikm, hashlib.sha256).digest()

def hkdf_expand(prk: bytes, info: bytes, length: int) -> bytes:
    hash_len = 32
    n = (length + hash_len - 1) // hash_len
    okm = bytearray()
    t = b""
    for i in range(1, n + 1):
        t = hmac.new(prk, t + info + bytes([i]), hashlib.sha256).digest()
        okm.extend(t)
    return bytes(okm[:length])

def derive_session_key(shared_secret: bytes, salt: bytes, info: bytes = INFO_STRING) -> bytes:
    if HAS_CRYPTOGRAPHY_LIB:
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=KEY_SIZE,
            salt=salt,
            info=info,
        )
        return hkdf.derive(shared_secret)
    else:
        prk = hkdf_extract(salt, shared_secret)
        return hkdf_expand(prk, info, KEY_SIZE)


# =====================================================================
# RFC 8439 CHACHA20-POLY1305 PURE PYTHON FALLBACK
# =====================================================================
def _rotl32(v: int, c: int) -> int:
    return ((v << c) & 0xFFFFFFFF) | (v >> (32 - c))

def _quarter_round(x: list, a: int, b: int, c: int, d: int):
    x[a] = (x[a] + x[b]) & 0xFFFFFFFF; x[d] = _rotl32(x[d] ^ x[a], 16)
    x[c] = (x[c] + x[d]) & 0xFFFFFFFF; x[b] = _rotl32(x[b] ^ x[c], 12)
    x[a] = (x[a] + x[b]) & 0xFFFFFFFF; x[d] = _rotl32(x[d] ^ x[a], 8)
    x[c] = (x[c] + x[d]) & 0xFFFFFFFF; x[b] = _rotl32(x[b] ^ x[c], 7)

def _chacha20_block(key: bytes, counter: int, nonce: bytes) -> bytes:
    constants = [0x61707865, 0x3320646e, 0x79622d32, 0x6b206574]
    k = list(struct.unpack('<8I', key))
    n = list(struct.unpack('<3I', nonce))
    state = constants + k + [counter] + n
    working = list(state)

    for _ in range(10):
        _quarter_round(working, 0, 4, 8, 12)
        _quarter_round(working, 1, 5, 9, 13)
        _quarter_round(working, 2, 6, 10, 14)
        _quarter_round(working, 3, 7, 11, 15)
        _quarter_round(working, 0, 5, 10, 15)
        _quarter_round(working, 1, 6, 11, 12)
        _quarter_round(working, 2, 7, 8, 13)
        _quarter_round(working, 3, 4, 9, 14)

    out = bytearray(64)
    for i in range(16):
        val = (working[i] + state[i]) & 0xFFFFFFFF
        struct.pack_into('<I', out, i * 4, val)
    return bytes(out)

def _poly1305_clamp(r_bytes: bytes) -> int:
    r = bytearray(r_bytes)
    r[3] &= 15; r[7] &= 15; r[11] &= 15; r[15] &= 15
    r[4] &= 252; r[8] &= 252; r[12] &= 252
    return int.from_bytes(r, 'little')

def _poly1305_mac(msg: bytes, key: bytes) -> bytes:
    r = _poly1305_clamp(key[:16])
    s = int.from_bytes(key[16:], 'little')
    p = (1 << 130) - 5
    accumulator = 0

    for i in range(0, len(msg), 16):
        chunk = msg[i:i + 16]
        n = int.from_bytes(chunk + b'\x01', 'little')
        accumulator = ((accumulator + n) * r) % p

    tag_int = (accumulator + s) % (1 << 128)
    return tag_int.to_bytes(16, 'little')

def _chacha20_crypt(key: bytes, nonce: bytes, data: bytes, initial_counter: int = 1) -> bytes:
    out = bytearray(len(data))
    counter = initial_counter
    for i in range(0, len(data), 64):
        block = _chacha20_block(key, counter, nonce)
        chunk = data[i:i + 64]
        for j in range(len(chunk)):
            out[i + j] = chunk[j] ^ block[j]
        counter += 1
    return bytes(out)

def pure_chacha20_poly1305_encrypt(key: bytes, nonce: bytes, plaintext: bytes, aad: bytes = b"") -> bytes:
    otk = _chacha20_block(key, 0, nonce)[:32]
    ciphertext = _chacha20_crypt(key, nonce, plaintext, initial_counter=1)

    pad1 = b'\x00' * ((16 - (len(aad) % 16)) % 16)
    pad2 = b'\x00' * ((16 - (len(ciphertext) % 16)) % 16)
    mac_data = aad + pad1 + ciphertext + pad2 + struct.pack('<QQ', len(aad), len(ciphertext))
    tag = _poly1305_mac(mac_data, otk)
    return ciphertext + tag

def pure_chacha20_poly1305_decrypt(key: bytes, nonce: bytes, ciphertext_and_tag: bytes, aad: bytes = b"") -> bytes:
    if len(ciphertext_and_tag) < TAG_SIZE:
        raise ValueError("Ciphertext too short for Poly1305 tag")
    ciphertext = ciphertext_and_tag[:-TAG_SIZE]
    received_tag = ciphertext_and_tag[-TAG_SIZE:]

    otk = _chacha20_block(key, 0, nonce)[:32]
    pad1 = b'\x00' * ((16 - (len(aad) % 16)) % 16)
    pad2 = b'\x00' * ((16 - (len(ciphertext) % 16)) % 16)
    mac_data = aad + pad1 + ciphertext + pad2 + struct.pack('<QQ', len(aad), len(ciphertext))
    expected_tag = _poly1305_mac(mac_data, otk)

    if not hmac.compare_digest(received_tag, expected_tag):
        raise ValueError("Poly1305 MAC tag mismatch! Payload corrupted or forged.")

    return _chacha20_crypt(key, nonce, ciphertext, initial_counter=1)


# =====================================================================
# UNIFIED AEAD WRAPPER
# =====================================================================
class AuthenticatedCipher:
    def __init__(self, session_key: bytes):
        if len(session_key) != KEY_SIZE:
            raise ValueError(f"Session key must be {KEY_SIZE} bytes")
        self.session_key = session_key
        if HAS_CRYPTOGRAPHY_LIB:
            self._cipher = ChaCha20Poly1305(session_key)
        else:
            self._cipher = None

    def encrypt(self, nonce: bytes, plaintext: bytes, aad: bytes = b"") -> bytes:
        if len(nonce) != NONCE_SIZE:
            raise ValueError(f"Nonce must be {NONCE_SIZE} bytes")
        if self._cipher:
            return self._cipher.encrypt(nonce, plaintext, aad)
        return pure_chacha20_poly1305_encrypt(self.session_key, nonce, plaintext, aad)

    def decrypt(self, nonce: bytes, ciphertext_with_tag: bytes, aad: bytes = b"") -> bytes:
        if len(nonce) != NONCE_SIZE:
            raise ValueError(f"Nonce must be {NONCE_SIZE} bytes")
        if self._cipher:
            return self._cipher.decrypt(nonce, ciphertext_with_tag, aad)
        return pure_chacha20_poly1305_decrypt(self.session_key, nonce, ciphertext_with_tag, aad)


# =====================================================================
# EPHEMERAL ZERO-TRUST SESSION HANDSHAKE MANAGER
# =====================================================================
class HostCryptoSession:
    """
    Manages the life-cycle of a single WebSocket client's encrypted session.
    Provides Perfect Forward Secrecy via ephemeral X25519 pairs generated per connection.
    """
    def __init__(self, psk_secret: bytes):
        self.psk = psk_secret
        self.session_key: Optional[bytes] = None
        self.cipher: Optional[AuthenticatedCipher] = None
        self.is_established: bool = False

        # Monotonic Nonce counters (prevents replay attacks)
        self._tx_nonce_counter = 0
        self._rx_last_nonce_counter = -1

        # Generate Host Ephemeral Curve25519 Key Pair
        if HAS_CRYPTOGRAPHY_LIB:
            self._private_key_obj = x25519.X25519PrivateKey.generate()
            self._public_bytes = self._private_key_obj.public_key().public_bytes_raw()
        else:
            self._private_bytes = PurePythonX25519.generate_private_key()
            self._public_bytes = PurePythonX25519.public_key_from_private(self._private_bytes)

        self.salt = secrets.token_bytes(SALT_SIZE)
        self.handshake_timestamp = int(time.time())

    def create_handshake_challenge(self) -> bytes:
        """
        Creates Opcode 0x06 Challenge Payload:
        Format: [MAGIC (11 bytes)] + [Host X25519 Pubkey (32 bytes)] + [Salt (16 bytes)] + [Timestamp (8 bytes)]
        """
        payload = bytearray()
        payload.extend(HANDSHAKE_MAGIC)
        payload.extend(self._public_bytes)
        payload.extend(self.salt)
        payload.extend(struct.pack('!Q', self.handshake_timestamp))
        return bytes(payload)

    def process_handshake_response(self, client_response_payload: bytes) -> bool:
        """
        Processes Client Handshake Response:
        Format: [Client X25519 Pubkey (32 bytes)] + [HMAC-SHA256 Auth Tag (32 bytes)]
        """
        if len(client_response_payload) < 64:
            return False

        client_pubkey = client_response_payload[:32]
        client_auth_tag = client_response_payload[32:64]

        # Verify client proved knowledge of Pre-Shared Key (PSK)
        expected_tag = hmac.new(
            self.psk,
            HANDSHAKE_MAGIC + self._public_bytes + client_pubkey + self.salt,
            hashlib.sha256
        ).digest()

        if not hmac.compare_digest(client_auth_tag, expected_tag):
            return False

        # Compute ECDH Shared Secret
        if HAS_CRYPTOGRAPHY_LIB:
            peer_pub_obj = x25519.X25519PublicKey.from_public_bytes(client_pubkey)
            shared_secret = self._private_key_obj.exchange(peer_pub_obj)
        else:
            shared_secret = PurePythonX25519.compute_shared_secret(self._private_bytes, client_pubkey)

        # HKDF-SHA256 Derive Symmetric Session Key
        self.session_key = derive_session_key(shared_secret, self.salt, INFO_STRING)
        self.cipher = AuthenticatedCipher(self.session_key)
        self.is_established = True
        return True

    def generate_tx_nonce(self) -> bytes:
        """
        Generates a strictly monotonic 96-bit (12-byte) nonce:
        [8-byte big-endian counter] + [4-byte fixed host identifier]
        """
        self._tx_nonce_counter += 1
        return struct.pack('!QI', self._tx_nonce_counter, 0x484F5354)  # 'HOST'

    def encrypt_frame(self, header_aad: bytes, plaintext: bytes) -> Tuple[bytes, bytes]:
        """
        Encrypts payload using ChaCha20-Poly1305.
        Returns: (12-byte nonce, ciphertext + 16-byte tag)
        """
        if not self.is_established or not self.cipher:
            raise RuntimeError("Cryptographic session not established")
        nonce = self.generate_tx_nonce()
        ciphertext_tag = self.cipher.encrypt(nonce, plaintext, aad=header_aad)
        return nonce, ciphertext_tag

    def decrypt_frame(self, header_aad: bytes, nonce: bytes, ciphertext_tag: bytes) -> bytes:
        """
        Decrypts payload and enforces monotonic nonce replay checks.
        """
        if not self.is_established or not self.cipher:
            raise RuntimeError("Cryptographic session not established")
        if len(nonce) != NONCE_SIZE:
            raise ValueError(f"Invalid nonce length: {len(nonce)}")

        # Extract counter and verify strictly increasing
        rx_counter, _ = struct.unpack('!QI', nonce)
        if rx_counter <= self._rx_last_nonce_counter:
            raise ValueError(f"Replay attack detected! Received counter {rx_counter} <= {self._rx_last_nonce_counter}")
        self._rx_last_nonce_counter = rx_counter

        return self.cipher.decrypt(nonce, ciphertext_tag, aad=header_aad)
