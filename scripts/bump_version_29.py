import os
import re

ROOT_DIR = r"c:\Users\Lenovo\Downloads\AI-NetController-main\AI-NetController-main"

def update_file(rel_path, transform_fn):
    full_path = os.path.join(ROOT_DIR, rel_path)
    if not os.path.exists(full_path):
        print(f"Skipping (not found): {rel_path}")
        return
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    new_content = transform_fn(content)
    if new_content != content:
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated: {rel_path}")
    else:
        print(f"No changes needed: {rel_path}")

# 1. apps/web/server.ts
def bump_server_ts(c):
    c = c.replace("CST NetController AI v2.8.0-LTS", "CST NetController AI v2.9.0-LTS")
    c = c.replace("version: '2.8.0'", "version: '2.9.0'")
    c = c.replace("version: '2.8.0-LTS'", "version: '2.9.0-LTS'")
    c = c.replace("CST Host Daemon GUI v2.8.0-LTS", "CST Host Daemon GUI v2.9.0-LTS")
    c = c.replace(
        "availableVersions: ['v2.8.0', 'v2.7.1', 'v2.7.0']",
        "availableVersions: ['v2.9.0', 'v2.8.0', 'v2.7.1', 'v2.7.0']"
    )
    c = c.replace(
        "const v280Path = path.join(RELEASES_PUBLIC_DIR, 'v2.8.0', 'RELEASE_MANIFEST.json');",
        "const v290Path = path.join(RELEASES_PUBLIC_DIR, 'v2.9.0', 'RELEASE_MANIFEST.json');\n    const v280Path = path.join(RELEASES_PUBLIC_DIR, 'v2.8.0', 'RELEASE_MANIFEST.json');"
    )
    c = c.replace(
        "const manifest = fs.existsSync(v280Path)",
        "const manifest = fs.existsSync(v290Path)\n      ? JSON.parse(fs.readFileSync(v290Path, 'utf-8'))\n      : fs.existsSync(v280Path)"
    )
    c = c.replace(
        "const manifestPath = path.join(RELEASES_PUBLIC_DIR, 'v2.8.0', 'RELEASE_MANIFEST.json');",
        "const manifestPath = path.join(RELEASES_PUBLIC_DIR, 'v2.9.0', 'RELEASE_MANIFEST.json');"
    )
    c = c.replace(
        "/releases/v2.8.0/CST_HostAgent_v2.8.0_win64.exe",
        "/releases/v2.9.0/CST_HostAgent_v2.9.0_win64.exe"
    )
    c = c.replace(
        "/releases/v2.8.0/CST_NetController_AI_v2.8.0_arm64-v8a.apk",
        "/releases/v2.9.0/CST_NetController_AI_v2.9.0_arm64-v8a.apk"
    )
    c = c.replace(
        "/releases/v2.8.0/CST_HostAgent_v2.8.0_win64_portable.zip",
        "/releases/v2.9.0/CST_HostAgent_v2.9.0_win64_portable.zip"
    )
    c = c.replace(
        "legacyExeDownloadUrl: '/releases/v2.7.1/CST_HostAgent_v2.7.1_win64.exe'",
        "legacyExeDownloadUrl: '/releases/v2.8.0/CST_HostAgent_v2.8.0_win64.exe'"
    )
    c = c.replace(
        "legacyApkDownloadUrl: '/releases/v2.7.1/CST_NetController_AI_v2.7.1_arm64-v8a.apk'",
        "legacyApkDownloadUrl: '/releases/v2.8.0/CST_NetController_AI_v2.8.0_arm64-v8a.apk'"
    )
    c = c.replace("CST_HostAgent_v2.8.0_win64.exe", "CST_HostAgent_v2.9.0_win64.exe")
    c = c.replace('public\\\\releases\\\\v2.8.0', 'public\\\\releases\\\\v2.9.0')
    c = c.replace(
        "currentVersion: 'v2.7.1-LTS',\n    latestVersion: 'v2.8.0-LTS'",
        "currentVersion: 'v2.8.0-LTS',\n    latestVersion: 'v2.9.0-LTS'"
    )
    c = c.replace(
        "changelog: 'v2.8.0-LTS: Added stream diagnostic HUD, instant clipboard copy labels, 120 FPS frame selector, and full keyboard navigation suite.'",
        "changelog: 'v2.9.0-LTS: Resilient dependency fallbacks, stream frame service overhaul, and direct AI PC control suite.'"
    )
    c = c.replace(
        "agentVersion: hostAgent?.currentVersion || 'v2.8.0-LTS'",
        "agentVersion: hostAgent?.currentVersion || 'v2.9.0-LTS'"
    )
    return c

update_file("apps/web/server.ts", bump_server_ts)

# 2. apps/web/src/components/PcDaemonGuiModal.tsx
def bump_pc_daemon_modal(c):
    c = c.replace("version: '2.8.0-LTS'", "version: '2.9.0-LTS'")
    c = c.replace("CST Host Daemon GUI v2.8.0-LTS", "CST Host Daemon GUI v2.9.0-LTS")
    c = c.replace("CST_HostAgent_v2.8.0_win64.exe", "CST_HostAgent_v2.9.0_win64.exe")
    c = c.replace("/releases/v2.8.0/", "/releases/v2.9.0/")
    return c

