# Patch Notes — CST NetController AI v2.6.0

**Release Date:** October 23, 2026  
**Version:** `v2.6.0-LTS`  
**Protocol Version:** `CST/3.0-SECURE`

---

## Quantitative Performance Benchmarks (`v2.5.0` → `v2.6.0`)

| Subsystem Benchmark | Before (`v2.5.0`) | After (`v2.6.0`) | Speedup / Improvement |
| :--- | :---: | :---: | :--- |
| **WoL Magic Packet Generation (1,000 packets)** | `262.00 ms` (`3,816 pkt/s`) | **`4.33 – 4.81 ms`** (`~215,000+ pkt/s`) | **54.5× – 60.5× faster** (`HEX_LUT` 256-byte table + zero `Intl`/`RegExp` allocations) |
| **Binary Wire Framing (25,000 packets)** | `32.56 – 63.41 ms` | **`5.61 – 11.68 ms`** (`~4.45M pkt/s`) | **5.4× – 5.8× faster** (Pre-allocated `DataView` control frame pool) |
| **Telemetry Ring Buffer (50,000 cycles, cap 200)** | `11.33 – 30.80 ms` (`Array.shift()`) | **`2.84 – 3.33 ms`** (`~17.5M ops/s`) | **4.0× – 9.3× faster** (Contiguous unboxed `Float64RingBuffer` $O(1)$) |
| **High-Frequency Telemetry Flood (20,000 frames)** | `8.40 ms` | **`0.68 – 0.75 ms`** | **11.2× – 12.4× faster** ($O(1)$ circular pointer wrap-around) |
| **Host Command RateLimiter (10,000 burst checks)** | `19.20 ms` (`.filter()`) | **`3.25 – 4.16 ms`** | **4.6× – 5.9× faster** (In-place timestamp head eviction) |
| **Python ChaCha20-Poly1305 AEAD (1 MB payload)** | `23.20 ms` | **`21.40 ms`** | **Zero-Copy C-Extension `memoryview` (< 35ms SLA)** |
| **Python Display Pipeline (60-Frame Delta Burst)** | `2.90 ms` | **`2.70 ms`** | **0.045 ms/frame** (Adler-32 4×4 spatial delta skip) |

---

## Summary of Changes in v2.6.0 & v2.5.0

### 0. v2.6.0 Ecosystem Upgrades, Zero-Allocation Hot Paths & Security Hardening
- **Full-Stack Dependency Upgrades**:
  - **Web**: `@google/genai ^1.52.0`, `react ^19.3.1`, `vite ^6.4.5`, `@tailwindcss/vite ^4.3.3`, `motion ^12.43.0`, `zustand ^5.0.16`, `recharts ^2.15.4`, `express ^4.22.3`, `tsx ^4.23.15`, `typescript ~5.8.3`.
  - **Python Agent**: `websockets>=15.0.1`, `aiohttp>=3.11.16`, `zeroconf>=0.146.1`, `PyTurboJPEG>=1.7.7`, `cryptography>=44.0.2`, `psutil>=7.0.0`, `pyinstaller>=6.12.0`.
  - **Flutter Mobile**: `Flutter >=3.29.0`, `Dart >=3.7.0`, Android `compileSdk 36` / `targetSdk 36`, `web_socket_channel ^3.0.2`, `network_info_plus ^6.1.3`, `vibration ^3.1.3`, `crypto ^3.0.6`.
