# Railway Deployment Guide

## 🚀 Deployment Overview

This project requires **TWO separate Railway services**:
1. **Backend Service** (NestJS API)
2. **Frontend Service** (React App)

## 🔧 Backend Deployment

### Step 1: Create Backend Service
1. Go to Railway dashboard
2. Create new project or use existing
3. Add new service
4. Connect to GitHub repository
5. **Set root directory to: `backend-nestjs`**

### Step 2: Environment Variables
Set these environment variables in Railway:

```bash
# Database
DATABASE_URL=postgresql://postgres.tnsxssykkwmkmpmyaszp:jlgQT5F4SksJYZzH@aws-0-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.tnsxssykkwmkmpmyaszp:jlgQT5F4SksJYZzH@aws-0-us-east-2.pooler.supabase.com:5432/postgres

# Firebase
FIREBASE_PROJECT_ID=owtdeparq
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqiv/rTf3dTnuI\nc0M73bclFc0S9JqBOz64UXsAnqSKcEUeqEBpW6uMhmDlCUA1mRH+qmYW8qIA8mdG\nPVPvFneYMltS5GWPHbQpXzax2PYTpscnSvqhpfoLEkhRAOjPsl4zTemL6yeppo6D\nCK7B0vxhB4w4S5E/3a6dscen/GnHBg/YGuYqsEsbC1z1560NtdPIC8q30oeRi0PO\nG36Xs6ATwXIRpkY7lcfqKNqpTb/36fFjP/VW6ULVcMxEFNoR4H4fd45CkLwoWP4L\niyUna//cU01km8cl03tYb9dwkJj9hvhpIa6FjL9sfZZD8pHN8vPdqzBD0oPOw5CH\nhCp6OhUVAgMBAAECggEACa6qEGklYlDgHRNULBwul22pLqwR8IfVTAAeQF8BXvW4\nSuEJBSJF90yyyBYSHejil2eDs8ZTMcQRXnDBaOfI4uxq+GYMqQcp8RZdg9PaRqvX\njzDH0XEbpNDFJ8oqLY6GIBoKih3P6ucQnLpbt5fbqcOUr6aEqNBUZ1IOUIh5Ven3\nii6RTpeLCrXfZIYTQAGTBPmoNwrRR/FcMuaEZsBKd8zd6Om/Y1CE3CgQY6KoasPQ\n1GoPT3AkvPr7nKFn/IlpIgvNztigb+gY83pz2Bk0Zb7EM0u0eSTx3GZXDwN+l7WB\n67kSr373PDV6GP/873yRa0LH30P0SF+yQeGGldbmuQKBgQDr8BcermCeOxMEHyoa\nl7Q9ts1ZpnpjY1eplzjAMp/t5RaRjbQOxZ7dTDg+Xs8Twvpb1UM4mI4aa6lYdGZO\nFiviUt5Ew7qDvLFTBWFeHUKCL72U/Td84JBWV4OSsFtYG+hHGE2JIidVtIpLFarO\nUgTBIX7Ye9I1aCrQG2lPuWw3nQKBgQC5C2O1hFZOPFPHkVZdkBPaCqk6gpwLkLxF\nPdZSN7Aa9qfenws5IABLzomXcZ+b0dfSxhY2pWI3HIPUXnKPOI1LAocZQQWA0QjG\nzFczLYYMg2l3YWUqgtAAdmhxuU6MbjrVNxi/0Aa022L981yQWQecPVIOH8WUTLGU\npA6TT2Zl2QKBgCEkarr+l8fiWHt9vTZbFRCOOy5aulp3u/qwqWImOlz6jz8G/sIM\ndJJ1gHkSbFhETVLVFEpA88U2VmV8hFp3ttZl+Z8DN5IF0Yrt+I114r/S4Piq0T6T\ndPML/AmBCHPKB8jk2w9mYswhPkPp2UJ+NvjCMcVLL24dIdZ140c1rsPpAoGAa6v6\n6sYESiXEQh2JeYu6YWdOrSMOlZQ0WL3wlYqdyDK530oAB89dHL8jRKHy04I46QYm\nKsn06kiHVO1YD4pCfOENp140S45WYwbHvpnApEta9QIREbloOryrbXD8Ca6iQSp8\nFjB/loEJiucudze2u+zacCmAmBhARFNpv8G1vZECgYEAllZICmqeKABcsbl6XCET\nNRT2LQsu648+5ZHj08bECKIarmWSZ5ZshoyBSAFGpdA7oKXdHg/dw7lJGpb5/Jxt\n+WLbUiHTn60el2JJedSoS20v/EgB9+CHR/zLFAwcKOXk2t7OZNQg0beC/Luki5KO\nZ6GPaNKFfcmjfUXzolB++uU=\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@owtdeparq.iam.gserviceaccount.com

# API Keys
GROQ_API_KEY=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
GROQ_BASE_URL=https://api.groq.com
GROQ_ENABLED=true

# Server
PORT=3001
NODE_ENV=production
```

### Step 3: Deploy Backend
- Railway will automatically build and deploy
- Check logs for any issues
- Verify health endpoint: `https://your-backend-url.railway.app/health`

## 🎨 Frontend Deployment

### Step 1: Create Frontend Service
1. Add another service to your Railway project
2. Connect to same GitHub repository
3. **Set root directory to: `frontend`**

### Step 2: Environment Variables
```bash
# API Configuration
REACT_APP_API_URL=https://your-backend-url.railway.app
PORT=3000
NODE_ENV=production

# Firebase (Frontend Config)
REACT_APP_FIREBASE_API_KEY=your-firebase-web-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=owtdeparq.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=owtdeparq
```

### Step 3: Deploy Frontend
- Railway will build React app and serve with static server
- Access your app at: `https://your-frontend-url.railway.app`

## 🔧 Troubleshooting

### Common Issues:
1. **Build fails**: Check that root directory is set correctly
2. **Environment variables**: Make sure all required vars are set
3. **Database connection**: Verify DATABASE_URL is correct
4. **CORS issues**: Update backend CORS settings for frontend URL

### Logs:
- Check Railway deployment logs for detailed error messages
- Backend logs: Look for database connection and API errors
- Frontend logs: Check for build errors and API connection issues