update_file("apps/web/src/components/PcDaemonGuiModal.tsx", bump_pc_daemon_modal)

# 3. apps/web/src/components/QuickSetupModal.tsx
def bump_quick_setup_modal(c):
    c = c.replace("v2.8.0-LTS", "v2.9.0-LTS")
    c = c.replace("CST_HostAgent_v2.8.0_win64.exe", "CST_HostAgent_v2.9.0_win64.exe")
    c = c.replace("CST_NetController_AI_v2.8.0_arm64-v8a.apk", "CST_NetController_AI_v2.9.0_arm64-v8a.apk")
    c = c.replace("/releases/v2.8.0/", "/releases/v2.9.0/")
    return c

update_file("apps/web/src/components/QuickSetupModal.tsx", bump_quick_setup_modal)

# 4. apps/web/src/components/CodeExportModal.tsx
def bump_code_export_modal(c):
    c = c.replace("v2.8.0", "v2.9.0")
    c = c.replace("CST_HostAgent_v2.8.0_win64.exe", "CST_HostAgent_v2.9.0_win64.exe")
    c = c.replace("CST_NetController_AI_v2.8.0_arm64-v8a.apk", "CST_NetController_AI_v2.9.0_arm64-v8a.apk")
    c = c.replace("CST_HostAgent_v2.8.0_win64_portable.zip", "CST_HostAgent_v2.9.0_win64_portable.zip")
    c = c.replace("/releases/v2.8.0/", "/releases/v2.9.0/")
    return c

update_file("apps/web/src/components/CodeExportModal.tsx", bump_code_export_modal)

# 5. apps/web/src/components/SystemUpdateModal.tsx
def bump_system_update_modal(c):
    c = c.replace("latestVersion: 'v2.8.0-LTS'", "latestVersion: 'v2.9.0-LTS'")
    c = c.replace("1 minor release behind (v2.7.1 → v2.8.0-LTS)", "1 minor release behind (v2.8.0 → v2.9.0-LTS)")
    c = c.replace("v2.8.0-LTS", "v2.9.0-LTS")
    return c

update_file("apps/web/src/components/SystemUpdateModal.tsx", bump_system_update_modal)

# 6. apps/web/src/components/KeyboardShortcutsModal.tsx
def bump_shortcuts_modal(c):
    c = c.replace("v2.8.0", "v2.9.0")
    return c

update_file("apps/web/src/components/KeyboardShortcutsModal.tsx", bump_shortcuts_modal)

# 7. agent/agent.py
def bump_agent_py(c):
    c = c.replace("v2.8.0-LTS", "v2.9.0-LTS")
    return c

update_file("agent/agent.py", bump_agent_py)

# 8. agent/agent_gui.py
def bump_agent_gui_py(c):
    c = c.replace('self.version = "2.8.0-LTS"', 'self.version = "2.9.0-LTS"')
    c = c.replace('2.8.0-LTS', '2.9.0-LTS')
    return c

update_file("agent/agent_gui.py", bump_agent_gui_py)

# 9. agent/version_info.txt
def bump_version_info(c):
    c = c.replace("filevers=(2, 8, 0, 0)", "filevers=(2, 9, 0, 0)")
    c = c.replace("prodvers=(2, 8, 0, 0)", "prodvers=(2, 9, 0, 0)")
    c = c.replace("filevers=(2, 7, 1, 0)", "filevers=(2, 9, 0, 0)")
    c = c.replace("prodvers=(2, 7, 1, 0)", "prodvers=(2, 9, 0, 0)")
    c = c.replace("'2.8.0.0'", "'2.9.0.0'")
    c = c.replace("'2.7.1.0'", "'2.9.0.0'")
    c = c.replace("v2.8.0-LTS", "v2.9.0-LTS")
    c = c.replace("v2.7.1-LTS", "v2.9.0-LTS")
    return c

update_file("agent/version_info.txt", bump_version_info)

# 10. agent/build_agent.spec
def bump_build_agent_spec(c):
    c = c.replace('version="2.7.1.0"', 'version="2.9.0.0"')
    c = c.replace('version="2.8.0.0"', 'version="2.9.0.0"')
    return c

update_file("agent/build_agent.spec", bump_build_agent_spec)

# 11. apps/mobile/pubspec.yaml
def bump_mobile_pubspec(c):
    c = re.sub(r'version:\s*2\.\d+\.\d+\+\d+', 'version: 2.9.0+30', c)
    return c

update_file("apps/mobile/pubspec.yaml", bump_mobile_pubspec)

# 12. apps/mobile/lib/main.dart
def bump_mobile_main(c):
    c = c.replace("v2.8.0-LTS", "v2.9.0-LTS")
    c = c.replace("Build 29", "Build 30")
    return c

update_file("apps/mobile/lib/main.dart", bump_mobile_main)

print("\n--- Version bump completed ---")
