import {
  createClient,
  RealtimePostgresChangesPayload,
  SignUpWithPasswordCredentials,
  SupabaseClient,
  UserAttributes,
} from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { FullApiKeyResponse, getApiKeyByName, markApiKeyAsUsed } from '../apiKeyService';

export type ClientType = 'anon' | 'serviceRole';
type Row = Record<string, unknown>;
type TableName = keyof Database['public']['Tables'];
type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert'];
type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update'];
type SupabaseKeyMetadata = {
  projectUrl?: string;
};

export class ManagedSupabaseClient {
  private clientType: ClientType;
  private cachedClient: SupabaseClient<Database> | null = null;

  constructor(clientType: ClientType = 'anon') {
    this.clientType = clientType;
  }

  /**
   * Get or create Supabase client with managed credentials
   */
  async getClient(): Promise<SupabaseClient<Database>> {
    if (this.cachedClient) {
      return this.cachedClient;
    }

    // Determine which key to fetch
    const keyName = this.clientType === 'serviceRole' 
      ? 'service-role' 
      : 'production';

    // Get encrypted key from database
    const keyData = await getApiKeyByName('supabase', keyName, true);

    if (!keyData || !('decryptedKey' in keyData)) {
      throw new Error(`Supabase ${this.clientType} key not found or not decrypted`);
    }

    // Get project URL from metadata
    const metadata = readMetadata(keyData);
    const projectUrl = metadata.projectUrl?.trim();

    if (!projectUrl) {
      throw new Error('Supabase project URL not found in key metadata');
    }

    // Mark key as used
    await markApiKeyAsUsed(keyData.id);

    // Create and cache client
    this.cachedClient = createClient<Database>(
      projectUrl,
      keyData.decryptedKey,
      {
        auth: {
          persistSession: this.clientType === 'anon',
          detectSessionInUrl: this.clientType === 'anon',
        },
      }
    );

    return this.cachedClient;
  }

  /**
   * Authentication methods
   */
  async signUp(email: string, password: string, options?: SignUpWithPasswordCredentials['options']) {
    const client = await this.getClient();
    return client.auth.signUp({ email, password, options });
  }

  async signIn(email: string, password: string) {
    const client = await this.getClient();
    return client.auth.signInWithPassword({ email, password });
  }

  async signOut() {
    const client = await this.getClient();
    return client.auth.signOut();
  }

  async resetPassword(email: string) {
    const client = await this.getClient();
    return client.auth.resetPasswordForEmail(email);
  }

  async updateUser(updates: UserAttributes) {
    const client = await this.getClient();
    return client.auth.updateUser(updates);
  }

  /**
   * Data query methods
   */
  async query<T extends TableName>(table: T) {
    const client = await this.getClient();
    return fromTable(client, table).select();
  }

  async queryById<T extends TableName>(table: T, id: string) {
    const client = await this.getClient();
    return fromTable(client, table).select().eq('id', id).single();
  }

  async insert<T extends TableName>(table: T, data: TableInsert<T>) {
    const client = await this.getClient();
    return fromTable(client, table).insert([data]).select();
  }

  async update<T extends TableName>(table: T, id: string, data: TableUpdate<T>) {
    const client = await this.getClient();
    return fromTable(client, table).update(data).eq('id', id).select();
  }

  async delete<T extends TableName>(table: T, id: string) {
    const client = await this.getClient();
    return fromTable(client, table).delete().eq('id', id);
  }

  /**
   * Real-time subscription
   */
  async subscribe<T extends TableName>(
    table: T,
    callback: (payload: RealtimePostgresChangesPayload<Row>) => void
  ) {
    const client = await this.getClient();
    return client
      .channel(`${table}-changes`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => callback(payload)
      )
      .subscribe();
  }

  /**
   * Get raw client for custom operations
   */
  async getRawClient(): Promise<SupabaseClient<Database>> {
    return this.getClient();
  }

  /**
   * Reset cached client
   */
  resetCache() {
    this.cachedClient = null;
  }
}

/**
 * Export ready-to-use client instances
 */
export const supabaseAnon = new ManagedSupabaseClient('anon');
export const supabaseService = new ManagedSupabaseClient('serviceRole');

/**
 * Convenience exports for direct usage
 */
export const getSupabaseClient = (type: ClientType = 'anon') => {
  return type === 'serviceRole' ? supabaseService : supabaseAnon;
};

export async function withSupabaseAuth<T>(
  callback: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const client = await supabaseAnon.getClient();
  return callback(client);
}

export async function withSupabaseService<T>(
  callback: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const client = await supabaseService.getClient();
  return callback(client);
}

function readMetadata(keyData: FullApiKeyResponse): SupabaseKeyMetadata {
  if (!keyData.metadata || typeof keyData.metadata !== 'object' || Array.isArray(keyData.metadata)) {
    return {};
  }

  return keyData.metadata as SupabaseKeyMetadata;
}

function fromTable<T extends TableName>(client: SupabaseClient<Database>, table: T) {
  // Supabase's generic query builder does not narrow cleanly for dynamic table names.
  // Keep the cast local so callers still get checked table names and payload shapes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return client.from(table) as any;
}
