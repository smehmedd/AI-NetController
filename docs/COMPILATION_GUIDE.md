# CST Autonomous Controller: 1-Click Binary Compilation & Deployment Guide

This guide details the procedure for producing the standalone native binaries (`.exe` and `.apk`) for the Computer Systems & Technologies (CST) Capstone Project.

---

## 1. Windows Host Agent Daemon (`CST_HostAgent.exe`)

### Quick Method (1-Click Automated Batch)
1. Navigate to the `agent/` folder.
2. Double-click `build_exe.bat`.
3. The script automatically:
   - Configures a local Python virtual environment (`venv`).
   - Upgrades `pip` and installs pinned production dependencies (`websockets`, `zeroconf`, `mss`, `Pillow`, `PyTurboJPEG`, `pystray`, `psutil`, `pyinstaller`).
   - Invokes PyInstaller using `build_agent.spec` with `console=False` and UPX binary compression.
4. Output file: `agent/dist/CST_HostAgent.exe`.

### Manual CLI Method
```powershell
cd agent
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
pyinstaller --clean build_agent.spec
```

---

## 2. Android Mobile Application (`app-arm64-v8a-release.apk`)

### Quick Method (1-Click Automated Batch)
1. Navigate to the `apps/mobile/` folder.
2. Double-click `build_apk.bat`.
3. The script executes:
   - `flutter clean`
   - `flutter pub get`
   - `flutter build apk --release --split-per-abi`
4. Output files in `apps/mobile/build/app/outputs/flutter-apk/`:
   - `app-arm64-v8a-release.apk` (Recommended for modern smartphones)
   - `app-armeabi-v7a-release.apk` (Legacy 32-bit hardware)
   - `app-x86_64-release.apk` (Android Studio emulator / ChromeOS)

---

## 3. Physical LAN Verification
1. Launch `CST_HostAgent.exe` on target Windows PC. Notice the cyan icon in the system tray.
2. Connect Android phone to the same Wi-Fi subnet.
3. Open the installed CST Mobile app:
   - mDNS will discover the Windows PC host automatically within ~500ms.
   - Remote screen view, telemetry, and HITL security gating are operational immediately.
