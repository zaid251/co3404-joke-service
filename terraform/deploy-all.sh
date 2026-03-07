#!/bin/bash
# deploy-all.sh
# Complete deployment pipeline:
# 1. Terraform creates all Azure VMs
# 2. Scripts deploy containers to each VM

set -e

echo "=========================================="
echo " CO3404 Full Deployment Pipeline"
echo "=========================================="

# Step 1: Terraform
echo ""
echo "Step 1: Creating Azure infrastructure..."
cd terraform
terraform init
terraform apply -auto-approve

# Get IPs from terraform output
JOKE_IP=$(terraform output -raw joke_vm_public_ip)
SUBMIT_IP=$(terraform output -raw submit_vm_public_ip)
KONG_IP=$(terraform output -raw kong_vm_public_ip)
MODERATE_IP=$(terraform output -raw moderate_vm_public_ip)

echo ""
echo "VMs created:"
echo "  Joke VM:     $JOKE_IP"
echo "  Submit VM:   $SUBMIT_IP"
echo "  Kong VM:     $KONG_IP"
echo "  Moderate VM: $MODERATE_IP"

echo ""
echo "Waiting 60 seconds for VMs to boot and install Docker..."
sleep 60

# Step 2: Deploy containers
echo ""
echo "Step 2: Deploying containers..."
cd ..
chmod +x terraform/deploy-joke-vm.sh
./terraform/deploy-joke-vm.sh $JOKE_IP

echo ""
echo "=========================================="
echo " Deployment Complete!"
echo "=========================================="
echo ""
echo "Access your services:"
echo "  Joke UI:      http://$JOKE_IP:3001"
echo "  Submit UI:    http://$SUBMIT_IP:3002"
echo "  Moderate UI:  http://$MODERATE_IP:3003"
echo "  Kong HTTP:    http://$KONG_IP"
echo "  Kong HTTPS:   https://$KONG_IP"
echo "  RabbitMQ:     http://$SUBMIT_IP:15672"
echo ""
echo "To destroy all resources: cd terraform && terraform destroy"
