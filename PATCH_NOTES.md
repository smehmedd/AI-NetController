# CST NetController AI - v2.8.0 Release Notes

[![Version](https://img.shields.io/badge/version-v2.8.0--LTS-blue.svg)](https://github.com/smehmedd/AI-NetController/releases/tag/v2.8.0)
[![Authenticode](https://img.shields.io/badge/code--signing-O%3DCST__RU--AK-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Windows Defender](https://img.shields.io/badge/windows--defender-clean%20(0%20threats)-success.svg)](https://github.com/smehmedd/AI-NetController)
[![Test Suite](https://img.shields.io/badge/tests-137%2F137%20passing-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Display](https://img.shields.io/badge/display-120Hz%20Zero--Jitter-9cf.svg)](https://github.com/smehmedd/AI-NetController)

> **Release Version:** `v2.8.0-LTS` (QoL, Stream HUD, Usability & Polishing Release)  
> **Protocol Specification:** `CST/3.0-SECURE`  
> **Release Date:** October 25, 2026  
> **Previous Releases:** [`v2.7.1`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1) and [`v2.7.0`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0) (Both remain available in the Releases tab)

---

## :package: Official Release Binaries (v2.8.0)

All binaries are pre-compiled, cryptographically signed with Authenticode (`O=CST_RU-AK`), and verified against Windows Defender heuristic detection (`0 threats found`).

| File / Artifact | Target Platform | Size | Direct Download |
| :--- | :--- | :---: | :---: |
| **`CST_HostAgent_v2.8.0_win64.exe`** | Windows 10 / 11 (`x86_64` PE32+ GUI) | 35.3 MB | [Download EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_HostAgent_v2.8.0_win64.exe) |
| **`CST_HostAgent_v2.8.0_win64_portable.zip`** | Windows 10 / 11 (`x86_64` Portable Bundle) | 34.7 MB | [Download Portable ZIP](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_HostAgent_v2.8.0_win64_portable.zip) |
| **`CST_NetController_AI_v2.8.0_arm64-v8a.apk`** | Android 10 - 15 (`arm64-v8a` High-Refresh 120Hz) | 21.8 MB | [Download APK (arm64-v8a)](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_NetController_AI_v2.8.0_arm64-v8a.apk) |
| **`CST_NetController_AI_v2.8.0.apk`** | Android 10 - 15 (Universal Package) | 21.8 MB | [Download APK (Universal)](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_NetController_AI_v2.8.0.apk) |
| **`SHA256SUMS.txt`** | Checksum Verification List | 409 B | [Download SHA256](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/SHA256SUMS.txt) |
| **`RELEASE_MANIFEST.json`** | Structured Metadata Manifest | 1.8 KB | [Download Manifest](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/RELEASE_MANIFEST.json) |

<details>
<summary><b>:lock: Cryptographic SHA-256 Checksums (Click to expand)</b></summary>

```text
657a2ffe752c3e8a52c2684423e6f270daff71b50ab9fcbb1a754e3156a67403  CST_HostAgent_v2.8.0_win64.exe
f4d239a1d04222695129d7e1a61c355bab9d2b76bdcd763ecd8df4e16a64e35c  CST_HostAgent_v2.8.0_win64_portable.zip
1280ded4104225baadf68ecfb3f627d42871b6d9488a9513e37e786776708c2a  CST_NetController_AI_v2.8.0_arm64-v8a.apk
1280ded4104225baadf68ecfb3f627d42871b6d9488a9513e37e786776708c2a  CST_NetController_AI_v2.8.0.apk
```
</details>

---

## 📦 Previous Stable Releases (Preserved in Releases Tab)

All previous versions remain fully accessible on the GitHub Releases tab:
- **`v2.7.1`**: [View Release Notes](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1) • [Download v2.7.1 EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_HostAgent_v2.7.1_win64.exe) • [Download v2.7.1 APK](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_NetController_AI_v2.7.1_arm64-v8a.apk)
- **`v2.7.0`**: [View Release Notes](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0) • [Download v2.7.0 EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_HostAgent_v2.7.0_win64.exe) • [Download v2.7.0 APK](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_NetController_AI_v2.7.0_arm64-v8a.apk)

---

## :sparkles: Key QoL Refinements & Usability Polish (v2.8.0)

### 1. Live Remote Stream HUD & True Fullscreen (`F` & `I`)
- **Diagnostic Telemetry HUD**: Press `I` or click the telemetry badge in the screen stream viewer to toggle a translucent real-time overlay displaying FPS (120/60/30), RTT ping latency, Adler-32 SIMD delta stats, and viewport downsampling resolution.
- **One-Key Fullscreen**: Press `F` or tap the fullscreen button to expand the remote desktop canvas to the edge of the display with hardware-accelerated letterboxing/pillarboxing.
- **Target Frame Rate Selector**: Seamlessly switch between 120 FPS (High-Refresh), 60 FPS (Balanced), and 30 FPS (Eco Bandwidth).

### 2. Interactive Keyboard Shortcuts Sheet (`?` / `Shift + /`)
- A new glassmorphic cheat sheet modal opens instantly when pressing `?` or tapping the shortcuts button in the top bar.
- Clearly displays hotkeys across Global Navigation (`1`-`4`), Search (`⌘K`, `/`), Refresh (`R`), Stream controls (`F`, `I`, `Esc`), and Command Terminal history (`↑`, `↓`).

### 3. Fleet Search, Counter & Quarantine Filter
- **Live Match Counter**: Shows real-time host match ratios (e.g. `4/6 hosts`) inside the search input as you type.
- **Quick-Clear Button (`X`)**: Instant one-click clearing of search queries.
- **Quarantined Filter Tab**: Added dynamic status pill that automatically appears when quarantined hosts are active, letting administrators isolate compromised workstations in one click.

### 4. Command Terminal One-Click Diagnostic Chips
- Added interactive diagnostic preset chips (`ipconfig /all`, `systeminfo`, `uptime`, `Get-Process Top 5`, `netstat`) below the command input, eliminating repetitive manual typing during system diagnostics.
- Added copy-to-clipboard button on every command execution card with animated `✓ Copied` visual feedback.

### 5. Native Host Agent GUI Feedback & Status Badges
- Added animated `✓ URI Copied to Clipboard` and `✓ Pairing Key Copied` banner notifications in the native Tkinter Control Center, eliminating ambiguity when copying credentials.
- Enhanced status badge with color-coded pulsing indicator: Green for `ONLINE — LISTENING`, Amber for `VIEW-ONLY MODE` and `PAUSED`, Red for `QUARANTINED`.

### 6. Mobile 120Hz Client Polish
- Upgraded mobile client to build `2.8.0+29`.
- Added tactile `HapticFeedback` on card selections, trackpad taps, and quick key dispatches.
- Added verified build tile in mobile settings pane confirming 120Hz Impeller hardware acceleration.

---

## :white_check_mark: Full Test Suite Verification (137/137 Passed)

| Subsystem | Suite | Passed | Failures | Status |
| :--- | :--- | :---: | :---: | :---: |
| **Python Edge Cases** | `test_all_edge_cases.py` | 25/25 | 0 | **PASS** |
| **Host Diagnostics** | `test_host_diagnostics.py` | 29/29 | 0 | **PASS** |
| **Heartbeat & Jitter** | `test_heartbeat.py` | 5/5 | 0 | **PASS** |
| **E2E Loopback** | `test_e2e_loopback.py` | 5/5 | 0 | **PASS** |
| **System Stress** | `test_full_system_stress.py` | 5/5 | 0 | **PASS** |
| **Process Supervision** | `test_agent_stress.py` | 3/3 | 0 | **PASS** |
| **Web Console Lint** | `npm run lint` | 0 errors | 0 warnings | **PASS** |
| **Architectural Pillars**| `verifyPillars.ts` | 34/34 | 0 | **PASS** |
| **Stress & Benchmarks**| `stressTest.ts` | 23/23 | 0 | **PASS** |
| **Flutter Analysis** | `flutter analyze` | 0 issues | 0 warnings | **PASS** |
| **Flutter Tests** | `flutter test` | 8/8 | 0 | **PASS** |
| **Total** | | **137/137** | **0** | **100% HEALTHY** |
