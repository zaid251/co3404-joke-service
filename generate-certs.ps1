# generate-certs.ps1
# Run this from the root co3404-joke-service folder
# Requires: openssl (comes with Git for Windows)

$certDir = ".\kong\certs"
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

Write-Host "Generating self-signed TLS certificate for Kong HTTPS..." -ForegroundColor Cyan

openssl req -x509 `
  -newkey rsa:4096 `
  -keyout "$certDir\server.key" `
  -out "$certDir\server.crt" `
  -days 365 `
  -nodes `
  -subj "/C=GB/ST=Lancashire/L=Preston/O=UCLan/OU=CO3404/CN=localhost"

Write-Host ""
Write-Host "Certificate generated!" -ForegroundColor Green
Write-Host "  Certificate: $certDir\server.crt"
Write-Host "  Private key: $certDir\server.key"
Write-Host ""
Write-Host "Now run: docker-compose up --build" -ForegroundColor Yellow
