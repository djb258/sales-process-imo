# 🚀 IMO Calculator - Deployment Guide

## Pre-Deployment Checklist

### 1. Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase project
firebase init

# Select:
# - Firestore
# - Functions
# - Storage
# - Hosting
```

### 2. Environment Configuration

#### Frontend (.env)
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

#### Functions (set via Firebase CLI)
```bash
firebase functions:config:set \
  storage.bucket="your-project.appspot.com"
```

### 3. Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Public read for all collections (adjust based on auth requirements)
    match /{collection}/{document} {
      allow read: if true;
      allow write: if true; // Add authentication here in production
    }
  }
}
```

### 4. Storage Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /pdfs/{allPaths=**} {
      allow read: if true; // Public read for PDFs
      allow write: if false; // Only Cloud Functions can write
    }
  }
}
```

---

## Deployment Steps

### Option 1: Firebase Hosting + Cloud Functions

```bash
# Build frontend
npm run build

# Deploy everything
firebase deploy

# Or deploy individually
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules
```

### Option 2: Vercel (Frontend) + Firebase (Backend)

#### Deploy Frontend to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd calculator-app
vercel

# Follow prompts, set build command:
# Build Command: npm run build
# Output Directory: dist
```

#### Add Environment Variables in Vercel
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all `VITE_*` variables from `.env`

#### Deploy Functions to Firebase

```bash
cd functions
firebase deploy --only functions
```

### Option 3: Netlify (Frontend) + Firebase (Backend)

#### Deploy to Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
cd calculator-app
netlify deploy --prod

# Build settings:
# Build command: npm run build
# Publish directory: dist
```

---

## Post-Deployment Configuration

### 1. CORS Setup (if needed)

If frontend and functions are on different domains:

```javascript
// functions/src/index.ts
import * as cors from 'cors';

const corsHandler = cors({ origin: 'https://your-frontend-domain.com' });

export const generatePdf = functions
  .runWith({ memory: '1GB', timeoutSeconds: 60 })
  .https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
      // Function logic here
    });
  });
```

### 2. Custom Domain

#### Vercel
1. Vercel Dashboard → Domains
2. Add custom domain
3. Update DNS records

#### Firebase Hosting
```bash
firebase hosting:channel:deploy production --only hosting
```

### 3. SSL Certificate

Both Vercel and Firebase automatically provision SSL certificates for HTTPS.

---

## Testing in Production

### 1. Test Factfinder Form

```bash
curl -X POST https://your-domain.com/api/factfinder \
  -H "Content-Type: application/json" \
  -d '{
    "company": {"name": "Test Co", "industry": "Tech", "employeeCount": 50, "state": "CA"},
    "census": {"averageAge": 35, "maleCount": 25, "femaleCount": 25, "dependents": 30},
    "claims": {"historicalData": [{"year": 2023, "totalCost": 150000, "claimCount": 50}], "totalAnnualCost": 150000},
    "validated": true
  }'
```

### 2. Test Dashboard

```
https://your-domain.com/dashboard/test-prospect-id
```

### 3. Test PDF Export

```bash
# Call Cloud Function directly
curl -X POST https://us-central1-your-project.cloudfunctions.net/generatePdf \
  -H "Content-Type: application/json" \
  -d '{"data": {"prospectId": "test-prospect-id"}}'
```

---

## Performance Optimization

### 1. Enable Caching

#### Vercel
```json
// vercel.json
{
  "headers": [
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

#### Firebase Hosting
```json
// firebase.json
{
  "hosting": {
    "headers": [
      {
        "source": "/static/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  }
}
```

### 2. Code Splitting

Already implemented via Vite's automatic code splitting.

### 3. Image Optimization

Use Firebase Storage CDN for images and enable automatic optimization.

---

## Monitoring & Logging

### 1. Firebase Console

- **Functions logs**: Cloud Functions → Logs
- **Firestore usage**: Firestore → Usage
- **Storage usage**: Storage → Usage

### 2. Vercel Analytics

Enable in Vercel Dashboard → Analytics

### 3. Error Tracking (Optional)

```bash
npm install @sentry/react @sentry/vite-plugin
```

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: import.meta.env.MODE,
});
```

---

## Security Hardening

### 1. Add Authentication

```typescript
// src/lib/firebase.ts
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

export const auth = getAuth(app);
```

```typescript
// src/App.tsx
import { useAuthState } from 'react-firebase-hooks/auth';

function App() {
  const [user, loading] = useAuthState(auth);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Login />;

  // Rest of app
}
```

### 2. Secure Firestore Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /factfinder/{prospectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }

    match /pdfs/{prospectId} {
      allow read: if request.auth != null;
      allow write: if false; // Only functions
    }
  }
}
```

### 3. Rate Limiting

```typescript
// functions/src/index.ts
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
});

export const generatePdf = functions
  .runWith({ memory: '1GB', timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    limiter(req, res, () => {
      // Function logic
    });
  });
```

---

## Cost Optimization

### Estimated Monthly Costs (5-10 uses/week)

- **Firestore**: ~$1/month (reads/writes)
- **Cloud Functions**: ~$5/month (PDF generation)
- **Storage**: ~$1/month (PDF files)
- **Hosting**: Free (Vercel/Firebase free tier)

**Total**: ~$7/month for low-volume usage

### Cost Reduction Tips

1. **Cache PDFs**: Don't regenerate if already exists
2. **Compress PDFs**: Use lower quality settings
3. **Clean old files**: Delete PDFs older than 30 days
4. **Use Cloud Storage CDN**: Serve PDFs from CDN

---

## Backup Strategy

### 1. Firestore Backup

```bash
# Export all collections
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d)

# Schedule daily backups via Cloud Scheduler
```

### 2. Storage Backup

```bash
# Sync to backup bucket
gsutil -m rsync -r gs://your-storage-bucket gs://your-backup-bucket
```

---

## Troubleshooting

### PDF Generation Fails

**Issue**: Puppeteer timeout
**Solution**: Increase function timeout to 120 seconds

```typescript
export const generatePdf = functions
  .runWith({ memory: '2GB', timeoutSeconds: 120 })
  .https.onCall(async (data, context) => {
    // ...
  });
```

### Charts Not Rendering

**Issue**: Recharts dependencies not loaded
**Solution**: Add `recharts` to Vite optimizeDeps

```typescript
// vite.config.ts
export default defineConfig({
  optimizeDeps: {
    include: ['recharts'],
  },
});
```

### Firestore Permission Denied

**Issue**: Rules too restrictive
**Solution**: Check Firestore rules and authentication state

---

## Rollback Procedure

### Vercel
```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback [deployment-url]
```

### Firebase
```bash
# List previous deployments
firebase hosting:channel:list

# Deploy previous version
firebase hosting:channel:deploy previous-version
```

---

## Support Contacts

- **Firebase**: https://firebase.google.com/support
- **Vercel**: https://vercel.com/support
- **Puppeteer**: https://pptr.dev/troubleshooting
- **Recharts**: https://recharts.org/en-US

---

**Last Updated**: 2025-10-01
**Version**: 1.0.0
**Status**: ✅ Production Ready
