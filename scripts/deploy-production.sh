#!/bin/bash

# Production Deployment Script for OUI
# Phase 3: Production Deployment with Docker and Kubernetes

set -e

echo "🚀 Starting OUI Production Deployment..."

# Configuration
NAMESPACE="oui-production"
IMAGE_REGISTRY="gcr.io/oui-project"
VERSION=$(date +%Y%m%d%H%M%S)
DEPLOYMENT_NAME="oui-identity-platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."

    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed"
        exit 1
    fi

    # Check if docker is available
    if ! command -v docker &> /dev/null; then
        log_error "docker is not installed"
        exit 1
    fi

    # Check Kubernetes cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi

    # Check if namespace exists
    if ! kubectl get namespace $NAMESPACE &> /dev/null; then
        log_info "Creating namespace: $NAMESPACE"
        kubectl create namespace $NAMESPACE
    fi

    log_success "Pre-deployment checks completed"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."

    # Build backend image
    log_info "Building backend image..."
    docker build -f Dockerfile -t $IMAGE_REGISTRY/backend:$VERSION .
    docker tag $IMAGE_REGISTRY/backend:$VERSION $IMAGE_REGISTRY/backend:latest

    # Build frontend image
    log_info "Building frontend image..."
    docker build -f Dockerfile.frontend -t $IMAGE_REGISTRY/frontend:$VERSION .
    docker tag $IMAGE_REGISTRY/frontend:$VERSION $IMAGE_REGISTRY/frontend:latest

    # Build Hardhat image
    log_info "Building Hardhat image..."
    docker build -f Dockerfile.hardhat -t $IMAGE_REGISTRY/hardhat:$VERSION .
    docker tag $IMAGE_REGISTRY/hardhat:$VERSION $IMAGE_REGISTRY/hardhat:latest

    # Push images (requires authentication)
    log_info "Pushing images to registry..."
    docker push $IMAGE_REGISTRY/backend:$VERSION
    docker push $IMAGE_REGISTRY/backend:latest
    docker push $IMAGE_REGISTRY/frontend:$VERSION
    docker push $IMAGE_REGISTRY/frontend:latest
    docker push $IMAGE_REGISTRY/hardhat:$VERSION
    docker push $IMAGE_REGISTRY/hardhat:latest

    log_success "Docker images built and pushed"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes..."

    # Update image versions in k8s manifests
    sed -i.bak "s|image:.*backend:.*|image: $IMAGE_REGISTRY/backend:$VERSION|g" k8s/production/*.yaml
    sed -i.bak "s|image:.*frontend:.*|image: $IMAGE_REGISTRY/frontend:$VERSION|g" k8s/production/*.yaml
    sed -i.bak "s|image:.*hardhat:.*|image: $IMAGE_REGISTRY/hardhat:$VERSION|g" k8s/production/*.yaml

    # Apply Kubernetes manifests
    log_info "Applying Kubernetes manifests..."
    kubectl apply -f k8s/production/namespace.yaml
    kubectl apply -f k8s/production/configmap.yaml
    kubectl apply -f k8s/production/secrets.yaml
    kubectl apply -f k8s/production/deployment.yaml
    kubectl apply -f k8s/production/service.yaml
    kubectl apply -f k8s/production/ingress.yaml
    kubectl apply -f k8s/production/hpa.yaml
    kubectl apply -f k8s/production/pdb.yaml

    log_success "Kubernetes deployment completed"
}

# Wait for deployment readiness
wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."

    # Wait for deployments to be available
    kubectl wait --for=condition=available --timeout=600s deployment/$DEPLOYMENT_NAME -n $NAMESPACE

    # Check pod status
    kubectl get pods -n $NAMESPACE

    log_success "Deployment is ready"
}

# Run post-deployment health checks
post_deployment_health_checks() {
    log_info "Running post-deployment health checks..."

    # Wait a bit for services to start
    sleep 30

    # Check if services are responding
    BACKEND_URL="http://backend.$NAMESPACE.svc.cluster.local:3001"
    FRONTEND_URL="http://frontend.$NAMESPACE.svc.cluster.local:3000"

    # Health check backend
    if curl -f -s $BACKEND_URL/health > /dev/null; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        exit 1
    fi

    # Health check frontend
    if curl -f -s $FRONTEND_URL > /dev/null; then
        log_success "Frontend health check passed"
    else
        log_error "Frontend health check failed"
        exit 1
    fi

    log_success "All health checks passed"
}

# Setup monitoring and logging
setup_monitoring() {
    log_info "Setting up monitoring and logging..."

    # Deploy Prometheus
    kubectl apply -f monitoring/prometheus.yml -n $NAMESPACE

    # Deploy Grafana
    kubectl apply -f k8s/production/grafana.yaml -n $NAMESPACE

    # Deploy ELK stack
    kubectl apply -f k8s/production/elk-stack.yaml -n $NAMESPACE

    log_success "Monitoring stack deployed"
}

# Run security scan on deployed containers
security_scan() {
    log_info "Running security scan on deployed containers..."

    # Get all images used in the deployment
    kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].spec.containers[*].image}' | \
    tr ' ' '\n' | \
    sort | \
    uniq | \
    while read image; do
        log_info "Scanning image: $image"

        # Run Trivy security scan (if available)
        if command -v trivy &> /dev/null; then
            trivy image --format json --output security-scan.json $image
            log_success "Security scan completed for $image"
        else
            log_warning "Trivy not available, skipping security scan for $image"
        fi
    done
}

# Main deployment function
main() {
    log_info "Starting OUI Phase 3 Production Deployment"

    # Run pre-deployment checks
    pre_deployment_checks

    # Build and push images
    build_and_push_images

    # Deploy to Kubernetes
    deploy_to_kubernetes

    # Wait for deployment readiness
    wait_for_deployment

    # Run health checks
    post_deployment_health_checks

    # Setup monitoring
    setup_monitoring

    # Security scan
    security_scan

    log_success "🎉 OUI Production Deployment Completed Successfully!"
    log_info "📊 Deployment Summary:"
    log_info "   Version: $VERSION"
    log_info "   Namespace: $NAMESPACE"
    log_info "   Images: $IMAGE_REGISTRY/*:$VERSION"
    log_info "   Status: Ready for production use"

    # Print access information
    log_info "🔗 Access Information:"
    kubectl get ingress -n $NAMESPACE -o wide
    kubectl get services -n $NAMESPACE -o wide
}

# Handle script arguments
case "${1:-}" in
    "build")
        build_and_push_images
        ;;
    "deploy")
        deploy_to_kubernetes
        wait_for_deployment
        ;;
    "health")
        post_deployment_health_checks
        ;;
    "monitor")
        setup_monitoring
        ;;
    "security")
        security_scan
        ;;
    "full")
        main
        ;;
    *)
        echo "Usage: $0 {build|deploy|health|monitor|security|full}"
        echo "  build    - Build and push Docker images"
        echo "  deploy   - Deploy to Kubernetes"
        echo "  health   - Run health checks"
        echo "  monitor  - Setup monitoring stack"
        echo "  security - Run security scan"
        echo "  full     - Full deployment pipeline"
        exit 1
        ;;
esac