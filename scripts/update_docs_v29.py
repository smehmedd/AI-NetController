import os

ROOT_DIR = r"c:\Users\Lenovo\Downloads\AI-NetController-main\AI-NetController-main"

# 1. Update README.md
readme_path = os.path.join(ROOT_DIR, "README.md")
with open(readme_path, "r", encoding="utf-8") as f:
    readme = f.read()

readme = readme.replace(
    "[![Release](https://img.shields.io/badge/release-v2.8.0--LTS-blue.svg)](https://github.com/smehmedd/AI-NetController/releases/tag/v2.8.0)",
    "[![Release](https://img.shields.io/badge/release-v2.9.0--LTS-blue.svg)](https://github.com/smehmedd/AI-NetController/releases/tag/v2.9.0)"
)
readme = readme.replace(
    "3. [Official Pre-Compiled Binaries](#-official-pre-compiled-binaries-v280)",
    "3. [Official Pre-Compiled Binaries](#-official-pre-compiled-binaries-v290)"
)
readme = readme.replace(
    "## 📦 Official Pre-Compiled Binaries (`v2.8.0`)",
    "## 📦 Official Pre-Compiled Binaries (`v2.9.0`)"
)

old_table = """| Binary File | Target Platform | File Size | SHA-256 Digest | Direct Download Link |
| :--- | :--- | :---: | :--- | :---: |
| **`CST_HostAgent_v2.8.0_win64.exe`** | Windows 10 / 11 (`x86_64` PE32+ GUI) | 35.3 MB | `657a2ffe752c3e8a52c2684423e6f270daff71b50ab9fcbb1a754e3156a67403` | [Download EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_HostAgent_v2.8.0_win64.exe) |
| **`CST_HostAgent_v2.8.0_win64_portable.zip`** | Windows 10 / 11 (Portable ZIP Bundle) | 34.7 MB | `f4d239a1d04222695129d7e1a61c355bab9d2b76bdcd763ecd8df4e16a64e35c` | [Download Portable ZIP](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_HostAgent_v2.8.0_win64_portable.zip) |
| **`CST_NetController_AI_v2.8.0_arm64-v8a.apk`** | Android 10 – 15 (`arm64-v8a` High-Refresh) | 21.8 MB | `1280ded4104225baadf68ecfb3f627d42871b6d9488a9513e37e786776708c2a` | [Download APK (arm64-v8a)](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_NetController_AI_v2.8.0_arm64-v8a.apk) |
| **`CST_NetController_AI_v2.8.0.apk`** | Android 10 – 15 (Universal Package) | 21.8 MB | `1280ded4104225baadf68ecfb3f627d42871b6d9488a9513e37e786776708c2a` | [Download APK (Universal)](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_NetController_AI_v2.8.0.apk) |
| **`SHA256SUMS.txt`** | Checksum Verification List | 413 B | — | [Download SHA256](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/SHA256SUMS.txt) |
| **`RELEASE_MANIFEST.json`** | Release Metadata Manifest | 1.8 KB | — | [Download Manifest](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/RELEASE_MANIFEST.json) |

> **Previous Stable Releases (v2.7.1 & v2.7.0):** Available on the [v2.7.1 Release Page](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1) and [v2.7.0 Release Page](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0). All previous versions are maintained simultaneously. All official releases are tracked on the [GitHub Releases Page](https://github.com/smehmedd/AI-NetController/releases)."""

new_table = """| Binary File | Target Platform | File Size | SHA-256 Digest | Direct Download Link |
| :--- | :--- | :---: | :--- | :---: |
| **`CST_HostAgent_v2.9.0_win64.exe`** | Windows 10 / 11 (`x86_64` PE32+ GUI) | 35.3 MB | `ab33d3b4ea79e0bf89483221cfdba9dd86ffb29893d18a773f28ffde4aab09b3` | [Download EXE](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_HostAgent_v2.9.0_win64.exe) |
| **`CST_HostAgent_v2.9.0_win64_portable.zip`** | Windows 10 / 11 (Portable ZIP Bundle) | 35.0 MB | `6cefa35ebbcdf30ccea589c4cf710f1e91748ebecaac0b709150b97c1febd935` | [Download Portable ZIP](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_HostAgent_v2.9.0_win64_portable.zip) |
| **`CST_NetController_AI_v2.9.0_arm64-v8a.apk`** | Android 10 – 15 (`arm64-v8a` High-Refresh) | 21.8 MB | `5d29fe3d18f45b15fc7085a46950e9486e12e6ae2673dfeb2ca51d68f7585939` | [Download APK (arm64-v8a)](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_NetController_AI_v2.9.0_arm64-v8a.apk) |
| **`CST_NetController_AI_v2.9.0.apk`** | Android 10 – 15 (Universal Package) | 21.8 MB | `5d29fe3d18f45b15fc7085a46950e9486e12e6ae2673dfeb2ca51d68f7585939` | [Download APK (Universal)](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_NetController_AI_v2.9.0.apk) |
| **`SHA256SUMS.txt`** | Checksum Verification List | 413 B | — | [Download SHA256](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/SHA256SUMS.txt) |
| **`RELEASE_MANIFEST.json`** | Release Metadata Manifest | 1.9 KB | — | [Download Manifest](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/RELEASE_MANIFEST.json) |

> **Previous Stable Releases (v2.8.0, v2.7.1 & v2.7.0):** Available on the [v2.8.0 Release Page](https://github.com/smehmedd/AI-NetController/releases/tag/v2.8.0), [v2.7.1 Release Page](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1), and [v2.7.0 Release Page](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0). All previous versions are maintained simultaneously. All official releases are tracked on the [GitHub Releases Page](https://github.com/smehmedd/AI-NetController/releases)."""

