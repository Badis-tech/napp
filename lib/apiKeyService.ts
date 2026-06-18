import type { PrismaClient, ApiKey, Prisma } from '@prisma/client';
import { encryptApiKey, decryptApiKey, maskEncryptedKey } from './encryption';

let prismaModule: typeof import('./prisma') | null = null;

async function getPrisma(): Promise<PrismaClient> {
  if (!prismaModule) {
    prismaModule = await import('./prisma');
  }
  return prismaModule.prisma as PrismaClient;
}

export interface ApiKeyInput {
  name: string;
  apiName: string;
  key: string;
  expiresAt?: Date;
  metadata?: Prisma.InputJsonValue;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  apiName: string;
  maskedKey: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsed?: Date | null;
  expiresAt?: Date | null;
  metadata?: Prisma.JsonValue;
}

export interface FullApiKeyResponse extends ApiKeyResponse {
  decryptedKey: string;
}

/**
 * Create a new API key
 */
export async function createApiKey(
  userId: string,
  input: ApiKeyInput
): Promise<ApiKeyResponse> {
  const prisma = await getPrisma();
  const encryptedKey = encryptApiKey(input.key);

  const apiKey = await (prisma.apiKey as PrismaClient['apiKey']).create({
    data: {
      name: input.name,
      apiName: input.apiName,
      encryptedKey,
      createdById: userId,
      expiresAt: input.expiresAt,
      metadata: input.metadata || {},
    },
  });

  return formatApiKeyResponse(apiKey as ApiKey);
}

/**
 * Get a single API key by ID (with decryption option)
 */
export async function getApiKey(
  keyId: string,
  decryptKey: boolean = false
): Promise<ApiKeyResponse | FullApiKeyResponse | null> {
  const prisma = await getPrisma();
  const apiKey = await (prisma.apiKey as PrismaClient['apiKey']).findUnique({
    where: { id: keyId },
  });

  if (!apiKey) return null;

  const response = formatApiKeyResponse(apiKey as ApiKey);

  if (decryptKey && apiKey.status === 'active') {
    return {
      ...response,
      decryptedKey: decryptApiKey(apiKey.encryptedKey),
    } as FullApiKeyResponse;
  }

  return response;
}

/**
 * Get API key by name and API name (for internal use)
 */
export async function getApiKeyByName(
  apiName: string,
  name: string,
  includeDecrypted: boolean = false
): Promise<(FullApiKeyResponse | ApiKeyResponse) | null> {
  const prisma = await getPrisma();
  const apiKey = await (prisma.apiKey as PrismaClient['apiKey']).findFirst({
    where: {
      apiName,
      name,
      status: 'active',
    },
  });

  if (!apiKey) return null;

  const response = formatApiKeyResponse(apiKey as ApiKey);

  if (includeDecrypted) {
    return {
      ...response,
      decryptedKey: decryptApiKey(apiKey.encryptedKey),
    } as FullApiKeyResponse;
  }

  return response;
}

/**
 * List all API keys for a user or API
 */
export async function listApiKeys(
  filter?: {
    userId?: string;
    apiName?: string;
    status?: string;
  }
): Promise<ApiKeyResponse[]> {
  const prisma = await getPrisma();
  const where: Record<string, unknown> = {};

  if (filter?.userId) where.createdById = filter.userId;
  if (filter?.apiName) where.apiName = filter.apiName;
  if (filter?.status) where.status = filter.status;

  const apiKeys = await (prisma.apiKey as PrismaClient['apiKey']).findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  return (apiKeys as ApiKey[]).map(formatApiKeyResponse);
}

/**
 * Update API key (name, expiry, metadata, status)
 */
export async function updateApiKey(
  keyId: string,
  updates: {
    name?: string;
    expiresAt?: Date | null;
    status?: string;
    metadata?: Prisma.InputJsonValue;
  }
): Promise<ApiKeyResponse | null> {
  const prisma = await getPrisma();
  const apiKey = await (prisma.apiKey as PrismaClient['apiKey']).update({
    where: { id: keyId },
    data: updates,
  });

  return formatApiKeyResponse(apiKey as ApiKey);
}

/**
 * Mark an API key as used (update lastUsed timestamp)
 */
export async function markApiKeyAsUsed(keyId: string): Promise<void> {
  const prisma = await getPrisma();
  await (prisma.apiKey as PrismaClient['apiKey']).update({
    where: { id: keyId },
    data: { lastUsed: new Date() },
  });
}

/**
 * Revoke an API key (set status to revoked)
 */
export async function revokeApiKey(keyId: string): Promise<ApiKeyResponse | null> {
  const prisma = await getPrisma();
  const apiKey = await (prisma.apiKey as PrismaClient['apiKey']).update({
    where: { id: keyId },
    data: { status: 'revoked' },
  });

  return formatApiKeyResponse(apiKey as ApiKey);
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(keyId: string): Promise<boolean> {
  try {
    const prisma = await getPrisma();
    await (prisma.apiKey as PrismaClient['apiKey']).delete({
      where: { id: keyId },
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if an API key is valid (active and not expired)
 */
export async function isApiKeyValid(keyId: string): Promise<boolean> {
  const prisma = await getPrisma();
  const apiKey = await (prisma.apiKey as PrismaClient['apiKey']).findUnique({
    where: { id: keyId },
  });

  if (!apiKey) return false;
  if (apiKey.status !== 'active') return false;
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return false;

  return true;
}

/**
 * Format API key for response (mask the encrypted key)
 */
function formatApiKeyResponse(apiKey: ApiKey): ApiKeyResponse {
  return {
    id: apiKey.id,
    name: apiKey.name,
    apiName: apiKey.apiName,
    maskedKey: maskEncryptedKey(),
    status: apiKey.status,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
    lastUsed: apiKey.lastUsed,
    expiresAt: apiKey.expiresAt,
    metadata: apiKey.metadata,
  };
}
