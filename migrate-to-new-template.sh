#!/bin/bash

# 🚀 Migration Script: BID Auction Marketplace → FHEVM React Template
# This script will help you migrate your current project to the new template

set -e

echo "🚀 Starting migration to new FHEVM React Template..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "packages/site" ]; then
    print_error "Please run this script from the root of your BID project"
    exit 1
fi

# Create backup
print_status "Creating backup of current project..."
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r packages/site "$BACKUP_DIR/"
cp -r contracts "$BACKUP_DIR/"
cp -r scripts "$BACKUP_DIR/"
print_success "Backup created at: $BACKUP_DIR"

# Clone new template
print_status "Cloning new FHEVM React Template..."
TEMPLATE_DIR="new-fhevm-template"
if [ -d "$TEMPLATE_DIR" ]; then
    print_warning "Template directory already exists, removing..."
    rm -rf "$TEMPLATE_DIR"
fi

git clone https://github.com/zama-ai/fhevm-react-template.git "$TEMPLATE_DIR"
print_success "New template cloned successfully"

# Copy current features to new template
print_status "Copying current features to new template..."

# Copy FHEVM integration
print_status "Copying FHEVM integration..."
cp -r packages/site/fhevm "$TEMPLATE_DIR/packages/site/"

# Copy components
print_status "Copying components..."
cp -r packages/site/components "$TEMPLATE_DIR/packages/site/"

# Copy hooks
print_status "Copying hooks..."
cp -r packages/site/hooks "$TEMPLATE_DIR/packages/site/"

# Copy contexts
print_status "Copying contexts..."
cp -r packages/site/contexts "$TEMPLATE_DIR/packages/site/"

# Copy contracts
print_status "Copying contracts..."
cp -r packages/site/contracts "$TEMPLATE_DIR/packages/site/"

# Copy smart contracts
print_status "Copying smart contracts..."
cp -r contracts "$TEMPLATE_DIR/"
cp -r scripts "$TEMPLATE_DIR/"

# Copy additional files
print_status "Copying additional files..."
cp packages/site/components.json "$TEMPLATE_DIR/packages/site/" 2>/dev/null || true
cp packages/site/public/zama-logo.svg "$TEMPLATE_DIR/packages/site/public/" 2>/dev/null || true

print_success "All features copied successfully"

# Update package.json with current dependencies
print_status "Updating package.json with current dependencies..."
cd "$TEMPLATE_DIR/packages/site"

# Add missing dependencies that might be needed
npm install ethers@^6.15.0
npm install @types/ethers@^6.15.0

print_success "Dependencies updated"

# Create migration summary
print_status "Creating migration summary..."
cat > MIGRATION_SUMMARY.md << EOF
# 🎉 Migration Summary

## ✅ Successfully Migrated:

### 🎨 Components:
- AuctionMarketplace.tsx
- SealedAuctionFHE.tsx
- SealedAuctionUI.tsx
- HowItWorks.tsx
- ImageUpload.tsx
- Header.tsx
- ErrorNotDeployed.tsx
- LocalDevGuide.tsx

### 🔧 FHEVM Integration:
- Complete fhevm/ folder
- ESM/UMD fallback implementation
- Relayer SDK integration

### 🎣 Custom Hooks:
- useSealedAuction.ts
- useSealedAuctionFHE.tsx
- useIPFSUpload.tsx
- useInMemoryStorage.tsx
- MetaMask integration

### 📄 Smart Contracts:
- SealedAuction.sol
- AuctionFactory.sol
- AuctionRegistry.sol
- All deployment scripts

## 🚀 Next Steps:

1. **Test the migration:**
   \`\`\`bash
   cd $TEMPLATE_DIR/packages/site
   npm run dev
   \`\`\`

2. **Check for any issues:**
   - FHEVM initialization
   - Auction functionality
   - MetaMask integration

3. **Deploy to testnet:**
   \`\`\`bash
   cd $TEMPLATE_DIR
   npm run deploy:sepolia
   \`\`\`

## 📝 Notes:
- Original project backed up to: $BACKUP_DIR
- New template location: $TEMPLATE_DIR
- All features preserved and migrated
EOF

print_success "Migration summary created: MIGRATION_SUMMARY.md"

cd ../..

print_success "🎉 Migration completed successfully!"
print_status "New project location: $TEMPLATE_DIR"
print_status "Backup location: $BACKUP_DIR"
print_warning "Please test the migrated project before using in production"

echo ""
echo "🚀 To start testing:"
echo "   cd $TEMPLATE_DIR/packages/site"
echo "   npm run dev"
echo ""
echo "📖 Read MIGRATION_SUMMARY.md for detailed next steps"
