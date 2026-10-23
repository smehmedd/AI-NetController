/**
 * CST NetController AI - Binary Protocol Framer (0xC5 0x71)
 * 
 * Strict 12-byte binary protocol framing for zero-allocation wire communication.
 * Header layout:
 * - 0..1: Magic (0xC5, 0x71)
 * - 2: Opcode (0x01 = PING, 0x02 = PONG, 0x03 = SCREEN_FRAME, 0x04 = COMMAND, 0x05 = HITL)
 * - 3: Flags (0x00 reserved)
 * - 4..7: Sequence ID (Uint32 Big-Endian)
 * - 8..11: Payload Length (Uint32 Big-Endian)
 */

export const MAGIC_BYTE_0 = 0xC5;
export const MAGIC_BYTE_1 = 0x71;
export const HEADER_SIZE = 12;

export enum Opcode {
  OP_UNKNOWN = 0x00,
  OP_PING = 0x01,
  OP_PONG = 0x02,
  OP_SCREEN_FRAME = 0x03,
  OP_COMMAND = 0x04,
  OP_HITL = 0x05,
  OP_TELEMETRY = 0x06
}

export interface ParsedHeader {
  isValid: boolean;
  opcode: Opcode;
  flags: number;
  sequenceId: number;
  payloadLength: number;
}

export function parseHeader(dv: DataView): ParsedHeader {
  if (dv.byteLength < HEADER_SIZE) {
    return { isValid: false, opcode: Opcode.OP_UNKNOWN, flags: 0, sequenceId: 0, payloadLength: 0 };
  }

  const m0 = dv.getUint8(0);
  const m1 = dv.getUint8(1);
  if (m0 !== MAGIC_BYTE_0 || m1 !== MAGIC_BYTE_1) {
    return { isValid: false, opcode: Opcode.OP_UNKNOWN, flags: 0, sequenceId: 0, payloadLength: 0 };
  }

  return {
    isValid: true,
    opcode: dv.getUint8(2) as Opcode,
    flags: dv.getUint8(3),
    sequenceId: dv.getUint32(4, false),
    payloadLength: dv.getUint32(8, false)
  };
}

export function packFrame(opcode: Opcode, sequenceId: number, payload?: Uint8Array): ArrayBuffer {
  const payloadLen = payload ? payload.byteLength : 0;
  const totalLength = HEADER_SIZE + payloadLen;
  const buffer = new ArrayBuffer(totalLength);
  const dv = new DataView(buffer);

  dv.setUint8(0, MAGIC_BYTE_0);
  dv.setUint8(1, MAGIC_BYTE_1);
  dv.setUint8(2, opcode);
  dv.setUint8(3, 0x00);
  dv.setUint32(4, sequenceId, false);
  dv.setUint32(8, payloadLen, false);

  if (payload && payloadLen > 0) {
    new Uint8Array(buffer, HEADER_SIZE).set(payload);
  }

  return buffer;
}
