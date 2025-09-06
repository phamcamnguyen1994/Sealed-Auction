# 🔐 Sealed Auction - Confidential Bidding with FHEVM

A fully functional sealed auction dApp built with **FHEVM** (Fully Homomorphic Encryption Virtual Machine) that enables confidential bidding on the blockchain. Bids remain encrypted until the auction ends, ensuring complete privacy during the bidding process.

![FHEVM](https://img.shields.io/badge/FHEVM-Enabled-blue)
![React](https://img.shields.io/badge/React-18.2.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black)
![Hardhat](https://img.shields.io/badge/Hardhat-2.19.0-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue)

## 🌟 Features

### 🔒 **Confidential Bidding**
- **FHE Encryption**: All bids are encrypted using Fully Homomorphic Encryption
- **Zero-Knowledge**: No one can see bid amounts until auction ends
- **Privacy-First**: Complete confidentiality during bidding phase

### 🎨 **Modern UI/UX**
- **Responsive Design**: Beautiful gradient-based interface
- **Real-time Updates**: Live auction status and timing
- **Auction Item Display**: Image upload and preset items
- **Seller Permissions**: Role-based access control

### ⚡ **Technical Excellence**
- **Multi-Network Support**: Localhost, Sepolia testnet
- **Automated Deployment**: One-command deployment and ABI sync
- **TypeScript**: Full type safety throughout
- **FHEVM Integration**: Complete relayer SDK integration

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FHEVM Relayer  │    │  Smart Contract │
│                 │    │                 │    │                 │
│ • Next.js 14    │◄──►│ • FHE Encryption│◄──►│ • SealedAuction │
│ • TypeScript    │    │ • Decryption    │    │ • Solidity      │
│ • Tailwind CSS  │    │ • Key Management│    │ • FHE Operations│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **Git**
- **MetaMask** browser extension
- **Hardhat** (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/phamcamnguyen1994/Sealed-Auction.git
   cd Sealed-Auction
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd packages/site
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Add your configuration
   INFURA_API_KEY=your_infura_key
   PRIVATE_KEY=your_private_key
   ```

### 🏃‍♂️ Running the Application

#### **Option 1: Local Development**
```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy to localhost
npm run deploy:localhost

# Terminal 3: Start frontend
cd packages/site
npm run dev
```

#### **Option 2: Sepolia Testnet**
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Start frontend
cd packages/site
npm run dev
```

## 📖 Usage Guide

### 🎯 **For Auction Creators (Sellers)**

1. **Connect MetaMask** to the application
2. **Deploy Auction** using the deployment scripts
3. **Upload Item Image** or select from preset items
4. **Set Auction Duration** (in seconds)
5. **Share Auction Address** with bidders

### 💰 **For Bidders**

1. **Connect MetaMask** to the application
2. **Navigate to Auction** using the contract address
3. **Place Encrypted Bid** - amount remains secret
4. **Wait for Auction End** - results revealed after finalization
5. **View Results** - highest bid and winner announced

### 🏁 **Auction Finalization**

1. **Automatic End**: Auction ends after specified duration
2. **Manual Finalize**: Seller can finalize after time expires
3. **Results Reveal**: Encrypted bids are decrypted and displayed
4. **Winner Announcement**: Highest bidder and amount revealed

## 🔧 Technical Details

### **Smart Contract Features**

```solidity
contract SealedAuction {
    // Core auction state
    address public immutable seller;
    uint256 public immutable endTime;
    bool public ended;
    uint32 public bids;
    
    // FHE encrypted state
    euint64 private highestBidEnc;   // Encrypted highest bid
    eaddress private winnerEnc;      // Encrypted winner address
    
    // Permission system
    mapping(address => bool) public canViewAfterEnd;
}
```

### **FHE Operations**

- **Bid Encryption**: `FHE.fromExternal()` for encrypted bid placement
- **Confidential Comparison**: `FHE.select()` for encrypted branching
- **Result Decryption**: `FHE.allow()` for controlled result access

### **Frontend Architecture**

- **React Hooks**: Custom hooks for contract interactions
- **FHEVM SDK**: Complete integration with relayer
- **TypeScript**: Full type safety and IntelliSense
- **Responsive Design**: Mobile-first approach

## 📁 Project Structure

```
Sealed-Auction/
├── contracts/                 # Smart contracts
│   └── SealedAuction.sol     # Main auction contract
├── scripts/                  # Deployment scripts
│   ├── deploy-and-update.ts  # Automated deployment
│   └── genabi.ts            # ABI generation
├── packages/site/            # React frontend
│   ├── components/          # UI components
│   ├── hooks/              # Custom React hooks
│   ├── contracts/          # ABI files
│   └── app/               # Next.js app
├── deployments/            # Deployment records
└── abi/                   # Contract ABIs
```

## 🛠️ Development

### **Available Scripts**

```bash
# Deployment
npm run deploy:localhost    # Deploy to local Hardhat
npm run deploy:sepolia      # Deploy to Sepolia testnet

# Development
npm run genabi             # Generate ABI and addresses
npm run dev                # Start development server

# Testing
npm run test               # Run contract tests
npm run coverage           # Test coverage report
```

### **Adding New Features**

1. **Smart Contract**: Modify `contracts/SealedAuction.sol`
2. **Frontend**: Update components in `packages/site/components/`
3. **Hooks**: Extend functionality in `packages/site/hooks/`
4. **Deploy**: Use `npm run deploy:sepolia` to test on testnet

## 🔐 Security Considerations

### **FHE Security**
- **Private Keys**: Never expose FHE private keys
- **Encryption**: All sensitive data encrypted on-chain
- **Access Control**: Permission-based result viewing

### **Smart Contract Security**
- **Access Control**: Only seller can finalize auction
- **Time Validation**: Strict time-based auction rules
- **Input Validation**: All inputs properly validated

### **Frontend Security**
- **MetaMask Integration**: Secure wallet connection
- **HTTPS Only**: All communications encrypted
- **Input Sanitization**: All user inputs sanitized

## 🌐 Network Support

| Network | Chain ID | Status | Notes |
|---------|----------|--------|-------|
| **Localhost** | 31337 | ✅ Active | Development only |
| **Sepolia** | 11155111 | ✅ Active | Testnet deployment |
| **Mainnet** | 1 | 🚧 Planned | Future release |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Development Guidelines**

- **Code Style**: Follow TypeScript/React best practices
- **Testing**: Add tests for new features
- **Documentation**: Update README for significant changes
- **Security**: Review FHE operations for security implications

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Zama Team** for FHEVM technology
- **FHEVM React Template** for the foundation
- **Hardhat** for development framework
- **Next.js** for the frontend framework

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/phamcamnguyen1994/Sealed-Auction/issues)
- **Discussions**: [GitHub Discussions](https://github.com/phamcamnguyen1994/Sealed-Auction/discussions)
- **Documentation**: [FHEVM Docs](https://docs.fhevm.org/)

---

**Built with ❤️ using FHEVM technology**

*Empowering confidential blockchain applications through Fully Homomorphic Encryption*