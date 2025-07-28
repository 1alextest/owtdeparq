# 🗄️ Database Setup Guide

## Quick Setup with Supabase (Recommended - Free)

### Step 1: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Sign up with GitHub or email
3. Click "New Project"

### Step 2: Create Database
1. Choose your organization
2. Enter project details:
   - **Name**: `ai-pitch-deck-generator`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to you
3. Click "Create new project"
4. Wait 2-3 minutes for setup

### Step 3: Get Connection String
1. Go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** tab
4. Copy the connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 4: Update Environment
1. Open `backend-nestjs/.env`
2. Replace the DATABASE_URL with your Supabase connection string:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### Step 5: Test Connection
```bash
cd backend-nestjs
npm run start:dev
```

---

## Alternative: Local PostgreSQL

### Windows
1. Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
2. Install with default settings
3. Remember the password you set for `postgres` user
4. Update `.env` with your local connection

### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql
createdb pitchdeck_dev
```

### Linux
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb pitchdeck_dev
```

---

## Testing Database Connection

Once you have a database set up, test the connection:

```bash
# Install database client (optional)
npm install -g pg

# Test connection (replace with your DATABASE_URL)
psql "postgresql://postgres:password@localhost:5432/pitchdeck_dev"
```

## Next Steps

After database setup:
1. ✅ Database is running
2. ✅ Connection string in `.env`
3. 🚀 Start the NestJS server: `npm run start:dev`
4. 📊 Database tables will be created automatically
5. 🧪 Test API endpoints
