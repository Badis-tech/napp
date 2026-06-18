# API Keys Management System

## Overview

This system provides secure, encrypted storage and management of API keys for multiple external APIs (starting with jobsuche). Keys are encrypted at rest and only decrypted when needed.

## Features

✅ **Encrypted Storage** - AES-256-GCM encryption  
✅ **Audit Trail** - Track key creation, usage, and modifications  
✅ **Key Rotation Ready** - Easy revocation and renewal  
✅ **Multi-API Support** - Manage keys for multiple APIs  
✅ **Status Tracking** - Active, inactive, revoked states  

## Setup

### 1. Environment Configuration

Add to your `.env` or `.env.local`:

```bash
# 32-character encryption key for API keys (base64 encoded recommended)
API_KEYS_ENCRYPTION_KEY="0123456789abcdef0123456789abcdef"

# Database URL (already configured)
DATABASE_URL="your-prisma-postgres-url"
```

**⚠️ Important**: Generate a strong encryption key:

```bash
# Generate a random 32-character key (Linux/Mac)
openssl rand -hex 16

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

### 2. Database Migration

Run Prisma migrations to create the `ApiKey` table:

```bash
npx prisma migrate dev --name add_api_keys
```

## API Endpoints

### List API Keys
```
GET /api/keys
Headers:
  x-user-id: <user-id>

Query Parameters:
  ?apiName=jobsuche  (filter by API)
  ?status=active     (filter by status)
```

### Create API Key
```
POST /api/keys
Headers:
  x-user-id: <user-id>
  Content-Type: application/json

Body:
{
  "name": "production",
  "apiName": "jobsuche",
  "key": "your-api-key-here",
  "expiresAt": "2025-12-31T23:59:59Z",
  "metadata": { "region": "germany" }
}

Response:
{
  "success": true,
  "data": {
    "id": "key-uuid",
    "name": "production",
    "apiName": "jobsuche",
    "maskedKey": "...",
    "status": "active",
    "createdAt": "2025-06-17T17:30:00Z",
    "expiresAt": "2025-12-31T23:59:59Z"
  }
}
```

### Get API Key Details
```
GET /api/keys/:id
Headers:
  x-user-id: <user-id>

Query Parameters:
  ?decrypt=true    (returns decrypted key - use with caution)
```

### Update API Key
```
PATCH /api/keys/:id
Headers:
  x-user-id: <user-id>
  Content-Type: application/json

Body:
{
  "name": "updated-name",
  "status": "inactive",
  "expiresAt": "2025-12-31T23:59:59Z",
  "metadata": { "region": "germany" }
}
```

### Delete/Revoke API Key
```
DELETE /api/keys/:id
Headers:
  x-user-id: <user-id>

Query Parameters:
  ?revoke=true    (soft delete - sets status to 'revoked')
                  (without ?revoke=true - hard delete)
```

## Using the Jobsuche API Client

```typescript
import { jobsucheClient } from '@/lib/clients/jobsucheClient';

// Search for jobs
const results = await jobsucheClient.search({
  keywords: 'javascript',
  location: 'Berlin',
  page: 1,
  size: 20
});

// Get specific job
const job = await jobsucheClient.getJobById('job-12345');

// Validate API key is working
const isValid = await jobsucheClient.validateApiKey();
```

## Service Layer Usage

```typescript
import {
  createApiKey,
  getApiKey,
  listApiKeys,
  revokeApiKey,
  markApiKeyAsUsed
} from '@/lib/apiKeyService';

// Create a new key
const newKey = await createApiKey(userId, {
  name: 'production',
  apiName: 'jobsuche',
  key: 'actual-api-key-value',
  expiresAt: new Date('2025-12-31'),
  metadata: { region: 'germany' }
});

// List all keys for a user
const keys = await listApiKeys({ userId });

// Get specific key with decryption
const key = await getApiKey(keyId, true);

// Revoke a key
await revokeApiKey(keyId);

// Mark as used (updates lastUsed timestamp)
await markApiKeyAsUsed(keyId);
```

## Security Considerations

1. **Encryption Keys** - Store `API_KEYS_ENCRYPTION_KEY` securely (not in git)
2. **API Routes** - Implement proper authentication (currently using x-user-id header)
3. **Decryption** - Only decrypt keys when absolutely necessary
4. **Audit Logging** - Monitor key access and usage
5. **Rotation** - Regularly rotate API keys and revoke old ones

## Database Schema

```sql
CREATE TABLE "ApiKey" (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  apiName      TEXT NOT NULL,
  encryptedKey TEXT NOT NULL,
  status       TEXT DEFAULT 'active',
  createdById  TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  createdAt    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt    TIMESTAMP,
  lastUsed     TIMESTAMP,
  expiresAt    TIMESTAMP,
  metadata     JSONB,
  
  INDEX (apiName),
  INDEX (status),
  INDEX (createdById)
);
```

## Extending to Other APIs

To add support for a new API:

1. Create a new client class in `lib/clients/` (e.g., `linkedInClient.ts`)
2. Use `getApiKeyByName('api-name', 'key-name', true)` to fetch and decrypt
3. Call `markApiKeyAsUsed(keyId)` after successful requests
4. Store any API-specific config in the `metadata` field

## Testing

Example test request:

```bash
# Create a key
curl -X POST http://localhost:3000/api/keys \
  -H "x-user-id: user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "test",
    "apiName": "jobsuche",
    "key": "test-api-key-value"
  }'

# List keys
curl http://localhost:3000/api/keys \
  -H "x-user-id: user-123"

# Get specific key
curl http://localhost:3000/api/keys/[key-id] \
  -H "x-user-id: user-123"
```
