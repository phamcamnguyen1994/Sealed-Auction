# Contributing to Sealed Auction

Thank you for your interest in contributing to the Sealed Auction project! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Git
- Basic knowledge of React, TypeScript, and Solidity
- Understanding of FHEVM concepts

### Development Setup
1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/Sealed-Auction.git`
3. Install dependencies: `npm install`
4. Set up environment variables (copy `env.example` to `.env`)
5. Start development: `npm run dev`

## 📋 Contribution Guidelines

### Code Style
- **TypeScript**: Use strict typing, avoid `any`
- **React**: Follow functional components with hooks
- **Solidity**: Follow OpenZeppelin standards
- **Comments**: Document complex FHE operations

### Commit Messages
Use conventional commit format:
```
feat: add new auction creation feature
fix: resolve FHE decryption issue
docs: update README with new instructions
test: add unit tests for bid placement
```

### Pull Request Process
1. Create a feature branch from `main`
2. Make your changes with tests
3. Ensure all tests pass
4. Update documentation if needed
5. Submit PR with clear description

## 🔧 Development Areas

### Smart Contracts
- **Location**: `contracts/SealedAuction.sol`
- **Focus**: FHE operations, security, gas optimization
- **Testing**: Use Hardhat test framework

### Frontend
- **Location**: `packages/site/`
- **Focus**: UI/UX, FHEVM integration, responsive design
- **Testing**: React Testing Library

### Documentation
- **Location**: `README.md`, `docs/`
- **Focus**: User guides, API documentation, examples

## 🧪 Testing

### Contract Tests
```bash
npm run test
npm run coverage
```

### Frontend Tests
```bash
cd packages/site
npm run test
```

### Integration Tests
```bash
npm run test:integration
```

## 🔐 Security Considerations

### FHE Security
- Never log encrypted values
- Validate all FHE operations
- Test edge cases thoroughly

### Smart Contract Security
- Follow security best practices
- Use OpenZeppelin libraries
- Audit critical functions

## 📝 Documentation

### Code Documentation
- Use JSDoc for functions
- Comment complex algorithms
- Explain FHE operations clearly

### User Documentation
- Update README for new features
- Create guides for complex workflows
- Provide examples and tutorials

## 🐛 Bug Reports

When reporting bugs, please include:
- **Environment**: OS, Node.js version, browser
- **Steps to reproduce**: Clear, numbered steps
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Console logs**: Any error messages

## 💡 Feature Requests

For feature requests, please:
- Check existing issues first
- Provide clear use case
- Explain the benefit
- Consider implementation complexity

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Discord**: Join our community (link in README)

## 🏆 Recognition

Contributors will be recognized in:
- README contributors section
- Release notes
- Project documentation

Thank you for contributing to Sealed Auction! 🎉
