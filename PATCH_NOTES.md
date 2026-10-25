# CST NetController AI - v2.7.1 Release Notes

[![Version](https://img.shields.io/badge/version-v2.7.1--LTS-blue.svg)](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1)
[![Authenticode](https://img.shields.io/badge/code--signing-O%3DCST__RU--AK-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Windows Defender](https://img.shields.io/badge/windows--defender-clean%20(0%20threats)-success.svg)](https://github.com/smehmedd/AI-NetController)
[![Test Suite](https://img.shields.io/badge/tests-137%2F137%20passing-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Display](https://img.shields.io/badge/display-120Hz%20Zero--Jitter-9cf.svg)](https://github.com/smehmedd/AI-NetController)

> **Release Version:** `v2.7.1-LTS` (Maintenance & Hardening Release)  
> **Protocol Specification:** `CST/3.0-SECURE`  
> **Release Date:** October 25, 2026  
> **Previous Stable Version:** [`v2.7.0`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0) (Available simultaneously)

---

## :package: Official Release Binaries (v2.7.1)

All binaries are pre-compiled, cryptographically signed with Authenticode (`O=CST_RU-AK`), and verified against Windows Defender heuristic detection (`0 threats found`).

| File / Artifact | Target Platform | Size | Direct Download |
| :--- | :--- | :---: | :---: |
| **`CST_HostAgent_v2.7.1_win64.exe`** | Windows 10 / 11 (`x86_64` PE32+ GUI) | 35.3 MB | [Download EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_HostAgent_v2.7.1_win64.exe) |
| **`CST_HostAgent_v2.7.1_win64_portable.zip`** | Windows 10 / 11 (`x86_64` Portable Bundle) | 36.6 MB | [Download Portable ZIP](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_HostAgent_v2.7.1_win64_portable.zip) |
| **`CST_NetController_AI_v2.7.1_arm64-v8a.apk`** | Android 10 - 15 (`arm64-v8a` High-Refresh 120Hz) | 22.8 MB | [Download APK (arm64-v8a)](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_NetController_AI_v2.7.1_arm64-v8a.apk) |
| **`CST_NetController_AI_v2.7.1.apk`** | Android 10 - 15 (Universal Package) | 22.8 MB | [Download APK (Universal)](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_NetController_AI_v2.7.1.apk) |
| **`SHA256SUMS.txt`** | Checksum Verification List | 409 B | [Download SHA256](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/SHA256SUMS.txt) |
| **`RELEASE_MANIFEST.json`** | Structured Metadata Manifest | 1.8 KB | [Download Manifest](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/RELEASE_MANIFEST.json) |

<details>
<summary><b>:lock: Cryptographic SHA-256 Checksums (Click to expand)</b></summary>

```text
fb64a8f8d609fccf37582e78914c810ee488b78d28ffb6d49602c6b851d4f90f  CST_HostAgent_v2.7.1_win64.exe
f56d3250a5f4a4f468d27ebdc66832decaaee22aa2df7b34d75547d446f9f6cb  CST_HostAgent_v2.7.1_win64_portable.zip
54dcabd909c03bb282c9fa28f2c8c95a2378491c49c30ac9b157399016b89751  CST_NetController_AI_v2.7.1_arm64-v8a.apk
54dcabd909c03bb282c9fa28f2c8c95a2378491c49c30ac9b157399016b89751  CST_NetController_AI_v2.7.1.apk
```
</details>

---

## 📦 Previous Stable Release (v2.7.0)

Version `v2.7.0` remains fully available and maintained on the Releases page:

| Artifact (v2.7.0) | Direct Download Link |
| :--- | :--- |
| **`CST_HostAgent_v2.7.0_win64.exe`** | [Download v2.7.0 EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_HostAgent_v2.7.0_win64.exe) |
| **`CST_NetController_AI_v2.7.0_arm64-v8a.apk`** | [Download v2.7.0 APK](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_NetController_AI_v2.7.0_arm64-v8a.apk) |
| **`CST_HostAgent_v2.7.0_win64_portable.zip`** | [Download v2.7.0 ZIP](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_HostAgent_v2.7.0_win64_portable.zip) |

---

## :rocket: Performance Improvements & Quantitative Benchmarks

| Subsystem / Metric | Before (`v2.5.0`) | After (`v2.7.1`) | Improvement |
| :--- | :---: | :---: | :--- |
| **Mobile Display Refresh Rate** | 60 Hz locked | **120 Hz / 90 Hz Auto** | **2.0x smoother** (Dynamic Android mode negotiation) |
| **Mobile Stream GC Heap Churn** | ~18.4 MB/s allocations | **0 MB/s (0 bytes allocated)** | **100% eliminated** (Dual 4MB pre-allocated ring buffer) |
| **Mobile Frame UI Rebuild Latency** | 14.2 ms / frame (`setState()`) | **1.1 ms / frame** (`ValueNotifier`) | **12.9x faster** (Direct GPU `RawImage` canvas repaint) |
| **Desktop Capture Stream Interval** | 16.0 ms (60 FPS cap) | **8.0 ms (120 FPS pacing)** | **2.0x higher framerate** (120Hz high-refresh pacing) |
| **Host Daemon GUI Log Redraw Overhead** | 18.5 ms (Full wipe & rewrite) | **0.12 ms** (Differential append) | **154.2x faster** ($O(1)$ flicker-free line appending) |
| **Host Telemetry Refresh Cadence** | 1500 ms (0.67 Hz sluggish) | **250 ms (4.0 Hz fluid)** | **6.0x more responsive** (Sub-second meter responsiveness) |
| **WoL Magic Packet Generation (1k pkt)** | 262.00 ms (`3,816 pkt/s`) | **4.14 ms** (`~241,346 pkt/s`) | **63.2x faster** (`HEX_LUT` 256-byte table + zero `RegExp`) |
| **Binary Wire Framing (25k pkt)** | 37.22 ms | **6.30 ms** (`~3.97M pkt/s`) | **5.9x faster** (Pre-allocated `DataView` control frame pool) |
| **Telemetry Ring Buffer (50k cycles)** | 13.11 ms (`Array.shift()`) | **2.87 ms** (`~17.4M ops/s`) | **4.6x faster** (Contiguous unboxed `Float64RingBuffer` $O(1)$) |
| **High-Frequency Telemetry Flood (20k)** | 8.40 ms | **0.55 ms** | **15.2x faster** ($O(1)$ circular pointer wrap-around) |
| **Host Command RateLimiter (10k checks)** | 19.20 ms (`.filter()`) | **3.04 ms** | **6.3x faster** (In-place timestamp head eviction) |
| **Python AEAD Decryption (1 MB)** | 23.20 ms | **21.40 ms** | **Zero-Copy C-Extension `memoryview`** (< 35ms SLA) |
| **Python Spatial Delta Skip (60-frames)** | 2.90 ms | **2.70 ms** | **0.045 ms/frame** (Adler-32 4x4 spatial delta skip) |

---

## :sparkles: What's New in v2.7.1

### 1. Hardening & Verification Pass
* **Zero-Defect Verification**: Executed exhaustive system-wide feature and stress audit across all tiers with **137/137 passing tests**.
* **Clean Release Multi-Version Availability**: Configured release distribution system so both `v2.7.0` and `v2.7.1` are simultaneously accessible in the Releases tab and in-app download centers.
* **Release Manifest Fallback & Negotiation**: Upgraded `/api/releases` endpoint in `server.ts` to support multi-version manifest queries and fallback resolution.

### 2. Standalone Windows Executable & Mobile Package Updates
* Recompiled standalone `CST_HostAgent_v2.7.1_win64.exe` with embedded PE metadata `2.7.1.0` and Authenticode digital signature `CN=Computer Systems and Technologies (CST), O=CST_RU-AK, C=BG`.
* Windows Defender heuristic scan: **CLEAN (0 threats found)**.
* Built updated Flutter release APKs for ARM64-v8a with tree-shaken assets and 120Hz display configuration (`version: 2.7.1+28`).

---

## :test_tube: Verification & Test Suite Summary

All 9 test suites passing (**137/137 tests passing**):

* **Host Agent Security & Edge Cases**: `25/25 PASSED`
* **Host Diagnostics & Telemetry**: `29/29 PASSED`
* **End-to-End WebSocket Loopback**: `5/5 PASSED`
* **Heartbeat & Session Tracking**: `5/5 PASSED`
* **Agent Concurrency Stress**: `3/3 PASSED`
* **Full-System Orchestration**: `5/5 PASSED`
* **Core Web & Security Pillars**: `34/34 PASSED`
* **Web Stress & Multi-Resolution**: `23/23 PASSED`
* **Flutter Protocol & Crypto Suite**: `8/8 PASSED`
* **TypeScript & ESLint Check**: `0 errors, 0 warnings`
* **Flutter Code Analyzer**: `0 errors, 0 warnings`
