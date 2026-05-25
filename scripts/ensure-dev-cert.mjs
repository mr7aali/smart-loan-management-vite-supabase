import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const certDir = path.resolve(process.cwd(), ".cert");
const pfxPath = path.join(certDir, "localhost-dev.pfx");
const passphrasePath = path.join(certDir, "localhost-dev.passphrase");
const passphrase = "freebird-local-dev-cert";

if (existsSync(pfxPath) && existsSync(passphrasePath)) {
  process.exit(0);
}

if (process.platform !== "win32") {
  console.warn(
    "Skipping local HTTPS certificate generation because this helper currently targets Windows only.",
  );
  process.exit(0);
}

mkdirSync(certDir, { recursive: true });

function escapePowerShellPath(value) {
  return value.replace(/'/g, "''");
}

const command = `
$ErrorActionPreference = 'Stop'

$certDir = '${escapePowerShellPath(certDir)}'
$pfxPath = '${escapePowerShellPath(pfxPath)}'
$passphrasePath = '${escapePowerShellPath(passphrasePath)}'
$passphrase = '${passphrase}'
$friendlyName = 'freebird-local-dev'
$subject = 'CN=freebird-local-dev'

if (-not (Test-Path -LiteralPath $certDir)) {
  New-Item -ItemType Directory -Path $certDir -Force | Out-Null
}

$certificate = Get-ChildItem Cert:\\CurrentUser\\My |
  Where-Object { $_.FriendlyName -eq $friendlyName } |
  Sort-Object NotAfter -Descending |
  Select-Object -First 1

if (-not $certificate) {
  $certificate = New-SelfSignedCertificate -Subject $subject -FriendlyName $friendlyName -DnsName 'localhost', '127.0.0.1' -CertStoreLocation 'Cert:\\CurrentUser\\My' -HashAlgorithm 'SHA256' -KeyAlgorithm 'RSA' -KeyLength 2048 -KeyExportPolicy Exportable -NotAfter (Get-Date).AddYears(5)
}

$rootCertificate = Get-ChildItem Cert:\\CurrentUser\\Root |
  Where-Object { $_.Thumbprint -eq $certificate.Thumbprint } |
  Select-Object -First 1

$tempCerPath = Join-Path $certDir 'localhost-dev.cer'
if (-not (Test-Path -LiteralPath $tempCerPath)) {
  Export-Certificate -Cert $certificate -FilePath $tempCerPath -Force | Out-Null
}

if (-not $rootCertificate) {
  certutil -user -f -addstore Root $tempCerPath | Out-Null
}

$securePassphrase = ConvertTo-SecureString -String $passphrase -AsPlainText -Force
Export-PfxCertificate -Cert $certificate -FilePath $pfxPath -Password $securePassphrase -Force -ChainOption EndEntityCertOnly | Out-Null

Set-Content -LiteralPath $passphrasePath -Value $passphrase -NoNewline
`;

const result = spawnSync(
  "powershell",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
  {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "pipe",
  },
);

if (result.status !== 0) {
  console.error(result.stdout);
  console.error(result.stderr);
  process.exit(result.status ?? 1);
}

if (result.stdout.trim()) {
  console.log(result.stdout.trim());
}

console.log("Local HTTPS certificate is ready for https://localhost.");
