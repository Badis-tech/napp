import { NextRequest, NextResponse } from 'next/server';
import { getApiKey, updateApiKey, revokeApiKey, deleteApiKey } from '@/lib/apiKeyService';

async function verifyAuth(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  return userId || null;
}

/**
 * GET /api/keys/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const decrypt = searchParams.get('decrypt') === 'true';

    const apiKey = await getApiKey(id, decrypt);
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    console.error('Error getting API key:', error);
    return NextResponse.json(
      { error: 'Failed to get API key' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/keys/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, status, metadata, expiresAt } = body;

    const updatedKey = await updateApiKey(id, {
      name: name !== undefined ? name : undefined,
      status: status !== undefined ? status : undefined,
      metadata: metadata !== undefined ? metadata : undefined,
      expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
    });

    if (!updatedKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedKey,
    });
  } catch (error) {
    console.error('Error updating API key:', error);
    return NextResponse.json(
      { error: 'Failed to update API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/keys/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await verifyAuth(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const revoke = searchParams.get('revoke') === 'true';

    let result;
    if (revoke) {
      result = await revokeApiKey(id);
    } else {
      result = await deleteApiKey(id);
    }

    if (!result) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: revoke ? 'API key revoked' : 'API key deleted',
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
