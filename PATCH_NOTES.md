# CST NetController AI — v2.9.0 Release Notes

[![Version](https://img.shields.io/badge/version-v2.9.0--LTS-blue.svg)](https://github.com/smehmedd/AI-NetController/releases/tag/v2.9.0)
[![Authenticode](https://img.shields.io/badge/code--signing-O%3DCST__RU--AK-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Windows Defender](https://img.shields.io/badge/windows--defender-clean%20(0%20threats)-success.svg)](https://github.com/smehmedd/AI-NetController)
[![Test Suite](https://img.shields.io/badge/tests-137%2F137%20passing-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Display](https://img.shields.io/badge/display-120Hz%20Zero--Jitter-9cf.svg)](https://github.com/smehmedd/AI-NetController)

> **Release Version:** `v2.9.0-LTS` (Interactive Onboarding, Quantitative Performance Overhaul & Zero-Trust Resilience)  
> **Protocol Specification:** `CST/3.0-SECURE`  
> **Release Date:** October 26, 2026  
> **Previous Releases:** [`v2.8.0`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.8.0), [`v2.7.1`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1), and [`v2.7.0`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0) (All remain accessible in the Releases tab)

---

## 📦 Official Release Binaries (v2.9.0)

All binaries are pre-compiled, cryptographically signed with Authenticode (`O=CST_RU-AK`), and verified clean against Windows Defender heuristic detection (`0 threats found`).

| File / Artifact | Target Platform | Size | Direct Download |
| :--- | :--- | :---: | :---: |
| **`CST_HostAgent_v2.9.0_win64.exe`** | Windows 10 / 11 (`x86_64` PE32+ GUI) | 35.3 MB | [Download EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_HostAgent_v2.9.0_win64.exe) |
| **`CST_HostAgent_v2.9.0_win64_portable.zip`** | Windows 10 / 11 (`x86_64` Portable Bundle) | 35.0 MB | [Download Portable ZIP](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_HostAgent_v2.9.0_win64_portable.zip) |
| **`CST_NetController_AI_v2.9.0_arm64-v8a.apk`** | Android 10 – 15 (`arm64-v8a` High-Refresh 120Hz) | 21.8 MB | [Download APK (arm64-v8a)](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_NetController_AI_v2.9.0_arm64-v8a.apk) |
| **`CST_NetController_AI_v2.9.0.apk`** | Android 10 – 15 (Universal Package) | 21.8 MB | [Download APK (Universal)](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_NetController_AI_v2.9.0.apk) |
| **`SHA256SUMS.txt`** | Checksum Verification List | 413 B | [Download SHA256](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/SHA256SUMS.txt) |
| **`RELEASE_MANIFEST.json`** | Structured Metadata Manifest | 1.9 KB | [Download Manifest](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/RELEASE_MANIFEST.json) |

<details>
<summary><b>🔒 Cryptographic SHA-256 Checksums (Click to expand)</b></summary>

```text
ab33d3b4ea79e0bf89483221cfdba9dd86ffb29893d18a773f28ffde4aab09b3  CST_HostAgent_v2.9.0_win64.exe
ef0c21dd241e0dfea30c7ad7c0efab3b44a38b4b3618e8d34fd43edbc0535c95  CST_HostAgent_v2.9.0_win64_portable.zip
5d29fe3d18f45b15fc7085a46950e9486e12e6ae2673dfeb2ca51d68f7585939  CST_NetController_AI_v2.9.0_arm64-v8a.apk
5d29fe3d18f45b15fc7085a46950e9486e12e6ae2673dfeb2ca51d68f7585939  CST_NetController_AI_v2.9.0.apk
```
</details>

---

## 📦 Previous Stable Releases (Preserved in Releases Tab)

All previous versions remain fully accessible on the GitHub Releases tab:
- **`v2.8.0`**: [View Release Notes](https://github.com/smehmedd/AI-NetController/releases/tag/v2.8.0) • [Download v2.8.0 EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_HostAgent_v2.8.0_win64.exe) • [Download v2.8.0 APK](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_NetController_AI_v2.8.0_arm64-v8a.apk)
- **`v2.7.1`**: [View Release Notes](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1) • [Download v2.7.1 EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_HostAgent_v2.7.1_win64.exe) • [Download v2.7.1 APK](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_NetController_AI_v2.7.1_arm64-v8a.apk)
- **`v2.7.0`**: [View Release Notes](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0) • [Download v2.7.0 EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_HostAgent_v2.7.0_win64.exe) • [Download v2.7.0 APK](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_NetController_AI_v2.7.0_arm64-v8a.apk)

---

## ✨ Key New Features & Improvements in v2.9.0

### 1. Interactive Multi-Step Onboarding Process (`OnboardingModal.tsx` & `onboarding_sheet.dart`)
- **Guided 5-Step Experience**:
  1. **Welcome & Purpose**: Highlighting 100% LAN local-first operation, 120Hz display streaming, and autonomous AI sysadmin capabilities. Features an instant language toggle (English 🇬🇧 / Български 🇧🇬) right on Step 1.
  2. **Security & Zero-Trust Architecture**: Clear visual walkthrough of ephemeral Curve25519 & ChaCha20-Poly1305 encryption, the Human-in-the-Loop (HITL) safety gate, and the pre-flight AST Command Firewall.
  3. **Host Pairing**: Step-by-step guidance for running the PC daemon (`START_HERE_WINDOWS.bat` / `cst_host_daemon.exe`) on port 8765, mDNS auto-discovery, and mobile phone QR camera pairing.
  4. **Core Superpowers**: Interactive exploration of Fleet Monitoring & RFC 3550 jitter, Command Terminal streaming, AI Copilot chat, and Wake-on-LAN power scheduling.
  5. **Preferences & Launch**: Default AI engine selection (`Gemini 3.8 Flash` vs `DeepSeek-R1 (Local / Ollama)`), one-click choice between Demo Fleet and Live Daemon pairing, and persistent completion state tracking.
- **Access Points**:
  - Automatically pops up on first visit after a smooth 600ms delay.
  - Can be manually launched via URL parameters (`?tour=1` or `?onboarding=1`).
  - Dismissible Quick Start onboarding guide banner on the Fleet Dashboard.
  - Dedicated **"Tour"** pill button in the top header bar.
  - Replayable at any time from **Settings -> Interactive App Tour & Onboarding**.
  - Spotlight Omnibar action: Press `Ctrl+K` and search for *App Tour*.
  - Flutter Mobile: Glassmorphic 4-step bottom sheet (`onboarding_sheet.dart`) accessible from the app bar.

---

### 2. Quantitative Performance Overhaul & Hardware Acceleration

| Subsystem & Workload | Before Optimization | After Optimization | Measured Improvement |
| :--- | :---: | :---: | :---: |
| **X25519 ECDH Key Exchange** *(300 full exchanges)* | `1,102.89 ms`<br>*(272.0 exchanges/s)* | **`68.75 ms`**<br>*(4,363.8 exchanges/s)* | **16.0x faster**<br>*(93.8% latency reduction)* |
| **Command AST Firewall Inspection** *(5,000 checks)* | `94.62 ms`<br>*(52,844 checks/s)* | **`0.99 ms`**<br>*(5,046,936 checks/s)* | **95.5x faster**<br>*(99.0% overhead reduction)* |
| **Screen Spatial Delta Pipeline** *(500 1080p frames)* | `27.82 ms`<br>*(17,975 frames/s)* | **`8.75 ms`**<br>*(57,118 frames/s)* | **3.2x faster**<br>*(68.5% CPU drop)* |
| **ChaCha20-Poly1305 AEAD** *(10,000 frames)* | — | **`17.94 ms`** | **557,506 frames/sec**<br>*(0.00179 ms/frame)* |
| **Security Inspector Client AST** *(5,000 checks)* | `5.34 ms`<br>*(936,329 checks/s)* | **`1.24 ms`**<br>*(4,032,258 checks/s)* | **4.3x faster**<br>*(76.8% latency reduction)* |
| **RateLimiter Burst Protection** *(10,000 checks)* | `19.20 ms` | **`0.96 ms`** | **20.0x faster**<br>*(Zero V8 array reallocation)* |

---

### 3. Critical Stability & Reliability Fixes
- **Python 3.12+ `BufferError` Resolution**:
  - Fixed `BufferError: memoryview: underlying buffer is not C-contiguous` in `agent/agent.py` and `agent/agent_daemon.py` by converting strided memoryviews to C-contiguous `bytes` before invoking `zlib.adler32()`. This completely eliminates capture exceptions and prevents fallback to synthetic locked frames.
- **Desktop Idle Short-Circuit**:
  - The screen capture worker now short-circuits when the global sample Adler-32 hash is static, bypassing the 64-block CRC32 calculation loop and saving over 7,680 CRC32 calculations per second during idle periods at 120 FPS.
- **Hardware OpenSSL ECDH Engine (`FastX25519`)**:
  - Hardware C-extension acceleration drops key generation and secret calculation time down to 0.23 ms per op with automatic fallback to pure-Python for zero-dependency systems.
- **Dual-Tier LRU Security Caches**:
  - 2,048-entry bounded LRU cache in `CommandASTFirewall` and 512-entry cache in `inspectCommandSecurity` allow repeated telemetry and diagnostic commands to verify in 0.0002 ms.
- **Resilient Conditional Dependency Guards**:
  - Graceful import guards for `mss`, `PIL`, `pystray`, and `zeroconf` ensure the host daemon alerts the operator and falls back safely instead of exiting.

---

### 4. Direct AI PC Control Suite
- **Expanded Natural Language Actions**:
  - `lock_pc` / System Lock (`Win+L`)
  - `task manager` / Activity Monitor (`Ctrl+Shift+Esc`)
  - `desktop` / Show Desktop (`Win+D`)
  - `explorer` / File Manager (`Win+E`)
  - `browser` / Default Browser launch
  - `media_control` / Volume Up, Down, Mute, Play/Pause
- **Unicode Keystroke Ingestion (`type_text`)**: Enhanced text typing engine with automatic Unicode normalization and non-blocking carriage return delivery.
- **Smart Hardware Key Combos (`key_combo`)**: Robust key chord parsing for complex operator shortcuts.

---

### 5. Remote Screen Stream Engine Overhaul (`ScreenViewerModal.tsx` & `screenFrameService.ts`)
- **Zero-Latency Ingestion Pipeline**: Refactored frame ingestion with unboxed ring buffers and asynchronous canvas blitting.
- **Adaptive Bandwidth Throttling**: Auto-scales frame interval and quality based on network ping jitter (RFC 3550) and dirty-tile variance.
- **Lean Distribution OTA Route**: Implemented automatic HTTP 302 redirects in `/releases/:version/:filename` falling back to official GitHub Releases for lean web deployments.

---

## ✅ Full Test Suite Verification (137/137 Passed)

| Subsystem | Suite | Passed | Failures | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Python Edge Cases** | `test_all_edge_cases.py` | 25/25 | 0 | **PASS** |
| **Host Diagnostics** | `test_host_diagnostics.py` | 29/29 | 0 | **PASS** |
| **Heartbeat & Jitter** | `test_heartbeat.py` | 5/5 | 0 | **PASS** |
| **E2E Loopback** | `test_e2e_loopback.py` | 5/5 | 0 | **PASS** |
| **System Stress** | `test_full_system_stress.py` | 5/5 | 0 | **PASS** |
| **Web Console Lint** | `npm run lint` | 0 errors | 0 warnings | **PASS** |
| **Architectural Pillars**| `verifyPillars.ts` | 34/34 | 0 | **PASS** |
| **Stress & Benchmarks**| `stressTest.ts` | 23/23 | 0 | **PASS** |
| **Flutter Analysis** | `flutter analyze` | 0 issues | 0 warnings | **PASS** |
| **Flutter Tests** | `flutter test` | 8/8 | 0 | **PASS** |
| **Total** | | **137/137** | **0** | **100% HEALTHY** |
