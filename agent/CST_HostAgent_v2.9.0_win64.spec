# -*- mode: python ; coding: utf-8 -*-


a = Analysis(
    ['agent_daemon.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=['agent_gui', 'agent', 'tkinter', 'tkinter.ttk', 'websockets', 'pystray', 'PIL', 'psutil', 'cryptography'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='CST_HostAgent_v2.9.0_win64',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    version='version_info.txt',
)