- **Gemini 3.8 Model Registry**: Upgraded AI model defaults and fallback chain to `gemini-3.8-flash`, `gemini-3.1-flash-lite`, and `gemini-flash-latest`.
- **Security Hardening (`v2026.10-REV5`)**: Added RFC 6479 128-bit bitmap anti-replay protection in `networkWorker.ts`, HTTP security headers and 120 req/min sliding-window rate limiting in `server.ts`, and expanded AST de-obfuscation (`^`, `` ` ``, interstitial quotes, `%VAR:~x,y%` substring slicing) across Web and Python Agent.

### 1. 3-Tier Optical Liquid Glass Architecture
- **Tier 1 (Resting Canvas Cards)**: Applied `bg-[#0b1324]/55 backdrop-blur-2xl backdrop-saturate-[160%]` with top-edge specular highlights (`border-t-white/[0.16]`) to `GlassContainer` and device cards.
- **Tier 2 (Floating Chrome)**: Applied `bg-[#070c18]/88 backdrop-blur-3xl backdrop-saturate-[190%]` to `FloatingPillNav`, sticky headers, and the terminal prompt bar to prevent underlying text bleed-through.
- **Tier 3 (Modals, Sheets & Popovers)**: Applied `bg-black/75 backdrop-blur-md` backdrops and `bg-[#091020]/95 backdrop-blur-3xl` surfaces to `BottomSheet`, `WolModal`, `SystemUpdateModal`, `CodeExportModal`, and `z-[70] bg-[#0a1224]/98` to the Settings AI Model selector menu.

### 2. Fleet Dashboard & 3-Tile Bento Device Card
- **Top Bar Consolidation**: Inline `[ 🟢 Online • Sleeping ]` counter pill, 1-tap **`[ ⚡ Wake All (N) ]`** broadcast button when offline hosts are detected, `[Cards | Map]` toggle, and `[EN/BG]` language switch.
- **Unified Search & Filter Strip**: Single-row search bar with `⌘K` shortcut hint, `[Refresh]`, `[+ Add Host]`, filter pills (`All`, `Online`, `Sleeping`, `Servers`), and a compact `Sort: Name ▾` dropdown menu.
- **Collapsed `HostCard`**: 44×44px squircle icon, OS badge, monospace IP, latency badge, 1-tap `[>_]` Terminal / `[Eye]` Live Screen / `[Power]` Wake buttons, and 3px `CPU` & `RAM` progress bars. Fixed sleeping hosts to show `Sleeping • Ready for WoL` without fake battery or ping stats.
- **Expanded 3-Tile Bento Grid**:
  - **Tile 1**: 16:9 Live Mini-Screen Preview with `● LIVE PREVIEW` overlay and `[ ⤢ Open Interactive Screen & Trackpad ]` button.
  - **Tile 2**: 2×2 1-Tap Quick OS Actions (`Lock PC`, `Flush DNS`, `Restart Docker`, `Sleep / Wake`).
  - **Tile 3**: Compact Hardware & Network Strip with 1-click MAC copy, Disk usage, 60px inline sparkline, and `RTT / jitter` metrics.

### 3. Console & Gemini Copilot Enhancements
- **Flush Host Selector & Bottom Preset Strip**: Aligned host selector pills flush-left in `CommandTerminal.tsx` and moved localized, non-truncating command preset chips directly above the bottom command input bar.
- **Shared AI Model State & Dynamic Greeting**: Synced `selectedModel` via `useUIStore` between `SettingsScreen.tsx` and `GeminiChatbot.tsx`, and localized the initial Copilot greeting in English (`EN`) and Bulgarian (`BG`).

### 4. Settings, Modals & Build Fixes
- **Green WoL Efficiency Calculator**: Collapsed by default into a compact summary banner (`Est. Savings: 865 kWh/yr`) with `[ Customize & View Chart ▾ ]`, plus full EN/BG localization in `WolEnergyWeeklyChart.tsx`.
- **Memory Engine**: Removed redundant inner header card and fixed host `<select>` overflow with `w-full max-w-full truncate`.
- **WoL Scheduler**: Removed internal `localStorage Sync` badge and fixed 12-hour schedule time subtext formatting (`8:00 AM`).
- **System Update Center**: Capped component row badges to 2 (`Size` + `Status`) and moved compatibility/drift details into a subtle subtitle.
- **Vite Middleware & CI**: Fixed `@vite/client` WebSocket transport errors by setting `hmr: false` in middleware mode and updated GitHub Actions CI (`actions/setup-python@v5`).
