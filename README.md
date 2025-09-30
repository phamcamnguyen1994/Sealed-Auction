# 🔐 Sealed Auction Marketplace - Confidential Bidding with FHEVM

A complete sealed auction dApp built with **FHEVM** (Fully Homomorphic Encryption Virtual Machine) that enables confidential bidding on the blockchain. All bids remain encrypted until the auction ends, ensuring complete privacy during the bidding process.

![FHEVM](https://img.shields.io/badge/FHEVM-Enabled-blue)
![React](https://img.shields.io/badge/React-19.1.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.4.2-black)
![Hardhat](https://img.shields.io/badge/Hardhat-2.26.3-yellow)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)

## 🌟 Project Overview

### 🎯 **Purpose**
The Sealed Auction Marketplace is a decentralized auction platform using Fully Homomorphic Encryption (FHE) technology to ensure absolute confidentiality of bids. Participants can place bids without worrying about bid information being revealed until the auction ends.

### 🏗️ **System Architecture**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  FHEVM Relayer  │    │  Smart Contract │
│                 │    │                 │    │                 │
│ • Next.js 15     │◄──►│ • FHE Encryption│◄──►│ • SealedAuction │
│ • TypeScript     │    │ • Decryption    │    │ • AuctionFactory│
│ • Tailwind CSS   │    │ • Key Management│    │ • AuctionRegistry│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 **Smart Contracts Used**

### 1. **SealedAuction.sol** - Main Auction Contract
- **Function**: Manages sealed auction with FHE encryption
- **Key Features**:
  - Completely encrypted bid placement
  - Confidential bid comparison using FHE operations
  - Result access control after auction ends
  - Automatic highest bid and winner updates
- **State Variables**:
  - `highestBidEnc`: Encrypted highest bid
  - `winnerEnc`: Encrypted winner address
  - `seller`: Seller address
  - `endTime`: Auction end time
  - `bids`: Number of bids placed

### 2. **AuctionFactory.sol** - Auction Factory
- **Function**: Creates and registers new auctions in one transaction
- **Key Features**:
  - Deploy new SealedAuction contracts
  - Automatic registration with AuctionRegistry
  - Manage auction metadata (name, description, image)
- **Events**:
  - `AuctionCreated`: When new auction is created

### 3. **AuctionRegistry.sol** - Auction Registry
- **Function**: Registers and manages all auctions
- **Key Features**:
  - Register new auctions
  - Store metadata (name, description, time, status)
  - Query auctions by various criteria
  - Update auction status
- **Struct AuctionInfo**:
  - `contractAddress`: Auction contract address
  - `creator`: Auction creator
  - `name`: Auction name
  - `description`: Detailed description
  - `createdAt`: Creation timestamp
  - `endTime`: End time
  - `isActive`: Active status
  - `bidCount`: Number of bids

## 🚀 **Key Features**

### 🔒 **Absolute Security**
- **FHE Encryption**: All bids encrypted using Fully Homomorphic Encryption
- **Zero-Knowledge**: No one can see bid amounts until auction ends
- **Privacy-First**: Complete confidentiality during bidding phase

### 🎨 **Modern Interface**
- **Responsive Design**: Beautiful gradient-based interface
- **Real-time Updates**: Live auction status and timing
- **Image Upload**: Upload and manage product images
- **Role-based Access**: Permission-based access control

### ⚡ **Technical Excellence**
- **Multi-Network Support**: Localhost, Sepolia testnet
- **Automated Deployment**: One-command deployment and ABI sync
- **TypeScript**: Full type safety throughout
- **FHEVM Integration**: Complete relayer SDK integration

## 🛠️ **Technologies Used**

### **Backend & Smart Contracts**
- **Solidity 0.8.24**: Smart contract programming language
- **FHEVM**: Fully Homomorphic Encryption technology
- **Hardhat**: Development and testing framework
- **Ethers.js**: Blockchain interaction library

### **Frontend**
- **Next.js 15.4.2**: React framework with SSR/SSG
- **React 19.1.0**: UI library
- **TypeScript 5.9.2**: Type-safe programming language
- **Tailwind CSS**: Utility-first CSS framework
- **FHEVM Relayer SDK**: FHEVM integration

### **Development Tools**
- **Hardhat**: Smart contract development
- **ESLint**: Code linting
- **Vitest**: Testing framework
- **PostCSS**: CSS processing

## 📁 **Project Structure**

```
Sealed-Auction/
├── contracts/                    # Smart contracts
│   ├── SealedAuction.sol        # Main auction contract
│   ├── AuctionFactory.sol        # Auction factory
│   └── AuctionRegistry.sol      # Auction registry
├── scripts/                     # Deployment scripts
│   ├── deploy-and-update.ts     # Automated deployment
│   ├── deploy-registry-and-factory.ts
│   └── genabi.ts               # ABI generation
├── new-fhevm-template/         # Main project directory
│   └── packages/site/         # React frontend
│       ├── components/         # UI components
│       │   ├── SealedAuctionUI.tsx # Auction interface
│       │   ├── AuctionMarketplace.tsx # Marketplace
│       │   └── ImageUpload.tsx     # Image upload
│       ├── hooks/              # Custom React hooks
│       ├── contracts/          # ABI files
│       └── app/               # Next.js app
├── deployments/                # Deployment records
├── abi/                       # Contract ABIs
└── test/                      # Test files
```

## 🚀 **Installation Guide**

### **System Requirements**
- **Node.js** 18+
- **Git**
- **MetaMask** browser extension
- **Hardhat** (for development)

### **Installation**

1. **Clone repository**
   ```bash
   git clone https://github.com/phamcamnguyen1994/Sealed-Auction.git
   cd Sealed-Auction
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd new-fhevm-template
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

### **Running the Application**

#### **Option 1: Local Development**
```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy to localhost
npm run deploy:localhost

# Terminal 3: Start frontend
cd new-fhevm-template/packages/site
npm run dev
```

#### **Option 2: Sepolia Testnet**
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Start frontend
cd new-fhevm-template/packages/site
npm run dev
```

## 📖 **Usage Guide**

### 🎯 **For Auction Creators (Sellers)**

1. **Connect MetaMask** to the application
2. **Create Auction** using AuctionFactory
3. **Upload Product Image** or select from presets
4. **Set Auction Duration** (in seconds)
5. **Share Auction Address** with bidders

### 💰 **For Bidders**

1. **Connect MetaMask** to the application
2. **Navigate to Auction** using contract address
3. **Place Encrypted Bid** - amount remains secret
4. **Wait for Auction End** - results revealed after finalization
5. **View Results** - highest bid and winner announced

### 🏁 **Auction Finalization**

1. **Automatic End**: Auction ends after specified duration
2. **Manual Finalize**: Seller can finalize after time expires
3. **Results Reveal**: Encrypted bids are decrypted and displayed
4. **Winner Announcement**: Highest bidder and amount revealed

## 🔧 **Technical Details**

### **FHE Operations**
- **Bid Encryption**: `FHE.fromExternal()` for encrypted bid placement
- **Confidential Comparison**: `FHE.select()` for encrypted branching
- **Result Decryption**: `FHE.allow()` for controlled result access

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

## 🌐 **Network Support & Contract Addresses**

### **Contract Addresses**

#### **Sepolia Testnet (Chain ID: 11155111)**
- **SealedAuction**: `0x2AAF28704Ee87278c9C4859B94C8f19138FD8768`
- **AuctionFactory**: `0x316aC13cfC4CA8DE76660fbd8F470F558Ea6c5B3`
- **AuctionRegistry**: `0xeE00ba349b4CAe6eC1a0e48e0aF6c6Bc72Ff8b65`

#### **Localhost (Chain ID: 31337)**
- **SealedAuction**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`

### **Network Support**

| Network | Chain ID | Status | Notes |
|---------|----------|--------|-------|
| **Localhost** | 31337 | ✅ Active | Development only |
| **Sepolia** | 11155111 | ✅ Active | Testnet deployment |
| **Mainnet** | 1 | 🚧 Planned | Future release |

## 🛠️ **Available Scripts**

```bash
# Deployment
npm run deploy:localhost    # Deploy to local Hardhat
npm run deploy:sepolia      # Deploy to Sepolia testnet
npm run deploy:registry:sepolia  # Deploy registry and factory

# Development
npm run genabi             # Generate ABI and addresses
npm run dev                # Start development server

# Testing
npm run test               # Run contract tests
npm run coverage           # Test coverage report
```

## 🔐 **Security**

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

## 🤝 **Contributing**

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

## 📄 **License**

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Zama Team** for FHEVM technology
- **FHEVM React Template** for the foundation
- **Hardhat** for development framework
- **Next.js** for frontend framework

## 📞 **Support**

- **Issues**: [GitHub Issues](https://github.com/phamcamnguyen1994/Sealed-Auction/issues)
- **Discussions**: [GitHub Discussions](https://github.com/phamcamnguyen1994/Sealed-Auction/discussions)
- **Documentation**: [FHEVM Docs](https://docs.fhevm.org/)

---

**Built with ❤️ using FHEVM technology**

*Empowering confidential blockchain applications through Fully Homomorphic Encryption*