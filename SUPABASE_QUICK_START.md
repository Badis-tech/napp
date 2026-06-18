# Supabase Integration - Quick Start (5 minutes)

## 🎯 Goal
Get Supabase running with secure key management in 5 steps.

---

## STEP 1: Create Supabase Project (2 min)

1. Go to https://supabase.com/dashboard
2. Click "New project"
3. Fill in:
   - **Name**: my-napp-project
   - **Database Password**: PL77Aznu0ezFz2KP
   - **Region**: Frankfurt (eu-central-1)
4. Wait ~2 minutes for setup
5. Go to **Settings** → **API**

Copy these values:
```
🔑 NEXT_PUBLIC_SUPABASE_URL = https://eukklficdxmvljagptri.supabase.co
🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tsZmljZHhtdmxqYWdwdHJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODU1NzgsImV4cCI6MjA5NzM2MTU3OH0.5a5eQVBGLN_SUXFRuwo-iXiASBP6IbJd9rRKudNlMzk
🔑 SUPABASE_SERVICE_ROLE_KEY =eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a2tsZmljZHhtdmxqYWdwdHJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTc4NTU3OCwiZXhwIjoyMDk3MzYxNTc4fQ.wBzp-R-D7Vun9r1O9UvlUpqy2FFW1Bd3Y7B3jqSIig8

---

## STEP 2: Generate Encryption Key (30 sec)

```bash
cd /home/bids/projects/napp

# Generate key
openssl rand -hex 16
# Example output: a7f3e2c1b4d8a9f6e3c1b7a5d2f8e4c1
```

---

## STEP 3: Setup Environment (1 min)

```bash
# Add to .env.local
cat >> .env.local << 'ENVKEY'
API_KEYS_ENCRYPTION_KEY=a7f3e2c1b4d8a9f6e3c1b7a5d2f8e4c1
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=sbp_...
ENVKEY

# Verify
cat .env.local | grep -E "ENCRYPTION|SUPABASE"
```

---

## STEP 4: Run Migration (1 min)

```bash
# Create API keys table
npx prisma migrate dev --name add_api_keys

# Verify it created
npx prisma db push
```

---

## STEP 5: Add Supabase Keys via API (1 min)

```bash
# Create Anon Key entry
curl -X POST http://localhost:3000/api/keys \
  -H "x-user-id: system" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "production",
    "apiName": "supabase",
    "key": "eyJhbGc...",
    "metadata": {
      "type": "anonKey",
      "projectUrl": "https://xxxxxxxxxxxx.supabase.co"
    }
  }'

# Create Service Role Key entry
curl -X POST http://localhost:3000/api/keys \
  -H "x-user-id: system" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "service-role",
    "apiName": "supabase",
    "key": "sbp_...",
    "metadata": {
      "type": "serviceRoleKey",
      "projectUrl": "https://xxxxxxxxxxxx.supabase.co"
    }
  }'
```

✅ Done! Keys are now encrypted and managed.

---

## 📝 Using in Code

```typescript
// Client-side (safe to expose)
import { supabaseAnon } from '@/lib/clients/supabaseClient';

const { data, error } = await supabaseAnon.signUp(
  'user@example.com',
  'password123'
);
```

```typescript
// Server-side only!
import { supabaseService } from '@/lib/clients/supabaseClient';

const { data, error } = await supabaseService.query('users');
```

---

## ✅ Verification

Test the connection:

```bash
# Check Supabase dashboard
open https://supabase.com/dashboard

# Test from command line
curl -X GET https://xxxxxxxxxxxx.supabase.co/rest/v1/auth_schema \
  -H "apikey: eyJhbGc..." \
  -H "Accept: application/json"
```

---

## 🚀 Next Steps

1. Create tables in Supabase dashboard
2. Enable Auth providers (Email, Google, etc.)
3. Set up real-time subscriptions
4. Configure Row Level Security (RLS)

See `SUPABASE_SETUP.md` for detailed guide.

---

**Time to Complete**: ~5 minutes  
**No Credit Card Needed**: Supabase has free tier
