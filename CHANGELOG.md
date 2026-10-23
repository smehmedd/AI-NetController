# Changelog & Patch Notes — CST NetController AI

All notable changes, architectural upgrades, security hardening passes, and UI/UX refinements to **CST NetController AI** are documented in this file.

---

## [v2.5.0] — 2026-10-23 (Apple Liquid Glass & Bento Fleet Architecture Release)

### ✨ Highlights
This release introduces a comprehensive **Apple Liquid Glass (visionOS / macOS)** optical density overhaul, a redesigned **Fleet Dashboard with 3-Tile Bento Card Expansion**, unified **Gemini Copilot model state synchronization**, complete **English (`EN`) & Bulgarian (`BG`) localization**, and hardened **Zero-Trust AST & Cryptographic pipelines** across the Web Console, Flutter Mobile Client, and Python 3.12 Host Daemon.

---

### 🎨 1. 3-Tier Optical Liquid Glass Density System
Eliminated text bleed-through on floating layers by introducing a strict 3-tier optical hierarchy across CSS utilities, `GlassContainer`, `FloatingPillNav`, `BottomSheet`, and all modals:
- **Tier 1 — Resting Canvas Cards (`GlassContainer`)**:
  - `bg-[#0b1324]/55 backdrop-blur-2xl backdrop-saturate-[160%] border border-white/[0.07] border-t-white/[0.16] shadow-[0_12px_32px_rgba(0,0,0,0.4)]`
  - Used for resting device cards and static dashboard panels over the `#050811` canvas.
- **Tier 2 — Floating Chrome (`FloatingPillNav`, Sticky Headers & Command Prompt Bar)**:
  - `bg-[#070c18]/88 backdrop-blur-3xl backdrop-saturate-[190%] border border-white/15 border-t-white/25 shadow-[0_16px_40px_rgba(0,0,0,0.75)]`
  - Completely obscures scrolling content underneath while preserving specular top-edge refraction.
- **Tier 3 — Overlays, Modals, Bottom Sheets & Dropdowns (`BottomSheet`, `WolModal`, `SystemUpdateModal`, `CodeExportModal`, AI Model Selector)**:
  - Rich dimming barrier (`bg-black/75 backdrop-blur-md`) paired with ultra-dense modal surfaces (`bg-[#091020]/95 backdrop-blur-3xl border border-white/15 border-t-white/25 shadow-[0_24px_64px_rgba(0,0,0,0.85)]`).
  - Elevated the Settings AI Model selector dropdown (`z-[70] bg-[#0a1224]/98 backdrop-blur-3xl border border-white/20 shadow-2xl`) so underlying status badges never bleed through menu options.

---

### 🖥️ 2. Fleet Dashboard Decluttering & 3-Tile Bento Expansion
- **Streamlined Top Header (`FleetDashboard.tsx`)**:
  - Consolidated status metrics into an inline status capsule: `[ 🟢 N Online • M Sleeping ]`.
  - Added a 1-tap **`[ ⚡ Wake All (N) ]`** quick-action pill whenever one or more hosts are sleeping, dispatching UDP Magic Packets across all offline hosts simultaneously.
  - Integrated `[Cards | Map]` segmented view switcher and `[EN/BG]` language toggle cleanly in the top-right bar and removed the redundant header search icon.
- **Unified Search, Filter & Sort Strip**:
  - Combined Spotlight search (`⌘K` shortcut hint), `[Refresh]`, and `[+ Add Host]` into a single ergonomic row.
  - Replaced separate sort buttons with a horizontal filter strip (`All`, `Online`, `Sleeping`, `Servers`) on the left and a compact Tier-3 `Sort: Name ▾` popover menu on the right.
