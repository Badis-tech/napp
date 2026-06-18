# Supabase Integration with Secure API Keys Management

## 🎯 Overview

This guide shows how to:
1. ✅ Set up Supabase project
2. ✅ Store credentials securely using our API keys system
3. ✅ Create a managed Supabase client
4. ✅ Configure database & auth

---

## STEP 1: Create Supabase Project

### A. Sign Up / Log In
1. Go to https://supabase.com
2. Click "Start your project"
3. Sign in with GitHub or email
4. Create new organization

### B. Create New Project
1. Click "New Project"
2. Fill in:
   - **Name**: your-project-name
   - **Database Password**: (save this!)
   - **Region**: Choose closest to you (Frankfurt recommended for Germany)
3. Click "Create new project" (wait ~2 min)

### C. Get Your Credentials
After project is created:

1. Go to **Settings** → **API**
2. Copy these values:

```
Project URL:           https://xxxxxxxxxxxx.supabase.co
Anon Key (public):     eyJhbGc... (starts with "eyJ")
Service Role (secret): sbp_... or eyJhbGc... (starts with "sbp_" or "eyJ")
Database Password:     (saved during creation)
```

3. Also copy from **Settings** → **Database**:
```
Host:     db.xxxxxxxxxxxx.supabase.co
Port:     5432
User:     postgres
Password: (same as step 2 above)
```

---

## STEP 2: Add to API Keys System (Recommended)

### Option A: Use API Keys Management System

This encrypts credentials at rest using our AES-256-GCM system.

#### 2A.1: Set Encryption Key (if not done)
```bash
# Generate if not already done
openssl rand -hex 16
# Copy the output

# Add to .env.local
echo "API_KEYS_ENCRYPTION_KEY=your-generated-key" >> .env.local
```

#### 2A.2: Create Supabase API Key Entry

Run Prisma migration first:
```bash
npx prisma migrate dev --name add_api_keys
```

Then create the key via API:
```bash
curl -X POST http://localhost:3000/api/keys \
  -H "x-user-id: system" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production",
    "apiName": "supabase",
    "key": "eyJhbGc...",
    "metadata": {
      "type": "anonKey",
      "projectUrl": "https://xxxxxxxxxxxx.supabase.co",
      "host": "db.xxxxxxxxxxxx.supabase.co",
      "dbPassword": "your-db-password"
    }
  }'
```

#### 2A.3: Create Service Role Key Entry
```bash
curl -X POST http://localhost:3000/api/keys \
  -H "x-user-id: system" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "service-role",
    "apiName": "supabase",
    "key": "sbp_... or eyJhbGc...",
    "metadata": {
      "type": "serviceRoleKey",
      "projectUrl": "https://xxxxxxxxxxxx.supabase.co"
    }
  }'
```

---

## STEP 3: Add to Environment (Quick Setup)

### Option B: Use Environment Variables

For quick testing, add to `.env.local`:

```bash
# Supabase - Public (ok to expose)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase - Secret (keep private)
SUPABASE_SERVICE_ROLE_KEY=sbp_... or eyJhbGc...
```

**⚠️ Warning**: Environment variables are visible in logs. For production, use Step 2 (API Keys System).

---

## STEP 4: Create Managed Supabase Client

Create a new client that uses our API keys system:

```typescript
// lib/clients/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { getApiKeyByName, markApiKeyAsUsed } from '../apiKeyService';

export class ManagedSupabaseClient {
  private clientType: 'anon' | 'serviceRole' = 'anon';
  
  constructor(clientType: 'anon' | 'serviceRole' = 'anon') {
    this.clientType = clientType;
  }

  async getClient() {
    // Get the appropriate key
    const keyName = this.clientType === 'serviceRole' 
      ? 'service-role' 
      : 'production';
    
    const keyData = await getApiKeyByName('supabase', keyName, true);
    
    if (!keyData || !('decryptedKey' in keyData)) {
      throw new Error(`Supabase ${keyName} key not found`);
    }

    // Mark as used
    await markApiKeyAsUsed(keyData.id);

    // Get project URL from metadata
    const projectUrl = keyData.expiresAt; // or stored in metadata
    if (!projectUrl) {
      throw new Error('Supabase project URL not configured');
    }

    return createClient(
      projectUrl as string,
      keyData.decryptedKey
    );
  }

  async signUp(email: string, password: string) {
    const supabase = await this.getClient();
    return supabase.auth.signUp({ email, password });
  }

  async signIn(email: string, password: string) {
    const supabase = await this.getClient();
    return supabase.auth.signInWithPassword({ email, password });
  }

  async query(table: string) {
    const supabase = await this.getClient();
    return supabase.from(table).select();
  }
}

// Export instances
export const supabaseAnonClient = new ManagedSupabaseClient('anon');
export const supabaseServiceClient = new ManagedSupabaseClient('serviceRole');
```

