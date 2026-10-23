# -*- mode: python ; coding: utf-8 -*-
# CST Autonomous LAN PC Inspector - Production PyInstaller Specification
# Configured for --onedir to eliminate Windows Defender %TEMP% false positives

import sys
import os

block_cipher = None

# Embedded Windows Application Manifest
MANIFEST_XML = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity
    version="2.4.0.0"
    processorArchitecture="*"
    name="CST.AutonomousLAN.Agent"
    type="win32"
  />
  <description>CST Autonomous LAN PC Inspector and Agentic OS Bridge</description>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="asInvoker" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <!-- Windows 10 & Windows 11 -->
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}" />
    </application>
  </compatibility>
</assembly>
'''

with open('app_manifest.xml', 'w', encoding='utf-8') as mf:
    mf.write(MANIFEST_XML)

a = Analysis(
    ['agent_daemon.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'zeroconf',
        'zeroconf.asyncio',
        'websockets',
        'websockets.asyncio.server',
        'pystray',
        'mss',
        'PIL',
        'PIL.Image',
        'PIL.ImageDraw',
        'turbojpeg',
        'psutil',
        'pyautogui',
        'pyperclip',
        'asyncio',
        'crypto_vault',
        'command_ast_firewall',
        'multi_monitor_streamer',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[
        'tkinter',
        'unittest',
        'email',
        'http.server',
        'xmlrpc',
        'pydoc',
        'distutils'
    ],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='CST_HostAgent',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,  # Disabled UPX to eliminate Windows Defender heuristic false positives
    console=False,  # Silent background execution
    disable_windowed_traceback=False,
    manifest='app_manifest.xml',
    version='version_info.txt',
    icon=None
)

coll = COLLECT(
    exe,
    a.binaries,
    a.zipfiles,
    a.datas,
    strip=True,
    upx=True,
    upx_exclude=[],
    name='CST_HostAgent'
)
