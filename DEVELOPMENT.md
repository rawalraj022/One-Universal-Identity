# Development Guide

This guide provides comprehensive information for setting up and developing the One Universal Identity (OUI) system.

## Prerequisites

### Node.js Version
**Important**: This project requires Node.js 22.10.0 or later for Hardhat compatibility.

- **Current requirement**: Node.js ≥ 22.10.0
- **Recommended**: Use nvm (Node Version Manager) for easy version management

### Installation

1. **Install Node.js 22+**:
   ```bash
   # Using nvm (recommended)
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 22
   nvm use 22
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Development Scripts

### Build & Compilation
```bash
# Build TypeScript to JavaScript
npm run build

# Compile smart contracts
npm run compile

# Development mode with auto-reload
npm run dev
```

### Testing
```bash
# Run all tests (Jest + Hardhat)
npm run test:all

# Run only Jest tests (backend/frontend)
npm run test:jest

# Run only Hardhat tests (smart contracts)
npm run test

# Run comprehensive test suite
npx ts-node test/test-runner.ts
```

### Code Quality
```bash
# Lint code
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### Deployment
```bash
# Deploy smart contracts to local network
npm run deploy

# Start local Hardhat node
npm run node
```

## Project Structure

```
├── contracts/          # Smart contracts
├── src/
│   ├── backend/       # API routes and business logic
│   ├── frontend/      # React components
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   └── server.ts      # Main server file
├── test/              # Test files
├── scripts/           # Deployment scripts
└── docs/              # Documentation
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

### Required Variables
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 3001)
- `ETHEREUM_RPC_URL`: Blockchain RPC URL
- `PRIVATE_KEY`: Deployer private key

### Optional Variables
- Database configuration
- JWT secrets
- API keys (Etherscan, etc.)

## Docker Development

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# Start only development services
docker-compose --profile dev up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

### Development with Hot Reload
```bash
# Mount source code for live reloading
docker-compose -f docker-compose.dev.yml up
```

## Smart Contract Development

### Local Development Network
```bash
# Start local Hardhat node
npm run node

# Deploy contracts to local network
npm run deploy

# Test contracts
npm run test
```

### Contract Deployment
1. Configure network in `hardhat.config.ts`
2. Set deployment parameters in `scripts/deploy.ts`
3. Run deployment: `npm run deploy`

## API Development

### Backend Structure
- **Routes**: `src/backend/` - Express.js route handlers
- **Utils**: `src/utils/` - Blockchain and database utilities
- **Types**: `src/types/` - TypeScript definitions

### Adding New Endpoints
1. Create route file in `src/backend/`
2. Add route to `src/server.ts`
3. Add tests in `test/backend/`

## Testing Strategy

### Unit Tests
- Test individual functions and components
- Mock external dependencies
- Fast execution

### Integration Tests
- Test API endpoints
- Test database operations
- Test blockchain interactions

### Performance Tests
- Load testing with concurrent users
- Gas usage optimization
- Throughput measurement

## Code Quality

### Linting
- ESLint for TypeScript/JavaScript
- Prettier for code formatting
- Pre-commit hooks (recommended)

### Type Safety
- Strict TypeScript configuration
- Interface definitions for all data structures
- Type checking in CI/CD

## Deployment

### Staging Deployment
```bash
# Build production assets
npm run build

# Run database migrations
npm run migrate

# Start production server
npm start
```

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Contracts deployed and verified
- [ ] Tests passing
- [ ] Monitoring configured

## Troubleshooting

### Common Issues

1. **Node.js Version Issues**
   ```bash
   # Check Node.js version
   node --version

   # Should be ≥ 22.10.0
   nvm install 22
   nvm use 22
   ```

2. **Hardhat Compilation Issues**
   ```bash
   # Clear cache and reinstall
   rm -rf node_modules package-lock.json
   npm install
   npm run compile
   ```

3. **TypeScript Errors**
   ```bash
   # Check TypeScript compilation
   npx tsc --noEmit

   # Build project
   npm run build
   ```

4. **Test Failures**
   ```bash
   # Run specific test file
   npx jest test/backend/identity-api.test.ts

   # Debug mode
   npx jest --verbose
   ```

## Contributing

1. Follow TypeScript and ESLint guidelines
2. Write tests for new features
3. Update documentation
4. Test on multiple Node.js versions

## Support

For issues and questions:
- Check existing documentation in `docs/`
- Review test files for examples
- Check GitHub issues for similar problems