readme = readme.replace(old_table, new_table)
readme = readme.replace(
    "[`CST_HostAgent_v2.8.0_win64.exe`](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_HostAgent_v2.8.0_win64.exe)",
    "[`CST_HostAgent_v2.9.0_win64.exe`](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_HostAgent_v2.9.0_win64.exe)"
)
readme = readme.replace(
    "[`CST_NetController_AI_v2.8.0_arm64-v8a.apk`](https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_NetController_AI_v2.8.0_arm64-v8a.apk)",
    "[`CST_NetController_AI_v2.9.0_arm64-v8a.apk`](https://github.com/smehmedd/AI-NetController/releases/download/v2.9.0/CST_NetController_AI_v2.9.0_arm64-v8a.apk)"
)

with open(readme_path, "w", encoding="utf-8") as f:
    f.write(readme)
print("Updated README.md")

# 2. Update docs/COMPILATION_GUIDE.md
comp_path = os.path.join(ROOT_DIR, "docs", "COMPILATION_GUIDE.md")
with open(comp_path, "r", encoding="utf-8") as f:
    comp = f.read()
comp = comp.replace(
    "**Version:** `v2.8.0-LTS` (Previous `v2.7.1-LTS` and `v2.7.0-LTS` preserved in releases)",
    "**Version:** `v2.9.0-LTS` (Previous `v2.8.0-LTS`, `v2.7.1-LTS`, and `v2.7.0-LTS` preserved in releases)"
)
comp = comp.replace("CST_HostAgent_v2.8.0_win64", "CST_HostAgent_v2.9.0_win64")
comp = comp.replace("CST_NetController_AI_v2.8.0_arm64-v8a.apk", "CST_NetController_AI_v2.9.0_arm64-v8a.apk")
with open(comp_path, "w", encoding="utf-8") as f:
    f.write(comp)
print("Updated docs/COMPILATION_GUIDE.md")

# 3. Update docs/SETUP_GUIDE.md
setup_path = os.path.join(ROOT_DIR, "docs", "SETUP_GUIDE.md")
with open(setup_path, "r", encoding="utf-8") as f:
    setup = f.read()
setup = setup.replace("**Version:** `v2.8.0-LTS`", "**Version:** `v2.9.0-LTS`")
setup = setup.replace("v2.8.0", "v2.9.0")
with open(setup_path, "w", encoding="utf-8") as f:
    setup = setup.replace(
        "or previous releases [`v2.7.1`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1) / [`v2.7.0`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0)",
        "or previous releases [`v2.8.0`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.8.0), [`v2.7.1`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.1), [`v2.7.0`](https://github.com/smehmedd/AI-NetController/releases/tag/v2.7.0)"
    )
    f.write(setup)
print("Updated docs/SETUP_GUIDE.md")

# 4. Update docs/PROJECT_GUIDE.md
proj_path = os.path.join(ROOT_DIR, "docs", "PROJECT_GUIDE.md")
with open(proj_path, "r", encoding="utf-8") as f:
    proj = f.read()

