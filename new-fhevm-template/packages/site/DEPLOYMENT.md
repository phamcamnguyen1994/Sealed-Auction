# 🚀 Simple Vercel Deployment Guide

## ⚠️ CRITICAL: Set Root Directory Correctly

**Root Directory**: `new-fhevm-template/packages/site`

## Steps to Fix 404 Error

1. **Vercel Dashboard → Project → Settings → General**
2. **Root Directory**: Set to `new-fhevm-template/packages/site`
3. **Redeploy**

## Environment Variables (Optional)

```bash
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
NEXT_PUBLIC_RELAYER_URL=https://api.fhevm.org
```

## Why 404 Happens

❌ **Wrong Root Directory** → Vercel can't find `package.json` and `next.config.js`
❌ **Monorepo Structure** → Need to point to correct subfolder
❌ **Complex Config** → Simplified to avoid conflicts

## What's Fixed

✅ **Simplified next.config.js** - Only essential configs
✅ **Minimal vercel.json** - No complex rewrites
✅ **Proper webpack fallbacks** - For Node.js modules
✅ **FHEVM headers** - Required for encryption
