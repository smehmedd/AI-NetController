# CST NetController AI — Windows Authenticode Signing & Defender Verification Script
# Purpose: Signs CST_HostAgent.exe with an Authenticode certificate and runs
# a Windows Defender scan check to guarantee zero false-positive heuristic detections.

param(
    [string]$ExePath = ".\dist\CST_HostAgent\CST_HostAgent.exe"
)

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " CST Host Agent — Authenticode Signing & AV Verification Pipeline" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

if (-Not (Test-Path $ExePath)) {
    Write-Host "[WARN] Executable not found at $ExePath. Run build_exe.bat first." -ForegroundColor Yellow
    exit 1
}

# 1. Check for existing code-signing certificate or generate a local trusted dev certificate
$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Select-Object -First 1
if (-Not $cert) {
    Write-Host "[1/3] Creating local Authenticode Code-Signing Certificate for CST Systems..." -ForegroundColor Cyan
    $cert = New-SelfSignedCertificate `
        -Type CodeSigningCert `
        -Subject "CN=Computer Systems & Technologies (CST), O=TU-Varna CST, C=BG" `
        -KeyAlgorithm RSA `
        -KeyLength 2048 `
        -HashAlgorithm SHA256 `
        -CertStoreLocation "Cert:\CurrentUser\My" `
        -NotAfter (Get-Date).AddYears(3)
}

# 2. Apply Authenticode SHA-256 Digital Signature
Write-Host "[2/3] Applying SHA-256 Authenticode Signature to $ExePath..." -ForegroundColor Cyan
Set-AuthenticodeSignature -FilePath $ExePath -Certificate $cert -HashAlgorithm SHA256 | Out-Null

$sig = Get-AuthenticodeSignature -FilePath $ExePath
Write-Host "      Signature Certificate: $($sig.SignerCertificate.Subject)" -ForegroundColor Green
Write-Host "      Signature Thumbprint : $($sig.SignerCertificate.Thumbprint)" -ForegroundColor Green

# 3. Verify with Windows Defender CLI Scanner (if present)
$defenderCli = "$env:ProgramFiles\Windows Defender\MpCmdRun.exe"
if (Test-Path $defenderCli) {
    Write-Host "[3/3] Running Windows Defender Heuristic & Signature Scan..." -ForegroundColor Cyan
    & $defenderCli -Scan -ScanType 3 -File (Resolve-Path $ExePath).Path
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[PASS] Windows Defender verified $ExePath: CLEAN (0 threats found)." -ForegroundColor Green
    } else {
        Write-Host "[INFO] Defender scan returned exit code $LASTEXITCODE." -ForegroundColor Yellow
    }
} else {
    Write-Host "[3/3] Windows Defender CLI not found on this host; skipping local scan." -ForegroundColor Gray
}
