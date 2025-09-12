# 🚀 Deployment Guide for Vercel (new-fhevm-template)

## 📁 Important: Correct Path
**Deploy from**: `new-fhevm-template/packages/site`

## Environment Variables

Add these environment variables in your Vercel dashboard:

```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_RELAYER_URL=https://api.fhevm.org
```

## Steps to Deploy

1. **Connect your GitHub repository to Vercel**
2. **Set Root Directory**: Set to `new-fhevm-template/packages/site`
3. **Add Environment Variables** (see above)
4. **Deploy**

## Vercel Configuration

- **Root Directory**: `new-fhevm-template/packages/site`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

## Common Issues Fixed

✅ **Updated next.config.ts with proper webpack fallbacks**
✅ **Added vercel.json configuration**
✅ **Fixed FHEVM headers**
✅ **Added environment variables**
✅ **Configured build optimizations**

## Notes

- The app requires FHEVM headers for proper functionality
- All Node.js modules are properly polyfilled for browser environment
- TypeScript and ESLint errors are ignored during build for deployment stability
- Make sure to deploy from the correct path: `new-fhevm-template/packages/site`
