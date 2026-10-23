# Patch Notes — CST NetController AI v2.5.0

**Release Date:** October 23, 2026  
**Version:** `v2.5.0-LTS`  
**Protocol Version:** `CST/3.0-SECURE`

---

## Summary of Changes

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
