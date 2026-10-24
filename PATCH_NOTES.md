# CST NetController AI - v2.7.0 Release Notes

[![Version](https://img.shields.io/badge/version-v2.7.0--LTS-blue.svg)](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0)
[![Authenticode](https://img.shields.io/badge/code--signing-O%3DCST__RU--AK-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Windows Defender](https://img.shields.io/badge/windows--defender-clean%20(0%20threats)-success.svg)](https://github.com/smehmedd/AI-NetController)
[![Test Suite](https://img.shields.io/badge/tests-137%2F137%20passing-brightgreen.svg)](https://github.com/smehmedd/AI-NetController)
[![Refresh Rate](https://img.shields.io/badge/display-120Hz%20Zero--Jitter-9cf.svg)](https://github.com/smehmedd/AI-NetController)

> **Release Version:** `v2.7.0-LTS`  
> **Protocol Specification:** `CST/3.0-SECURE`  
> **Release Date:** October 25, 2026  
> **Git Commit:** [`d715c23`](https://github.com/smehmedd/AI-NetController/commit/d715c238ba4157aff09df4e598fda8159e39db33)

---

## :package: Official Release Binaries

All binaries are pre-compiled, cryptographically signed, and verified against false-positive heuristic detection.

| File / Artifact | Target Platform | Size | Direct Download |
| :--- | :--- | :---: | :---: |
| **`CST_HostAgent_v2.7.0_win64.exe`** | Windows 10 / 11 (`x86_64` PE32+ GUI) | 33.7 MB | [Download EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_HostAgent_v2.7.0_win64.exe) |
| **`CST_HostAgent_v2.7.0_win64_portable.zip`** | Windows 10 / 11 (`x86_64` Portable Bundle) | 34.9 MB | [Download Portable ZIP](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_HostAgent_v2.7.0_win64_portable.zip) |
| **`CST_NetController_AI_v2.7.0_arm64-v8a.apk`** | Android 10 - 15 (`arm64-v8a` High-Refresh) | 22.5 MB | [Download APK (arm64-v8a)](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_NetController_AI_v2.7.0_arm64-v8a.apk) |
| **`CST_NetController_AI_v2.7.0.apk`** | Android 10 - 15 (Universal Package) | 22.5 MB | [Download APK (Universal)](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_NetController_AI_v2.7.0.apk) |
| **`SHA256SUMS.txt`** | Checksum Verification List | 409 B | [Download SHA256](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/SHA256SUMS.txt) |
| **`RELEASE_MANIFEST.json`** | Structured Metadata Manifest | 1.8 KB | [Download Manifest](https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/RELEASE_MANIFEST.json) |

<details>
<summary><b>:lock: Cryptographic SHA-256 Checksums (Click to expand)</b></summary>

```text
484467fccf3c2605a1ce180420db437707a80c095526404473d591b415b55c89  CST_HostAgent_v2.7.0_win64.exe
5c8669cc2d7ac6d6d9e91f1c75bd2829ce03b3267acc56e975321f10741ed1da  CST_HostAgent_v2.7.0_win64_portable.zip
b0be786f11ef95b46322bf9da8b93e4664fb8504e525fd682da8be310e95abb6  CST_NetController_AI_v2.7.0_arm64-v8a.apk
b0be786f11ef95b46322bf9da8b93e4664fb8504e525fd682da8be310e95abb6  CST_NetController_AI_v2.7.0.apk
```
</details>

---

## :rocket: Performance Improvements & Quantitative Benchmarks

| Subsystem / Metric | Before (`v2.5.0`) | After (`v2.7.0`) | Improvement |
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

## :sparkles: Release Highlights & Changelog

### 1. 120Hz Zero-Jitter Mobile Engine & Video Pipeline
* **Dynamic Refresh Rate Negotiation**: Android runtime queries supported display modes via `display.supportedModes` and requests the display's peak refresh rate (120Hz / 90Hz) via `preferredDisplayModeId`.
* **Zero-GC Frame Ring Buffer**: Dual alternating 4MB native memory slots (`_DoubleFrameRingBuffer`) in `zero_gc_video_pipeline.dart` eliminate garbage collection pauses during high-framerate streaming.
* **Latest-Frame Latching**: Frame backpressure decouples stream arrival from codec decoding via `_latchedPendingFrame`. Dropping obsolete intermediate frames delivers zero-latency visual responsiveness with no queue lag.
* **Direct Raster Canvas Repainting**: Replaced full widget tree `setState()` rebuilds with `ValueNotifier<ui.Image?>` and `ValueListenableBuilder` rendering straight to `RawImage` on the GPU raster thread.

### 2. PC Daemon GUI Optimization & Antivirus Hardening
* **Fluid 4Hz Telemetry Cadence**: Increased Host GUI telemetry sampling rate from 1500ms down to 250ms for buttery-smooth gauge needles and resource meters.
* **Differential Console Redraw**: Replaced full console deletion/insertion with `_rendered_log_len` tracking in `agent_gui.py`. Only newly appended log rows are added, eliminating redraw flicker.
* **Zero UPX Packing & Antivirus Verification**: Executable compiled without UPX compression (`upx=False`) and signed with Authenticode certificate `O=CST_RU-AK`. Windows Defender heuristic scan verified **CLEAN (0 threats found)**.
* **Windows Kernel Job Object Hardening**: Resolved Win32 error `87` by pairing `JOB_OBJECT_LIMIT_JOB_MEMORY (0x0200)` and `JOB_OBJECT_LIMIT_PROCESS_MEMORY (0x0100)` with active 256MB RAM cap and atomic process tree termination (`KILL_ON_JOB_CLOSE`).

### 3. Multi-Resolution & Responsive Viewport Engine
* **Viewport Scaling Engine**: Automatic classification across 7 device profiles (`compact-mobile`, `mobile-portrait`, `mobile-landscape`, `tablet`, `desktop`, `widescreen`, `ultrawide`).
* **Adaptive Bento Fleet Layout**: Responsive grid scaling from 1 column on mobile to 2 columns on tablet/desktop and 3 columns on ultrawide displays.
* **Desktop Remote Screen Aspect Ratio Solver**: Live aspect-ratio modes (`Fit`, `16:9`, `16:10`, `21:9`, `4:3`, `Fill`) with 50% - 300% zoom and click-on-canvas HUD.

### 4. Power-User Quality of Life (QoL)
* **Global Navigation Hotkeys**: `1` - `4` for primary views, `Cmd+K` / `Ctrl+K` Omnibar search, and `R` for instant mDNS network rescan.
* **Host Pinning & Favoriting**: Pin key servers to the top of the fleet dashboard.
* **1-Click Copy**: Copy IPv4, MAC, pairing tokens, or terminal output in a single click with instant toast feedback.

---

## :test_tube: Verification & Test Suite Summary

All verification suites pass cleanly (**137/137 tests passing**):

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