- **Redesigned `HostCard` & 3-Tile Bento Drawer (`HostCard.tsx`)**:
  - **Collapsed State**: 44×44px squircle device icon with status glow, hostname, OS badge (`Win 11` / `Linux`), monospace IP, latency pill, 1-tap primary action buttons (`[>_]` Terminal, `[Eye]` Live Screen, or glowing amber `[Power]` when sleeping), and 3px `CPU` / `RAM` telemetry bars for online hosts.
  - **Offline State Fix**: Sleeping hosts now cleanly display `Sleeping • Ready for WoL` without synthetic battery percentages or fake ping metrics.
  - **Expanded 3-Tile Bento Grid**:
    1. **Tile 1 — Live Mini-Screen Preview (16:9)**: Real-time desktop preview thumbnail with a `● LIVE PREVIEW` badge and a full-width `[ ⤢ Open Interactive Screen & Trackpad ]` launcher.
    2. **Tile 2 — 1-Tap Quick OS Actions (2×2 Grid)**: Instant tactile execution for `[ 🔒 Lock PC ]`, `[ 🌐 Flush DNS ]`, `[ 🐳 Restart Docker ]`, and `[ ⚡ Sleep / Wake ]`.
    3. **Tile 3 — Compact Hardware & Network Strip**: 1-click copyable MAC address pill, Disk usage indicator, and a single 60px inline latency sparkline with `RTT: 12ms (±0.6ms jitter)`.

---

### ⌨️ 3. Remote Console & Gemini AI Copilot Synchronization
- **Remote Shell Console (`CommandTerminal.tsx`)**:
  - Removed extra left indentation on host selector pills so they align flush with the terminal card edge.
  - Relocated quick-command preset chips immediately above the bottom command input bar, displaying full localized labels (`ipconfig /all`, `active processes`, `ping google`, `systeminfo`, `disk usage`, `netstat ports`) without mid-word truncation.
- **Gemini AI Copilot (`GeminiChatbot.tsx` & `uiStore.ts`)**:
  - Connected `selectedModel` in `useUIStore` (persisted to `localStorage`) so changing the active model in **Settings → AI Copilot** immediately updates the model badge in the Gemini Copilot header and API payload.
  - Localized the initial Copilot welcome message dynamically in both **English (`EN`)** and **Bulgarian (`BG`)**.

---

### ⚙️ 4. Settings, WoL Scheduler & System Update Center Fixes
- **Green WoL Efficiency Calculator (`WolEnergyCalculator.tsx` & `WolEnergyWeeklyChart.tsx`)**:
  - Collapsed the 500px energy calculator by default into a sleek single-line summary banner (`[ ⚡ Green WoL Efficiency • Est. Savings: 865 kWh/yr (173 €) ]`) with a `[ Customize & View Chart ▾ ]` toggle.
  - Localized 100% of labels, tooltips, weekday axes, and legends in `WolEnergyWeeklyChart.tsx` across English and Bulgarian.
- **Memory Engine Modal (`MemoryManager.tsx`)**:
  - Removed the duplicate inner header card and constrained the host `<select>` dropdown (`w-full max-w-full truncate rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-xs text-cyan-300`) to prevent right-edge overflow.
- **Wake-on-LAN Controller (`WolModal.tsx`)**:
  - Removed the developer-facing `localStorage Sync` badge.
  - Fixed the 12-hour schedule time subtext parser so `(8:00 AM)` and `(7:30 AM)` render cleanly without unmatched parentheses.
- **OTA System Update Center (`SystemUpdateModal.tsx`)**:
  - Simplified component list rows to display at most **2 badges per row** (`Size` + `Status`) and moved version drift and compatibility requirements into a clean subtitle line.
- **Global Viewport Scroll Clearance**:
  - Applied `pb-[calc(env(safe-area-inset-bottom,24px)+6.5rem)]` across `FleetDashboard`, `CommandTerminal`, `GeminiChatbot`, and `SettingsScreen` so bottom content never hides behind the floating navigation pill.

---

### 🛡️ 5. Security, Protocol & Build Stability Fixes
- **Vite Middleware HMR Fix (`apps/web/server.ts`, `apps/web/vite.config.ts`, `apps/web/src/main.tsx`)**:
  - Explicitly disabled HMR WebSocket injection (`hmr: false`) in Express middleware mode and added an `unhandledrejection` guard for `@vite/client` WebSocket transport errors.
- **Zero-Trust Command AST & SSRF Protection (`apps/web/server.ts`, `agent/command_ast_firewall.py`)**:
  - Hardened Windows caret (`^`) and interstitial quote de-obfuscation before AST inspection.
  - Added SSRF protection blocking link-local and cloud metadata endpoints (`169.254.169.254`, `metadata.google.internal`) in custom AI model endpoints.
- **GitHub Actions CI Fix (`.github/workflows/ci.yml`)**:
  - Fixed Python 3.12 job setup step to use `actions/setup-python@v5`.
