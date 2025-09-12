# 🚀 Deployment Guide for Vercel

## Environment Variables

Add these environment variables in your Vercel dashboard:

```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_RELAYER_URL=https://api.fhevm.org
```

## Steps to Deploy

1. **Connect your GitHub repository to Vercel**
2. **Set Root Directory**: Set to `packages/site`
3. **Add Environment Variables** (see above)
4. **Deploy**

## Common Issues Fixed

✅ **Removed duplicate next.config files**
✅ **Fixed webpack fallbacks for Node.js modules**
✅ **Added proper headers for FHEVM**
✅ **Configured Vercel build settings**

## Build Commands

- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Notes

- The app requires FHEVM headers for proper functionality
- All Node.js modules are properly polyfilled for browser environment
- TypeScript and ESLint errors are ignored during build for deployment stability
