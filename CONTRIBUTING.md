# Contributing to One Universal Identity (OUI)

Thank you for your interest in contributing to One Universal Identity! We welcome contributions from the community and are grateful for your help in making OUI better.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create** a feature branch
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a pull request

## 📋 Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Security Considerations](#security-considerations)
- [Documentation](#documentation)
- [Community Guidelines](#community-guidelines)

## 🛠️ Development Setup

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git** >= 2.30.0
- **Hardhat** for smart contract development
- **MetaMask** or compatible Web3 wallet (for testing)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/one-universal-identity.git
   cd one-universal-identity
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Compile smart contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

### Development Servers

```bash
# Start local blockchain (Hardhat node)
npm run node

# Start backend server (in another terminal)
npm start

# Frontend development (when available)
# npm run dev:frontend
```

## 🏗️ Project Structure

```
├── contracts/              # Smart contracts (Solidity)
│   ├── OUIIdentity.sol     # Core identity management
│   ├── UVTToken.sol        # Universal verification tokens
│   ├── DAO.sol             # Decentralized governance
│   └── ...
├── src/
│   ├── backend/            # Express.js API server
│   ├── frontend/           # React/TypeScript web app
│   ├── mobile-sdk/         # Cross-platform mobile SDK
│   ├── ai-detection/       # AI/ML threat detection
│   ├── networks/           # Cross-chain functionality
│   └── ...
├── test/                   # Test suites
├── docs/                   # Documentation
├── scripts/                # Deployment scripts
└── examples/               # Usage examples
```

## 📝 Coding Standards

### General Guidelines

- **Write clear, self-documenting code**
- **Follow the existing code style and patterns**
- **Keep functions and methods small and focused**
- **Use meaningful variable and function names**
- **Add comments for complex business logic**

### TypeScript/JavaScript

- Use **ES6+** features appropriately
- Follow **async/await** patterns for asynchronous code
- Use **TypeScript** for type safety
- Follow **camelCase** naming convention
- Use **const** and **let** appropriately
- Handle errors gracefully with try/catch

### Solidity

- Follow **[Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)**
- Use **OpenZeppelin** libraries when possible
- Implement **proper access controls**
- Include **comprehensive NatSpec documentation**
- Use **safe math operations**
- Implement **emergency pause mechanisms**

### Commit Messages

Follow **[Conventional Commits](https://conventionalcommits.org/)**:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks

## 🧪 Testing Guidelines

### Testing Requirements

- **Maintain test coverage above 95%**
- **Write tests for all new features**
- **Include both unit and integration tests**
- **Test error conditions and edge cases**
- **Use descriptive test names**

### Smart Contract Testing

```bash
# Run all contract tests
npm run test

# Run specific test file
npx hardhat test test/contracts/OUIIdentity.test.ts

# Run with gas reporting
npm run gas-report
```

### Backend API Testing

```bash
# Run backend tests
npm run test:backend

# Run with coverage
npm run test:backend:coverage
```

### Frontend Testing

```bash
# Run frontend component tests
npm run test:frontend

# Run end-to-end tests
npm run test:e2e
```

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure all tests pass**
2. **Update documentation if needed**
3. **Check for linting errors**
4. **Test on multiple networks if applicable**
5. **Review your changes thoroughly**

### PR Requirements

- **Clear, descriptive title**
- **Detailed description** of changes
- **Reference any related issues**
- **Include screenshots** for UI changes
- **Update tests** if functionality changed
- **Follow code standards**

### PR Review Process

1. **Automated checks** run on all PRs
2. **Maintainers review** for code quality
3. **Security review** for sensitive changes
4. **Testing** on staging environment
5. **Final approval** and merge

## 🔒 Security Considerations

### For All Contributors

- **Never commit sensitive information** (API keys, private keys, passwords)
- **Follow security best practices** in all code
- **Report security issues** through proper channels (see [SECURITY.md](./SECURITY.md))
- **Use secure coding patterns**
- **Validate all inputs**

### For Smart Contract Contributors

- **Be extra cautious** with contract upgrades
- **Consider gas optimization** but prioritize security
- **Use established patterns** from OpenZeppelin
- **Include comprehensive testing**
- **Document security considerations**

### For AI/ML Contributors

- **Ensure model security** and robustness
- **Consider adversarial attacks**
- **Validate model performance** thoroughly
- **Document model limitations**
- **Include bias detection measures**

## 📚 Documentation

### When to Update Docs

- **New features** require documentation
- **API changes** need updated examples
- **Architecture changes** require diagram updates
- **Setup changes** need installation guide updates

### Documentation Standards

- **Use clear, concise language**
- **Include code examples** for new features
- **Update README.md** for significant changes
- **Keep API documentation** current
- **Include troubleshooting sections**

## 🌟 Types of Contributions

### Code Contributions

- **Bug fixes** and performance improvements
- **New features** and enhancements
- **Test coverage** improvements
- **Documentation** updates
- **Security** hardening

### Non-Code Contributions

- **Bug reports** and feature requests
- **Documentation** improvements
- **Community support** and evangelism
- **Design** and UX improvements
- **Research** and analysis

## 🏆 Recognition

Contributors who make significant impacts may be:

- **Acknowledged** in release notes
- **Featured** on our website
- **Invited** to special events
- **Considered** for maintainer roles
- **Nominated** for community awards

## 📞 Getting Help

### Community Resources

- **LinkedIn**: [AIdentiCore](https://www.linkedin.com/company/aidenticore/about/?viewAsMember=true)
- **Twitter**: [@AidentiCore](https://x.com/AidentiCore)
- **GitHub Issues**: [Bug reports and feature requests](https://github.com/your-org/one-universal-identity/issues)
- **GitHub Discussions**: [Q&A and community discussions](https://github.com/your-org/one-universal-identity/discussions)
- **Discord**: [discord.gg/oui](https://discord.gg/oui)


### Development Support

- **Documentation**: [docs.oui.com](https://docs.oui.com)
- **API Reference**: [api.oui.com](https://api.oui.com)
- **Email**: rajkumarrawal@aidenticore.com



## ⚖️ License

By contributing to One Universal Identity, you agree that your contributions will be licensed under the same [Apache License 2.0](./LICENSE) that covers the project.

## 🙏 Acknowledgments

We'd like to thank all our contributors for helping make One Universal Identity better. Your time, expertise, and passion are what make open source great.

### Hall of Fame

*Contributors with exceptional contributions will be featured here*

---

**Last Updated**: September 2025
**Version**: 1.0

*Happy contributing! 🎉*