---

## STEP 5: Use in Your Application

### Authentication
```typescript
import { supabaseAnonClient } from '@/lib/clients/supabaseClient';

// Sign up
const { data, error } = await supabaseAnonClient.signUp(
  'user@example.com',
  'password123'
);

// Sign in
const { data, error } = await supabaseAnonClient.signIn(
  'user@example.com',
  'password123'
);
```

### Query Data
```typescript
// Query with anon client (client-side safe)
const { data: users } = await supabaseAnonClient.query('users');

// Query with service role (server-side only!)
const { data: allUsers } = await supabaseServiceClient.query('users');
```

### Real-Time
```typescript
const supabase = await supabaseAnonClient.getClient();

supabase
  .from('messages')
  .on('*', payload => {
    console.log('New change:', payload)
  })
  .subscribe()
```

---

## STEP 6: Configure Database (Optional)

If you want to use Supabase Postgres directly:

### Connection String
```
postgresql://postgres:your-password@db.xxxxxxxxxxxx.supabase.co:5432/postgres
```

### Store in API Keys System
```bash
curl -X POST http://localhost:3000/api/keys \
  -H "x-user-id: system" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production",
    "apiName": "supabase-postgres",
    "key": "postgresql://postgres:password@db.xxxxxxxxxxxx.supabase.co:5432/postgres",
    "metadata": {
      "type": "connectionString",
      "host": "db.xxxxxxxxxxxx.supabase.co",
      "database": "postgres"
    }
  }'
```

---

## STEP 7: Configure Prisma with Supabase

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

In `.env.local`:
```
DATABASE_URL="postgresql://postgres:password@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
```

Then:
```bash
npx prisma migrate dev --name init
```

---

## ✅ Verification Checklist

- [ ] Supabase project created
- [ ] Credentials copied
- [ ] Encryption key generated (`API_KEYS_ENCRYPTION_KEY`)
- [ ] Prisma migration run (`npx prisma migrate dev --name add_api_keys`)
- [ ] API keys created via `/api/keys` endpoint
- [ ] Supabase client created (`lib/clients/supabaseClient.ts`)
- [ ] Can authenticate users
- [ ] Can query data
- [ ] Prisma connected to Supabase (optional)

---

## 🔐 Security Best Practices

### ✅ DO:
- Store keys in API keys system (encrypted)
- Use service role key only on server
- Use anon key for client-side code
- Rotate keys regularly
- Keep encryption key in vault

### ❌ DON'T:
- Store keys in `.env` (visible in git)
- Expose service role key to client
- Commit `.env.local` file
- Use same key for multiple environments
- Hardcode keys in source code

---

## 🚀 Quick Commands

```bash
# Generate encryption key
openssl rand -hex 16

# Migrate database
npx prisma migrate dev --name add_api_keys

# Check Supabase connection
npx prisma db push

# View Supabase dashboard
open https://supabase.com/dashboard

# Test auth
curl -X POST https://xxxx.supabase.co/auth/v1/signup \
  -H "apikey: your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

## 📚 Related Files

- `API_KEYS_SETUP.md` - General API keys management
- `API_KEYS_MANAGEMENT.md` - Implementation details
- `lib/clients/supabaseClient.ts` - Managed client
- `lib/apiKeyService.ts` - Key management service

---

## 🆘 Troubleshooting

### "Supabase credentials not configured"
- Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Or create keys via API keys management system

### "Failed to connect to Supabase"
- Verify project URL is correct
- Check API key is valid
- Ensure network allows connection to `supabase.co`

### "Auth not working"
- Enable Email provider in Supabase dashboard
- Check email templates are configured
- Verify redirect URLs are set

### "Database connection failed"
- Check connection string format
- Verify host/port are correct
- Ensure Supabase project is active (not paused)

---

## 📞 Resources

- Supabase Docs: https://supabase.com/docs
- Supabase Auth: https://supabase.com/docs/guides/auth
- Supabase Realtime: https://supabase.com/docs/guides/realtime
- PostgreSQL Docs: https://www.postgresql.org/docs/

---

**Status**: Ready to Implement  
**Last Updated**: June 17, 2025
