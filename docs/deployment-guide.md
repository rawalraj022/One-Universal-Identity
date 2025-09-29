# One Universal Identity (OUI) - Deployment Guide

## Overview

This guide provides deployment instructions for the One Universal Identity (OUI) system. **Note**: Current deployment focuses on development and testing environments. Production deployment will require additional infrastructure setup.

> **⚠️ Development Status**: This deployment guide covers current development setup. Production deployment instructions will be updated as components mature. See [Development Roadmap](../../../README.md#development-roadmap) for production readiness timeline.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Smart Contract Deployment](#smart-contract-deployment)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Mobile App Deployment](#mobile-app-deployment)
7. [Docker & Containerization](#docker--containerization)
8. [Kubernetes Deployment](#kubernetes-deployment)
9. [CI/CD Pipeline](#ci-cd-pipeline)
10. [Monitoring & Scaling](#monitoring--scaling)
11. [Troubleshooting](#troubleshooting)

## Deployment Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Smart Contract Deployment** | ✅ Working | Core contracts deploy and function correctly |
| **Backend API** | ✅ Working | Express.js server with comprehensive testing |
| **Frontend Framework** | ✅ Working | React app with wallet integration and tooling |
| **Mobile SDK** | ✅ Working | Cross-platform SDK ready for integration |
| **Build System** | ✅ Working | Complete TypeScript compilation and tooling |
| **Testing Infrastructure** | ✅ Working | Jest framework with 80%+ coverage |
| **Database Integration** | 🔄 In Development | Currently uses in-memory storage |
| **Production Infrastructure** | 🔄 Planned | Docker/Kubernetes setup in progress |
| **Monitoring Stack** | 🔄 Planned | Prometheus/Grafana implementation planned |
| **CI/CD Pipeline** | 🔄 Planned | GitHub Actions workflow in development |

---

## Prerequisites

### System Requirements

```bash
# Minimum requirements
Node.js >= 22.10.0 (required for Hardhat compatibility)
npm >= 8.0.0 or yarn >= 1.22.0
Git >= 2.30.0
Docker (optional, for containerized development)

# For blockchain development
Hardhat >= 2.17.0
ethers.js >= 6.8.0

# Development tooling (automatically installed)
TypeScript >= 5.2.2
ESLint >= 8.0.0
Jest >= 29.5.0

# For database
PostgreSQL >= 15.0 (recommended)
Redis >= 7.0 (recommended)

# For monitoring
Prometheus >= 2.40.0
Grafana >= 9.0.0
```

### Infrastructure Requirements

- **Blockchain Networks**: Ethereum mainnet, testnets, or Layer 2 networks
- **Cloud Provider**: AWS, GCP, Azure, or DigitalOcean
- **Domain & SSL**: Registered domain with SSL certificate
- **CDN**: CloudFront, Cloudflare, or similar for static assets
- **Load Balancer**: Application Load Balancer for API traffic
- **Database**: Managed PostgreSQL instance
- **Cache**: Redis cluster for session and data caching

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/one-universal-identity.git
cd one-universal-identity
```

### 2. Install Dependencies

```bash
# Install all dependencies (includes development tooling)
npm install

# Note: The main package.json includes:
# - Smart contract development tools (Hardhat, ethers.js)
# - Backend runtime dependencies (Express, CORS, etc.)
# - Frontend development tools (React, TypeScript)
# - Testing frameworks (Jest, testing-library)
# - Development tooling (ESLint, Babel, ts-node)
```

### 3. Environment Configuration

Create environment files:

```bash
# .env (main environment file)
NODE_ENV=development
PORT=3000

# Blockchain (for Hardhat local development)
ETHEREUM_RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_private_key_here

# Database (currently uses in-memory storage)
# DATABASE_URL=postgresql://localhost:5432/oui_dev
# REDIS_URL=redis://localhost:6379

# Security (for production)
# JWT_SECRET=your_jwt_secret_here
# API_ENCRYPTION_KEY=your_encryption_key_here

# External APIs (for production deployment)
# INFURA_PROJECT_ID=your_infura_project_id
# ETHERSCAN_API_KEY=your_etherscan_api_key
```

> **Note**: Database configuration is prepared for PostgreSQL/MongoDB integration. Currently uses in-memory storage for development.

### 4. Start Local Blockchain

```bash
# Start Hardhat local network
npx hardhat node

# In another terminal, deploy contracts
npx hardhat run scripts/deploy.ts --network localhost
```

### 5. Start Services

```bash
# Start backend API (port 3000)
npm start

# Note: Frontend development framework is ready for integration
# Mobile SDK is fully functional for development

# Start database and Redis (if using Docker)
# Note: Currently uses in-memory storage, Docker setup ready for production
# docker-compose up -d mongodb redis
```

### 6. Verify Installation

```bash
# Check backend service is running (port 3001)
curl http://localhost:3001/health

# Run comprehensive test suite
npm run test:all

# Run Jest tests only (backend/frontend)
npm run test:jest

# Run smart contract tests only
npm run test

# Compile and check smart contracts
npm run compile

# Check TypeScript compilation
npx tsc --noEmit

# Check code quality
npm run lint

# Build production bundle
npm run build
```

---

## Smart Contract Deployment

### Local Network Deployment

```typescript
// scripts/deploy.ts
import { ethers } from 'hardhat';

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log('Deploying contracts with:', deployer.address);

  // Deploy OUI Identity
  const OUIIdentity = await ethers.getContractFactory('OUIIdentity');
  const ouiIdentity = await OUIIdentity.deploy();
  await ouiIdentity.waitForDeployment();
  console.log('OUIIdentity deployed to:', await ouiIdentity.getAddress());

  // Deploy UVT Token
  const UVTToken = await ethers.getContractFactory('UVTToken');
  const uvtToken = await UVTToken.deploy();
  await uvtToken.waitForDeployment();

  // Initialize UVT Token
  await uvtToken.initialize(
    deployer.address,
    deployer.address,
    deployer.address,
    deployer.address,
    ethers.parseEther('0.001'), // mintingFee
    ethers.parseEther('0.0005'), // verificationReward
    500 // stakingRewardRate
  );

  console.log('UVTToken deployed to:', await uvtToken.getAddress());

  // Save deployment addresses
  const deployment = {
    network: 'localhost',
    contracts: {
      ouiIdentity: await ouiIdentity.getAddress(),
      uvtToken: await uvtToken.getAddress()
    }
  };

  console.log('Deployment complete:', deployment);
}

main().catch(console.error);
```

### Testnet Deployment

```bash
# Deploy to Sepolia testnet
npx hardhat run scripts/deploy.ts --network sepolia

# Verify contracts on Etherscan
npx hardhat run scripts/verify.ts --network sepolia
```

### Mainnet Deployment

```bash
# Deploy to Ethereum mainnet
npx hardhat run scripts/deploy.ts --network mainnet

# Verify contracts
npx hardhat run scripts/verify.ts --network mainnet
```

### Multi-Chain Deployment

```typescript
// scripts/deploy-multi-chain.ts
const networks = ['ethereum', 'polygon', 'arbitrum', 'optimism'];

async function deployToMultipleChains() {
  for (const network of networks) {
    console.log(`\n🚀 Deploying to ${network}...`);

    try {
      await hre.run('deploy', { network });
      console.log(`✅ Successfully deployed to ${network}`);
    } catch (error) {
      console.error(`❌ Failed to deploy to ${network}:`, error);
    }
  }
}
```

---

## Backend Deployment

### Express.js Backend Deployment

#### 1. Build Application

```bash
# Build TypeScript
npm run build

# Create production bundle
npm run build:prod
```

#### 2. Environment Setup

```bash
# Production environment variables
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://user:password@host:port/database
DB_SSL=true

# Redis
REDIS_URL=redis://user:password@host:port

# Security
JWT_SECRET=your_production_jwt_secret
ENCRYPTION_KEY=your_production_encryption_key

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_production_private_key

# External Services
ETHERSCAN_API_KEY=your_etherscan_api_key
INFURA_PROJECT_ID=your_infura_project_id
```

#### 3. PM2 Process Management

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem file
# ecosystem.config.js
module.exports = {
  apps: [{
    name: 'oui-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};

# Start application
pm2 start ecosystem.config.js

# Monitor processes
pm2 monit

# Check logs
pm2 logs oui-backend
```

#### 4. Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/oui-backend
upstream oui_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    server_name api.oui.com;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req zone=api burst=10 nodelay;

    location / {
        proxy_pass http://oui_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN npm ci --only=production && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nodejs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nodejs:nodejs /app/.next/static ./.next/static

USER nodejs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  oui-backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres/oui_prod
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=oui_prod
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - oui-backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

---

## Frontend Deployment

### React Application Deployment

#### 1. Build for Production

```bash
# Build the application
npm run build

# Analyze bundle size
npm run analyze

# Preview production build
npm run serve
```

#### 2. Environment Configuration

```javascript
// .env.production
REACT_APP_OUI_API_URL=https://api.oui.com/v1
REACT_APP_INFURA_PROJECT_ID=your_infura_project_id
REACT_APP_NETWORK=mainnet
REACT_APP_ANALYTICS_ID=your_analytics_id
```

#### 3. Static Hosting with CDN

```nginx
# Nginx configuration for React SPA
server {
    listen 80;
    server_name app.oui.com;
    root /var/www/oui-frontend;
    index index.html;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';";

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass https://api.oui.com;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### AWS S3 + CloudFront Deployment

```bash
# Install AWS CLI
pip install awscli

# Configure AWS
aws configure

# Create S3 bucket
aws s3 mb s3://oui-frontend-prod

# Enable static website hosting
aws s3 website s3://oui-frontend-prod --index-document index.html --error-document index.html

# Upload build files
aws s3 sync build/ s3://oui-frontend-prod --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Add custom domain
vercel domains add app.oui.com

# Set environment variables
vercel env add REACT_APP_OUI_API_URL
vercel env add REACT_APP_INFURA_PROJECT_ID
```

---

## Mobile App Deployment

### React Native

#### iOS Deployment

```bash
# Install dependencies
cd ios && pod install

# Build for release
npx react-native run-ios --configuration Release

# Create archive for App Store
xcodebuild -workspace ios/OUI.xcworkspace -scheme OUI -configuration Release archive -archivePath build/OUI.xcarchive

# Upload to App Store Connect
xcrun altool --upload-app -f build/OUI.xcarchive -u YOUR_APPLE_ID -p YOUR_APP_PASSWORD
```

#### Android Deployment

```bash
# Generate signing key
keytool -genkey -v -keystore oui-release.keystore -alias oui-key -keyalg RSA -keysize 2048 -validity 10000

# Configure gradle.properties
MYAPP_RELEASE_STORE_FILE=oui-release.keystore
MYAPP_RELEASE_KEY_ALIAS=oui-key
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password

# Build release APK
cd android && ./gradlew assembleRelease

# Build bundle for Play Store
./gradlew bundleRelease

# Upload to Google Play Console
# Use the generated AAB file in android/app/build/outputs/bundle/release/
```

### Code Signing

#### iOS Code Signing

```ruby
# ios/OUI.xcodeproj/project.pbxproj
DEVELOPMENT_TEAM = YOUR_TEAM_ID;
CODE_SIGN_IDENTITY = "iPhone Distribution";
PROVISIONING_PROFILE_SPECIFIER = "OUI App Store";
```

#### Android Code Signing

```gradle
// android/app/build.gradle
android {
    signingConfigs {
        release {
            storeFile file('oui-release.keystore')
            storePassword System.getenv('STORE_PASSWORD')
            keyAlias System.getenv('KEY_ALIAS')
            keyPassword System.getenv('KEY_PASSWORD')
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## Docker & Containerization

### Multi-Stage Dockerfile

```dockerfile
# Complete multi-stage Dockerfile
FROM node:18-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Smart contracts stage
FROM base AS contracts
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY contracts ./contracts
COPY hardhat.config.ts ./

RUN npm run compile:contracts

# Production stage
FROM base AS production
WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/public ./public
COPY --from=contracts --chown=nodejs:nodejs /app/artifacts ./artifacts

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

USER nodejs

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

### Docker Compose with Monitoring

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  oui-backend:
    build:
      context: .
      target: production
    image: oui/backend:latest
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
      - prometheus
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=oui_prod
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - nginx_logs:/var/log/nginx
    depends_on:
      - oui-backend
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
  nginx_logs:
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:all

      - name: Run smart contract tests
        run: npx hardhat test

      - name: Build application
        run: npm run build

  deploy-contracts:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Deploy to testnet
        run: npx hardhat run scripts/deploy.ts --network sepolia
        env:
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}

      - name: Verify contracts
        run: npx hardhat run scripts/verify.ts --network sepolia
        env:
          ETHERSCAN_API_KEY: ${{ secrets.ETHERSCAN_API_KEY }}

  deploy-backend:
    needs: deploy-contracts
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster oui-cluster --service oui-backend --force-new-deployment

  deploy-frontend:
    needs: deploy-backend
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          REACT_APP_OUI_API_URL: ${{ secrets.REACT_APP_OUI_API_URL }}

      - name: Deploy to S3
        run: aws s3 sync build/ s3://oui-frontend-prod --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}

      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
```

### Jenkins Pipeline

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        DOCKER_IMAGE = 'oui/backend'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/your-org/one-universal-identity.git'
            }
        }

        stage('Test') {
            steps {
                sh 'npm ci'
                sh 'npm run test:all'
                sh 'npx hardhat test'
            }
            post {
                always {
                    junit 'test-results/**/*.xml'
                    publishCoverage adapters: [coberturaAdapter('coverage/cobertura-coverage.xml')]
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
                sh 'docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} .'
                sh 'docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest'
            }
        }

        stage('Deploy to Staging') {
            when {
                branch 'develop'
            }
            steps {
                sh 'docker-compose -f docker-compose.staging.yml up -d'
            }
        }

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                timeout(time: 15, unit: 'MINUTES') {
                    input message: 'Deploy to production?', ok: 'Deploy'
                }
                sh 'docker-compose -f docker-compose.prod.yml up -d'
            }
        }
    }

    post {
        success {
            slackSend color: 'good', message: "Deployment successful: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
        failure {
            slackSend color: 'danger', message: "Deployment failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
    }
}
```

---

## Monitoring & Scaling

### Application Monitoring

```typescript
// Monitoring setup
import { collectDefaultMetrics, register, Gauge } from 'prom-client';

// Enable default metrics
collectDefaultMetrics();

// Custom metrics
const activeUsers = new Gauge({
  name: 'oui_active_users',
  help: 'Number of active users'
});

const apiRequests = new Gauge({
  name: 'oui_api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'endpoint', 'status']
});

// Middleware for request monitoring
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    apiRequests
      .labels(req.method, req.path, res.statusCode.toString())
      .inc();

    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });

  next();
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});
```

### Performance Monitoring

```typescript
// Performance monitoring
import { PerformanceObserver, performance } from 'perf_hooks';

const obs = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.duration > 100) { // Log operations taking more than 100ms
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  });
});