proj = proj.replace("CST NetController AI (`v2.8.0-LTS`)", "CST NetController AI (`v2.9.0-LTS`)")
proj = proj.replace(
    "> **Current Release**: `v2.8.0-LTS` *(Previous releases `v2.7.1` and `v2.7.0` remain available in the GitHub Releases tab)*",
    "> **Current Release**: `v2.9.0-LTS` *(Previous releases `v2.8.0`, `v2.7.1`, and `v2.7.0` remain available in the GitHub Releases tab)*"
)
proj = proj.replace("CST_NetController_AI_v2.8.0_arm64-v8a.apk", "CST_NetController_AI_v2.9.0_arm64-v8a.apk")
proj = proj.replace("CST_HostAgent_v2.8.0_win64.exe", "CST_HostAgent_v2.9.0_win64.exe")
proj = proj.replace("product version (`2.8.0.0`)", "product version (`2.9.0.0`)")
proj = proj.replace("public\\releases\\v2.8.0\\CST_HostAgent_v2.8.0_win64.exe", "public\\releases\\v2.9.0\\CST_HostAgent_v2.9.0_win64.exe")
proj = proj.replace("/releases/v2.8.0/", "/releases/v2.9.0/")

old_proj_table = """### Latest Release (`v2.8.0-LTS`)

| Artifact | Target Platform | Size | SHA-256 Checksum |
| :--- | :--- | :---: | :--- |
| **`CST_HostAgent_v2.8.0_win64.exe`** | Windows 10/11 (`x86_64` PE32+ Signed `O=CST_RU-AK`) | 35.3 MB | `657a2ffe752c3e8a52c2684423e6f270daff71b50ab9fcbb1a754e3156a67403` |
| **`CST_NetController_AI_v2.8.0_arm64-v8a.apk`** | Android 10–15 (`arm64-v8a` High-Refresh 120Hz) | 21.8 MB | `1280ded4104225baadf68ecfb3f627d42871b6d9488a9513e37e786776708c2a` |
| **`CST_NetController_AI_v2.8.0.apk`** | Android 10–15 (Universal Package) | 21.8 MB | `1280ded4104225baadf68ecfb3f627d42871b6d9488a9513e37e786776708c2a` |
| **`CST_HostAgent_v2.8.0_win64_portable.zip`** | Windows Portable Agent Bundle + Internal Runtime | 34.7 MB | `f4d239a1d04222695129d7e1a61c355bab9d2b76bdcd763ecd8df4e16a64e35c` |

### Previous Releases (`v2.7.1-LTS` & `v2.7.0-LTS`) — Still Available"""

new_proj_table = """### Latest Release (`v2.9.0-LTS`)

| Artifact | Target Platform | Size | SHA-256 Checksum |
| :--- | :--- | :---: | :--- |
| **`CST_HostAgent_v2.9.0_win64.exe`** | Windows 10/11 (`x86_64` PE32+ Signed `O=CST_RU-AK`) | 35.3 MB | `ab33d3b4ea79e0bf89483221cfdba9dd86ffb29893d18a773f28ffde4aab09b3` |
| **`CST_NetController_AI_v2.9.0_arm64-v8a.apk`** | Android 10–15 (`arm64-v8a` High-Refresh 120Hz) | 21.8 MB | `5d29fe3d18f45b15fc7085a46950e9486e12e6ae2673dfeb2ca51d68f7585939` |
| **`CST_NetController_AI_v2.9.0.apk`** | Android 10–15 (Universal Package) | 21.8 MB | `5d29fe3d18f45b15fc7085a46950e9486e12e6ae2673dfeb2ca51d68f7585939` |
| **`CST_HostAgent_v2.9.0_win64_portable.zip`** | Windows Portable Agent Bundle + Internal Runtime | 35.0 MB | `6cefa35ebbcdf30ccea589c4cf710f1e91748ebecaac0b709150b97c1febd935` |

### Previous Releases (`v2.8.0-LTS`, `v2.7.1-LTS` & `v2.7.0-LTS`) — Still Available

| Artifact | Target Platform | Size | SHA-256 Checksum |
| :--- | :--- | :---: | :--- |
| **`CST_HostAgent_v2.8.0_win64.exe`** | Windows 10/11 (`x86_64` PE32+ Signed `O=CST_RU-AK`) | 35.3 MB | `657a2ffe752c3e8a52c2684423e6f270daff71b50ab9fcbb1a754e3156a67403` |
| **`CST_NetController_AI_v2.8.0_arm64-v8a.apk`** | Android 10–15 (`arm64-v8a` High-Refresh 120Hz) | 21.8 MB | `1280ded4104225baadf68ecfb3f627d42871b6d9488a9513e37e786776708c2a` |"""

proj = proj.replace(old_proj_table, new_proj_table)
with open(proj_path, "w", encoding="utf-8") as f:
    f.write(proj)
print("Updated docs/PROJECT_GUIDE.md")

print("All docs updated successfully!")
