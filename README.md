# CST NetController AI

[![CI Workflow](https://github.com/cst-netcontroller/cst-netcontroller-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/cst-netcontroller/cst-netcontroller-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev)
[![TypeScript 5.8](https://img.shields.io/badge/TypeScript-5.8-3178c6.svg)](https://www.typescriptlang.org/)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776ab.svg)](https://www.python.org/)
[![Flutter 3.27](https://img.shields.io/badge/Flutter-3.27-02569b.svg)](https://flutter.dev)

> **Autonomous LAN PC Inspector, Fleet Manager & Agentic OS Bridge**  
> A multi-platform network management and remote host execution suite featuring an Apple Liquid Glass React 19 web console, a Flutter mobile client, and a zero-trust Python host agent daemon.

---

## Key Features

* **High-Throughput Binary Wire Protocol (`CST/3.0-SECURE`)**: Zero-allocation DataView framing (`0xC5 0x71` magic header) parsing over **12.5M packets/sec**.
* **Zero-Trust Hardened Security**:
  * **AST Command Firewall**: Pre-compiled regex AST analyzer preventing command injection and shell escape vectors.
  * **RFC 6479 Anti-Replay**: 128-bit bitmap sliding window sequence verification.
  * **HMAC-SHA256 Handshake**: Constant-time authentication with single-use monotonic nonces.
  * **Sandboxed Execution**: Windows Kernel Job Object memory containment (256MB hard cap) with escalating termination supervision (`SIGINT -> SIGTERM -> SIGKILL`).
* **Agentic Gemini AI Copilot**: Multi-turn natural language diagnostic shell powered by `@google/genai` with prompt routing for Fleet, Security, and Terminal triage.
* **Apple Liquid Glass UI System**: Responsive glassmorphic layout with Samsung One UI pill navigation, 120Hz spring physics, and full Bulgarian (`BG`) / English (`EN`) localization.
* **Zero-GC Display Pipeline**: 60–120 FPS remote desktop streaming with Adler-32 spatial delta hashing and recycled VRAM texture slots.
* **Wake-on-LAN & Energy Calculator**: Scheduled waking routines with interactive green energy efficiency calculator.

---

## Project Structure

```text
cst-netcontroller-ai/
├── agent/                         # Python 3.12 Host Agent Daemon
│   ├── agent.py                   # Core daemon entry point (WebSocket, System Tray, Sandboxing)
│   ├── command_ast_firewall.py    # Pre-compiled AST Command Firewall & Security Inspector
│   ├── multi_monitor_streamer.py  # Zero-copy screen capture & Adler-32 spatial delta stream
│   ├── requirements.txt           # Pinned production Python dependencies
│   └── tests/                     # Automated unit, diagnostic & edge case test suites
├── apps/
│   ├── mobile/                    # Flutter 3.27 / Dart Mobile Client
│   │   ├── lib/                   # Zero-GC video pipeline, binary framer & glass UI
│   │   ├── pubspec.yaml           # Flutter dependencies and assets configuration
│   │   └── build_apk.bat          # 1-Click Android APK release compiler
│   └── web/                       # React 19 + TypeScript 5.8 Web Console
│       ├── server.ts              # Express API server with Gemini AI API & update routes
│       ├── src/                   # React components, Zustand stores, i18n & D3 topology
│       └── tests/                 # 34-Pillar verification and 13-phase stress test harnesses
├── docs/                          # Comprehensive technical architecture & compilation guides
├── .github/workflows/ci.yml       # GitHub Actions CI workflow
├── CONTRIBUTING.md                # Open-source contribution guidelines
├── LICENSE                        # MIT Open Source License
├── package.json                   # Web console dependencies & npm scripts
└── SECURITY.md                    # Vulnerability reporting & security policy
```

---

## Quick Start

### 1. Web Console (React + Express)

**Prerequisites:** Node.js 22+ and npm.

```bash
# 1. Install Node dependencies
npm install

# 2. Configure Environment Variables (Optional for Gemini AI)
cp .env.example .env
# Edit .env and set GEMINI_API_KEY

# 3. Start Development Server
npm run dev

# 4. Execute Verification & Stress Test Suite
npm test
```

### 2. Python Host Agent Daemon

**Prerequisites:** Python 3.11+.

```bash
# 1. Install agent dependencies
python -m pip install -r agent/requirements.txt

# 2. Run Edge Case & Host Diagnostic Tests
python agent/tests/test_all_edge_cases.py
python agent/tests/test_host_diagnostics.py

# 3. Start Host Agent Daemon
python agent/agent.py
```

### 3. Flutter Mobile App

**Prerequisites:** Flutter SDK 3.27+ and Android SDK Platform 36.

```bash
cd apps/mobile
flutter pub get
flutter run
```

## Upload to GitHub

Create an empty repository on GitHub (without adding a README, license, or `.gitignore`), then run these commands from the project directory. Replace the remote URL with the URL of your repository:

```bash
git init -b main
git add .
git status
```

Review the staged files before committing. Make sure you have not added real API keys, credentials, or other private data. Then commit and push:

```bash
git commit -m "Initial project upload"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

The `.gitignore` excludes local IDE settings, dependencies, build outputs, and common signing credentials. Keep `.env.example` as a template, and store real secrets outside the repository.

---

## Verification & Benchmarks

Execute the automated test harness:

```bash
npm test
```

```text
================================================================
  CST NetController AI - Automated 14-Pillar Verification Harness
================================================================
  ✅ [PASS] Pillar 1 (Binary Protocol): Zero-allocation DataView reads 0xC5 0x71 magic
  ✅ [PASS] Pillar 2 (Heartbeat Ring Buffer): Buffer capped at capacity 20 without memory leaks
  ✅ [PASS] Pillar 6 (HITL Risk Assessment): Accurately flags destructive commands as HIGH risk
  ...
  VERIFICATION RESULTS: 34/34 PASSED (0 FAILED)

================================================================
  CST NetController AI - Deep Stress & Resilience Test Suite
================================================================
  ✅ [PASS] Parsed 25,000 binary wire frames with 100% accuracy in 2ms (~12,500,000 pkt/sec)
  ✅ [PASS] Ring buffer strictly capped at 20 entries after 50,000 cycles in 2ms
  ✅ [PASS] Anti-Replay Guard accepted 10,000 valid frames and rejected 1,000 replayed frames
  ...
  STRESS TEST RESULTS: 13/13 PASSED (0 FAILED)
```

---

## License

Distributed under the [MIT License](LICENSE).
