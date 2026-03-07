# ── Kong API Gateway Dockerfile ───────────────────────────────────────────────
FROM kong:3.6-ubuntu

USER root

# Install openssl to generate self-signed cert inside container
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy declarative config
COPY config/kong.yml /etc/kong/kong.yml

# Generate self-signed TLS certificate inside the image
RUN mkdir -p /etc/kong/certs && \
    openssl req -x509 \
      -newkey rsa:2048 \
      -keyout /etc/kong/certs/server.key \
      -out /etc/kong/certs/server.crt \
      -days 365 \
      -nodes \
      -subj "/C=GB/ST=Lancashire/L=Preston/O=UCLan/OU=CO3404/CN=localhost" && \
    chown -R kong:kong /etc/kong/certs && \
    chmod 600 /etc/kong/certs/server.key && \
    echo "TLS certificate generated successfully"

RUN mkdir -p /tmp && chmod 777 /tmp

ENV KONG_DATABASE=off
ENV KONG_DECLARATIVE_CONFIG=/etc/kong/kong.yml
ENV KONG_PROXY_ACCESS_LOG=/dev/stdout
ENV KONG_ADMIN_ACCESS_LOG=/dev/stdout
ENV KONG_PROXY_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_ERROR_LOG=/dev/stderr
ENV KONG_ADMIN_LISTEN=0.0.0.0:8001
ENV KONG_SSL_CERT=/etc/kong/certs/server.crt
ENV KONG_SSL_CERT_KEY=/etc/kong/certs/server.key

EXPOSE 8000 8443 8001

USER kong

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD kong health || exit 1

CMD ["kong", "docker-start"]
