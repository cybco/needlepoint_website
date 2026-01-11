# Production Go-Live Checklist

## Environment Variables Required

### NextAuth
```
AUTH_SECRET=<generate with: openssl rand -base64 32>
```

### Ed25519 License Signing Key
```
ED25519_PRIVATE_KEY=<generate with command below>
```

Generate the key:
```bash
node -e "const ed = require('@noble/ed25519'); const key = ed.utils.randomPrivateKey(); console.log(Buffer.from(key).toString('base64'));"
```

**Important:** Save the corresponding public key for embedding in the desktop/mobile app. Get it with:
```bash
node -e "const ed = require('@noble/ed25519'); async function run() { const priv = Buffer.from('YOUR_PRIVATE_KEY_BASE64', 'base64'); const pub = await ed.getPublicKeyAsync(priv); console.log(Buffer.from(pub).toString('base64')); } run();"
```

### Upstash Redis (Rate Limiting)
Get these from [upstash.com](https://upstash.com) - free tier available:
```
UPSTASH_REDIS_URL=https://your-instance.upstash.io
UPSTASH_REDIS_TOKEN=your_token_here
```

## Database Migration

Run this to apply the licensing schema:
```bash
npx prisma db push
```

## Deployment Steps

1. Set all environment variables in Vercel dashboard
2. Deploy to Vercel
3. Verify the database migration applied correctly
4. Test the `/api/v1/trial/init` endpoint

## API Endpoints (Phase 1)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/trial/init` | POST | Initialize 30-day trial for a device |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/api/v1/trial/init` | 5 requests | 1 hour per IP |
