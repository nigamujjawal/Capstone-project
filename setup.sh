#!/bin/bash
set -e

echo "=========================================="
echo "=== Capstone Project Full Kubernetes Deploy ==="
echo "=========================================="

# 1. Resolve package conflicts and install Docker & dependencies
echo "[1/6] Installing Docker and dependencies..."
sudo apt update
# Handle potential containerd package conflict cleanly
if ! command -v docker &> /dev/null; then
  sudo apt remove -y containerd.io containerd 2>/dev/null || true
  sudo apt update
  sudo apt install -y docker.io curl git || sudo apt install -y docker-ce docker-ce-cli containerd.io curl git
fi

sudo systemctl enable --now docker || true

# 2. Configure Docker permissions
echo "[2/6] Configuring Docker permissions..."
sudo usermod -aG docker clouduser 2>/dev/null || true
if [ -n "$SUDO_USER" ]; then
  sudo usermod -aG docker "$SUDO_USER"
fi

# 3. Install kubectl
echo "[3/6] Installing kubectl..."
if ! command -v kubectl &> /dev/null; then
  curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
  chmod +x kubectl
  sudo mv kubectl /usr/local/bin/
fi

# 4. Install Minikube
echo "[4/6] Installing Minikube..."
if ! command -v minikube &> /dev/null; then
  curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
  sudo install minikube-linux-amd64 /usr/local/bin/minikube
fi

# 5. Clean up old state & start Minikube
echo "[5/6] Starting Minikube Cluster..."
minikube delete || true

if [ "$(id -u)" -eq 0 ]; then
  echo "Running as root. Switching to clouduser to start Minikube..."
  su - clouduser -c "minikube start --driver=docker"
else
  minikube start --driver=docker
fi

# 6. Build Docker Images & Deploy Kubernetes Manifests
echo "[6/6] Building Images and Deploying to Kubernetes..."

# Find Capstone Project folder
if [ -d "Capstone Project" ]; then
  PROJECT_DIR="Capstone Project"
elif [ -d "k8s" ]; then
  PROJECT_DIR="."
else
  echo "Error: Capstone Project directory not found!"
  exit 1
fi

# Point shell to Minikube Docker Daemon
eval $(minikube -p minikube docker-env)

echo "Building api-gateway image..."
docker build -t api-gateway:latest "$PROJECT_DIR/api-gateway"

echo "Building catalog-service image..."
docker build -t catalog-service:latest "$PROJECT_DIR/catalog-service"

echo "Building order-service image..."
docker build -t order-service:latest "$PROJECT_DIR/order-service"

echo "Building rating-service image..."
docker build -t rating-service:latest "$PROJECT_DIR/rating-service"

echo "Building notification-service image..."
docker build -t notification-service:latest "$PROJECT_DIR/notification-service"

echo "Deploying Kubernetes manifests..."
kubectl apply -f "$PROJECT_DIR/k8s/"

echo "=========================================="
echo "=== Deployment Completed Successfully! ==="
echo "=========================================="
kubectl get pods -n cake-delight
kubectl get svc -n cake-delight
