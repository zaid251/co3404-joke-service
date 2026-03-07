#!/bin/bash
# deploy-joke-vm.sh
# Deploys joke-service, etl-service, mysql, mongodb to joke-vm
# Run after terraform apply

JOKE_VM_IP=$1

if [ -z "$JOKE_VM_IP" ]; then
  echo "Usage: ./deploy-joke-vm.sh <JOKE_VM_PUBLIC_IP>"
  exit 1
fi

SUBMIT_VM_PRIVATE_IP="10.0.1.11"
USER="azureuser"
PASSWORD="Co3404Jokes!2025"

echo "Deploying to Joke VM: $JOKE_VM_IP"

# Create docker-compose for joke VM
cat > /tmp/docker-compose-joke.yml << EOF
services:

  mysql-db:
    image: mysql:8
    container_name: mysql-db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: jokesdb
      MYSQL_USER: jokeuser
      MYSQL_PASSWORD: jokepass123
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - joke-network
    restart: unless-stopped

  mongo-db:
    image: mongo:7
    container_name: mongo-db
    volumes:
      - mongo_data:/data/db
    networks:
      - joke-network
    restart: unless-stopped

  joke-service:
    image: ghcr.io/\${GITHUB_USER}/joke-service:latest
    container_name: joke-service
    ports:
      - "3001:3001"
    environment:
      PORT: 3001
      DB_MODE: MYSQL
      MYSQL_HOST: mysql-db
      MYSQL_PORT: 3306
      MYSQL_USER: jokeuser
      MYSQL_PASSWORD: jokepass123
      MYSQL_DATABASE: jokesdb
      MONGO_URI: mongodb://mongo-db:27017/jokesdb
      RABBITMQ_URL: amqp://guest:guest@${SUBMIT_VM_PRIVATE_IP}:5672
      TYPES_CACHE_PATH: /app/cache/types.json
    volumes:
      - joke_cache:/app/cache
    networks:
      - joke-network
    depends_on:
      - mysql-db
    restart: unless-stopped

  etl-service:
    image: ghcr.io/\${GITHUB_USER}/etl-service:latest
    container_name: etl-service
    ports:
      - "3004:3004"
    environment:
      PORT: 3004
      DB_MODE: MYSQL
      MYSQL_HOST: mysql-db
      MYSQL_PORT: 3306
      MYSQL_USER: jokeuser
      MYSQL_PASSWORD: jokepass123
      MYSQL_DATABASE: jokesdb
      MONGO_URI: mongodb://mongo-db:27017/jokesdb
      RABBITMQ_URL: amqp://guest:guest@${SUBMIT_VM_PRIVATE_IP}:5672
    networks:
      - joke-network
    depends_on:
      - mysql-db
    restart: unless-stopped

networks:
  joke-network:
    driver: bridge

volumes:
  mysql_data:
  mongo_data:
  joke_cache:
EOF

echo "Copying docker-compose to joke-vm..."
sshpass -p "$PASSWORD" scp -o StrictHostKeyChecking=no \
  /tmp/docker-compose-joke.yml \
  $USER@$JOKE_VM_IP:~/docker-compose.yml

echo "Starting containers on joke-vm..."
sshpass -p "$PASSWORD" ssh -o StrictHostKeyChecking=no $USER@$JOKE_VM_IP \
  "docker compose pull && docker compose up -d"

echo "Joke VM deployed successfully!"
echo "Joke service: http://$JOKE_VM_IP:3001"
