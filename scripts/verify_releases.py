import urllib.request

urls = [
    "https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_HostAgent_v2.8.0_win64.exe",
    "https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_HostAgent_v2.8.0_win64_portable.zip",
    "https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_NetController_AI_v2.8.0_arm64-v8a.apk",
    "https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/CST_NetController_AI_v2.8.0.apk",
    "https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/SHA256SUMS.txt",
    "https://github.com/smehmedd/AI-NetController/releases/download/v2.8.0/RELEASE_MANIFEST.json",
    "https://github.com/smehmedd/AI-NetController/releases/download/v2.7.1/CST_HostAgent_v2.7.1_win64.exe",
    "https://github.com/smehmedd/AI-NetController/releases/download/v2.7.0/CST_HostAgent_v2.7.0_win64.exe"
]

opener = urllib.request.build_opener()
opener.addheaders = [("User-Agent", "Mozilla/5.0")]

print("Verifying release download URLs:")
for url in urls:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        # Open and read 1KB to ensure redirect to AWS S3 / objects succeeds
        with opener.open(req) as resp:
            data = resp.read(1024)
            print(f"  [OK {resp.status}] Length: {resp.headers.get('Content-Length', 'chunked')} | {url}")
    except Exception as e:
        print(f"  [FAILED] {url} -> {e}")
