# CST NetController AI — v2.9.0 Release Notes

[![Version](https://img.shields.io/badge/version-v2.9.0--LTS-blue.svg)](https://github.com/smehmedd/AI-NetController/releases/tag/v2.9.0)
[![Authenticode](https://img.shields.io/badge/code--signing-O%3DCST__RU--AK-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Windows Defender](https://img.shields.io/badge/windows--defender-clean%20(0%20threats)-success.svg)](https://github.com/smehmedd/AI-NetController)
[![Test Suite](https://img.shields.io/badge/tests-137%2F137%20passing-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Display](https://img.shields.io/badge/display-120Hz%20Zero--Jitter-9cf.svg)](https://github.com/smehmedd/AI-NetController)

> **Release Version:** `v2.9.0-LTS` (Resilient Fallbacks, Direct AI PC Control & Stream Overhaul)  
> **Protocol Specification:** `CST/3.0-SECURE`  
> **Release Date:** October 25, 2026  
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
6cefa35ebbcdf30ccea589c4cf710f1e91748ebecaac0b709150b97c1febd935  CST_HostAgent_v2.9.0_win64_portable.zip
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

### 1. Resilient Dependency Fallbacks & Path Resolution
- **Graceful Import Guards**: The Python Host Agent now incorporates resilient conditional imports for core graphic and capture dependencies (`mss`, `PIL`, `pystray`, `zeroconf`). If an optional module is absent, the daemon alerts the operator and falls back to software rendering rather than terminating.
- **Dynamic Module Pathing**: Enhanced import path discovery ensures agent modules resolve seamlessly across packaged binary runs, IDE sessions, and headless Linux systemd services.

### 2. Direct AI PC Control Suite
- **Expanded Natural Language Actions**: Added direct execution parsing for:
  - `lock_pc` / System Lock (`Win+L`)
  - `task manager` / Activity Monitor (`Ctrl+Shift+Esc`)
  - `desktop` / Show Desktop (`Win+D`)
  - `explorer` / File Manager (`Win+E`)
  - `browser` / Default Browser launch
  - `media_control` / Volume Up, Down, Mute, Play/Pause
- **Unicode Keystroke Ingestion (`type_text`)**: Enhanced text typing engine with automatic Unicode normalization and non-blocking carriage return delivery.
- **Smart Hardware Key Combos (`key_combo`)**: Robust key chord parsing for complex operator shortcuts.

### 3. Remote Screen Stream Engine Overhaul (`ScreenViewerModal.tsx` & `screenFrameService.ts`)
- **Zero-Latency Ingestion Pipeline**: Refactored frame ingestion with unboxed ring buffers and asynchronous canvas blitting.
- **Adaptive Bandwidth Throttling**: Auto-scales frame interval and quality based on network ping jitter (RFC 3550) and dirty-tile variance.
- **Lean Distribution OTA Route**: Implemented automatic HTTP 302 redirects in `/releases/:version/:filename` falling back to official GitHub Releases for lean web deployments.

### 4. Full Ecosystem Version Alignment (`v2.9.0` / `Build 30`)
- **Web Console**: `v2.9.0-LTS` with complete keyboard shortcuts, diagnostic telemetry HUD, and multi-version download center.
- **Host Daemon**: `2.9.0-LTS` with Authenticode SHA-256 signature `O=CST_RU-AK` and Windows Defender verification (`0 threats`).
- **Mobile Client**: Build `2.9.0+30` with 120Hz dynamic display negotiation and haptic feedback.

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
