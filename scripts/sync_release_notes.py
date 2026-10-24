import subprocess
import urllib.request
import json
import os

repo_dir = r"c:\Users\Lenovo\Downloads\AI-NetController-main\AI-NetController-main"
git_exe = r"C:\Program Files\Git\cmd\git.exe"

cred = subprocess.check_output(
    [git_exe, "credential", "fill"],
    input=b"protocol=https\nhost=github.com\n",
    cwd=repo_dir
).decode("utf-8")

token = [line.split("=", 1)[1] for line in cred.splitlines() if line.startswith("password=")][0]

patch_notes_path = os.path.join(repo_dir, "PATCH_NOTES.md")
with open(patch_notes_path, "r", encoding="utf-8") as f:
    body = f.read()

payload = {
    "name": "CST NetController AI v2.7.0 - 120Hz Zero-Jitter Engine & Native Binaries",
    "body": body
}

req = urllib.request.Request(
    "https://api.github.com/repos/smehmedd/AI-NetController/releases/422998080",
    data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
    headers={
        "Authorization": f"token {token}",
        "User-Agent": "CST-Release-Bot",
        "Content-Type": "application/json; charset=utf-8",
        "Accept": "application/vnd.github.v3+json"
    },
    method="PATCH"
)

with urllib.request.urlopen(req) as resp:
    res = json.loads(resp.read().decode("utf-8"))
    print("SUCCESS: Updated release:", res["name"])
    print("Body length:", len(res["body"]))
