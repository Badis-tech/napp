export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      api_keys: {
        Row: {
          id: string;
          name: string;
          api_name: string;
          encrypted_key: string;
          status: 'active' | 'inactive' | 'revoked';
          created_by_id: string;
          created_at: string;
          updated_at: string;
          last_used: string | null;
          expires_at: string | null;
          metadata: Json;
        };
        Insert: {
          id?: string;
          name: string;
          api_name: string;
          encrypted_key: string;
          status?: 'active' | 'inactive' | 'revoked';
          created_by_id: string;
          created_at?: string;
          updated_at?: string;
          last_used?: string | null;
          expires_at?: string | null;
          metadata?: Json;
        };
        Update: {
          id?: string;
          name?: string;
          api_name?: string;
          encrypted_key?: string;
          status?: 'active' | 'inactive' | 'revoked';
          created_by_id?: string;
          created_at?: string;
          updated_at?: string;
          last_used?: string | null;
          expires_at?: string | null;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: 'api_keys_created_by_id_fkey';
            columns: ['created_by_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      permissions: {
        Row: {
          id: string;
          action: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          action: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          action?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          role_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          role_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
          created_at: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
          created_at?: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'role_permissions_permission_id_fkey';
            columns: ['permission_id'];
            isOneToOne: false;
            referencedRelation: 'permissions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'role_permissions_role_id_fkey';
            columns: ['role_id'];
            isOneToOne: false;
            referencedRelation: 'roles';
            referencedColumns: ['id'];
          },
        ];
      };
      roles: {
        Row: {
          id: string;
          name: 'admin' | 'operator' | 'investor' | 'donor' | 'worker' | 'student';
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: 'admin' | 'operator' | 'investor' | 'donor' | 'worker' | 'student';
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: 'admin' | 'operator' | 'investor' | 'donor' | 'worker' | 'student';
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      handle_new_user: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      prevent_profile_role_escalation: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
      set_updated_at: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
