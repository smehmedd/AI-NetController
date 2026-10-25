import os
import shutil
import hashlib
import json
import zipfile
from datetime import datetime, timezone

ROOT_DIR = r"c:\Users\Lenovo\Downloads\AI-NetController-main\AI-NetController-main"
RELEASE_DIR = os.path.join(ROOT_DIR, "public", "releases", "v2.9.0")
os.makedirs(RELEASE_DIR, exist_ok=True)

# 1. Copy APKs
apk_source = os.path.join(ROOT_DIR, "apps", "mobile", "build", "app", "outputs", "flutter-apk", "app-arm64-v8a-release.apk")
apk_arm64_dest = os.path.join(RELEASE_DIR, "CST_NetController_AI_v2.9.0_arm64-v8a.apk")
apk_universal_dest = os.path.join(RELEASE_DIR, "CST_NetController_AI_v2.9.0.apk")

if os.path.exists(apk_source):
    shutil.copy2(apk_source, apk_arm64_dest)
    shutil.copy2(apk_source, apk_universal_dest)
    print(f"Copied APK to {apk_arm64_dest} ({os.path.getsize(apk_arm64_dest):,} bytes)")
else:
    print(f"ERROR: APK source not found: {apk_source}")

# 2. Package Portable ZIP
exe_path = os.path.join(RELEASE_DIR, "CST_HostAgent_v2.9.0_win64.exe")
portable_zip_path = os.path.join(RELEASE_DIR, "CST_HostAgent_v2.9.0_win64_portable.zip")

agent_dir = os.path.join(ROOT_DIR, "agent")
agent_files = [
    "agent.py",
    "agent_daemon.py",
    "agent_gui.py",
    "command_ast_firewall.py",
    "crypto_handshake.py",
    "crypto_vault.py",
    "host_file_writer.py",
    "multi_monitor_streamer.py",
    "network_fuzzer_shield.py",
    "requirements.txt",
    "build_agent.spec",
    "build_exe.bat",
    "sign_binary.ps1",
    "version_info.txt",
]

with zipfile.ZipFile(portable_zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as pzf:
    if os.path.exists(exe_path):
        pzf.write(exe_path, arcname="CST_HostAgent/CST_HostAgent.exe")
    for fname in agent_files:
        fpath = os.path.join(agent_dir, fname)
        if os.path.exists(fpath):
            pzf.write(fpath, arcname=f"CST_HostAgent/src/{fname}")
    readme_path = os.path.join(ROOT_DIR, "PATCH_NOTES.md")
    if os.path.exists(readme_path):
        pzf.write(readme_path, arcname="CST_HostAgent/PATCH_NOTES.md")

print(f"Packaged portable zip to {portable_zip_path} ({os.path.getsize(portable_zip_path):,} bytes)")

# 3. Compute SHA256 & generate SHA256SUMS.txt
def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

files_to_hash = [
    ("CST_HostAgent_v2.9.0_win64.exe", "Windows 10/11 x64 (Standalone Host Agent .EXE)", "exe"),
    ("CST_HostAgent_v2.9.0_win64_portable.zip", "Windows Portable Agent Bundle + Internal Runtime (.ZIP)", "zip"),
    ("CST_NetController_AI_v2.9.0_arm64-v8a.apk", "Android 10–15 arm64-v8a (Mobile Controller .APK)", "apk"),
    ("CST_NetController_AI_v2.9.0.apk", "Android 10–15 Universal Package (Mobile Controller .APK)", "apk"),
]

sums_lines = []
artifacts = []

for fname, platform_label, kind in files_to_hash:
    fpath = os.path.join(RELEASE_DIR, fname)
    if os.path.exists(fpath):
        size_bytes = os.path.getsize(fpath)
        digest = sha256_file(fpath)
        sums_lines.append(f"{digest}  {fname}")
        artifacts.append({
            "filename": fname,
            "kind": kind,
            "platform": platform_label,
            "sizeBytes": size_bytes,
            "sizeFormatted": f"{size_bytes / (1024 * 1024):.1f} MB" if size_bytes > 1024 * 1024 else f"{size_bytes / 1024:.1f} KB",
            "sha256": digest,
            "downloadUrl": f"/releases/v2.9.0/{fname}",
        })

sums_path = os.path.join(RELEASE_DIR, "SHA256SUMS.txt")
with open(sums_path, "w", encoding="utf-8") as f:
    f.write("\n".join(sums_lines) + "\n")

# 4. Generate RELEASE_MANIFEST.json
manifest_data = {
    "version": "v2.9.0",
    "tag": "v2.9.0-LTS",
    "releaseName": "CST NetController AI v2.9.0 — Resilient Fallbacks, Direct AI Control & Stream Overhaul",
    "publishedAt": datetime.now(timezone.utc).isoformat(),
    "protocol": "CST/3.0-SECURE",
    "artifacts": artifacts
}

manifest_path = os.path.join(RELEASE_DIR, "RELEASE_MANIFEST.json")
with open(manifest_path, "w", encoding="utf-8") as f:
    json.dump(manifest_data, f, indent=2)

print("\n--- Packaging completed successfully ---")
for art in artifacts:
    print(f"  {art['filename']}: {art['sizeFormatted']} | SHA256: {art['sha256']}")
