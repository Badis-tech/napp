import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, listApiKeys } from '@/lib/apiKeyService';

// Mock auth check - replace with actual auth verification
async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  // In production, verify the token and get the actual user ID
  // For now, extract from a mock header
  const userId = request.headers.get('x-user-id');
  return userId || null;
}

/**
 * GET /api/keys
 * List all API keys (optionally filtered)
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const apiName = searchParams.get('apiName');
    const status = searchParams.get('status');

    const keys = await listApiKeys({
      userId,
      apiName: apiName || undefined,
      status: status || undefined,
    });

    return NextResponse.json({
      success: true,
      data: keys,
    });
  } catch (error) {
    console.error('Error listing API keys:', error);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/keys
 * Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, apiName, key, expiresAt, metadata } = body;

    // Validation
    if (!name || !apiName || !key) {
      return NextResponse.json(
        { error: 'Missing required fields: name, apiName, key' },
        { status: 400 }
      );
    }

    if (key.length < 10) {
      return NextResponse.json(
        { error: 'API key is too short' },
        { status: 400 }
      );
    }

    const createdKey = await createApiKey(userId, {
      name,
      apiName,
      key,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      metadata: metadata || {},
    });

    return NextResponse.json(
      {
        success: true,
        data: createdKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
