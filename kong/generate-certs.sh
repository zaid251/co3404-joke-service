#!/bin/bash
# kong/generate-certs.sh
# Generates a self-signed TLS certificate for Kong HTTPS
# Run this ONCE before docker-compose up
# Certificate is deployed to the Kong VM, not baked into the image

set -e

CERT_DIR="./kong/certs"
mkdir -p "$CERT_DIR"

echo "Generating self-signed TLS certificate for Kong..."

openssl req -x509 \
  -newkey rsa:4096 \
  -keyout "$CERT_DIR/server.key" \
  -out "$CERT_DIR/server.crt" \
  -days 365 \
  -nodes \
  -subj "/C=GB/ST=Lancashire/L=Preston/O=UCLan/OU=CO3404/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

echo "Certificate generated successfully!"
echo "  Certificate: $CERT_DIR/server.crt"
echo "  Private key: $CERT_DIR/server.key"
echo ""
echo "Kong will serve HTTPS on port 443"
