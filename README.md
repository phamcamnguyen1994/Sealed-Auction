# Sealed-Bid Auction (fhEVM)

Fully confidential bidding using Zama fhEVM. Highest bid & winner remain encrypted; only whitelisted viewers can decrypt after finalization.

## Run (local mock)
```bash
npm i
npx hardhat compile
npx hardhat test
```

## Local demo (hardhat node)
- Terminal A (keep running):
```bash
npx hardhat node
```

- Terminal B:
```bash
# Deploy (saves to deployments/31337.json)
npx hardhat run scripts/deploy-local.ts --network localhost

# Place bid (defaults: BIDDER=1, AMOUNT=75)
$env:BIDDER="1"; $env:AMOUNT="75"
npx hardhat run scripts/placebid-local.ts --network localhost

# Finalize and decrypt
npx hardhat run scripts/finalize-local.ts --network localhost
```

## One-shot demo
```bash
# Runs deploy -> bids -> finalize -> decrypt in one go
npx hardhat run scripts/demo-hardhat.ts --network localhost
```

## Sepolia setup
```bash
# Set secrets
npx hardhat vars set INFURA_API_KEY YOUR_INFURA_KEY
npx hardhat vars set PRIVATE_KEY 0xYOUR_PRIVATE_KEY

# (optional) for verify
npx hardhat vars set ETHERSCAN_API_KEY YOUR_KEY
```

## Deploy to Sepolia
```bash
npx hardhat run scripts/deploy-sepolia.ts --network sepolia
# Copy the printed contract address
```

## Interact on Sepolia
```bash
# Set the deployed address
$env:AUCTION="0x...DEPLOYED_ADDRESS..."

# Send an encrypted bid (adjust as needed)
$env:BIDDER="1"; $env:AMOUNT="75"
npx hardhat run scripts/placebid-local.ts --network sepolia

# Finalize and decrypt results
npx hardhat run scripts/finalize-local.ts --network sepolia
```

## Verify on Etherscan (optional)
```bash
npx hardhat verify --network sepolia 0x...DEPLOYED_ADDRESS... 3600
```

## Export ABI + address
```bash
# Uses $env:AUCTION or deployments/{chainId}.json
npx hardhat run scripts/genabi.ts --network sepolia
# Output: abi/SealedAuction.json
```

## Sepolia (Relayer SDK, no mock)
```bash
# Install SDK
npm i @zama-fhe/relayer-sdk ethers

# Bid on Sepolia (client-side encrypt via relayer SDK)
$env:AUCTION="0x..."; $env:PRIVATE_KEY="0x..."; $env:BID="70"
npx ts-node scripts/bid-sepolia.ts

# Finalize & decrypt as seller
$env:AUCTION="0x..."; $env:PRIVATE_KEY="0x..."
npx ts-node scripts/finalize-sepolia.ts
```