obs.observe({ entryTypes: ['measure'], buffered: true });

// Measure function execution
function measurePerformance<T>(name: string, fn: () => T): T {
  performance.mark(`${name}-start`);
  const result = fn();
  performance.mark(`${name}-end`);
  performance.measure(name, `${name}-start`, `${name}-end`);
  return result;
}
```

### Auto Scaling

```yaml
# Kubernetes HPA for backend
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: oui-backend-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: oui-backend
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

---

## Troubleshooting

### Common Deployment Issues

#### 1. Smart Contract Deployment Failures

```bash
# Check gas limit
npx hardhat run scripts/estimate-gas.ts

# Increase gas limit in hardhat.config.ts
networks: {
  mainnet: {
    gasPrice: 50000000000, // 50 gwei
    gasLimit: 8000000
  }
}
```

#### 2. Database Connection Issues

```typescript
// Test database connection
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
});

await client.connect();
await client.query('SELECT NOW()');
await client.end();
```

#### 3. Redis Connection Issues

```typescript
// Test Redis connection
import { createClient } from 'redis';

const client = createClient({
  url: process.env.REDIS_URL
});

client.on('error', (err) => console.log('Redis Client Error', err));
await client.connect();
await client.set('test', 'value');
await client.disconnect();
```

#### 4. Application Startup Issues

```bash
# Check environment variables
node -e "console.log(process.env)"

# Test application startup
NODE_ENV=production npm run build
NODE_ENV=production npm start

# Check logs
tail -f logs/combined.log
```

#### 5. Performance Issues

```typescript
// Enable performance monitoring
import { PerformanceObserver } from 'perf_hooks';

const obs = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});

obs.observe({ entryTypes: ['measure'], buffered: true });

// Profile memory usage
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(usage.external / 1024 / 1024)} MB`
  });
}, 30000);
```

### Rollback Strategy

```bash
# Quick rollback script
#!/bin/bash

echo "Starting rollback process..."

# Stop current deployment
docker-compose down

# Revert to previous version
git checkout HEAD~1

# Rebuild and redeploy
npm run build
docker-compose up -d

# Verify rollback
curl -f http://localhost:3001/health

if [ $? -eq 0 ]; then
  echo "✅ Rollback successful"
else
  echo "❌ Rollback failed, manual intervention required"
fi
```

---

This deployment guide provides a comprehensive foundation for deploying the OUI system. For specific environment configurations or additional deployment scenarios, refer to the project's issue tracker or community forums.