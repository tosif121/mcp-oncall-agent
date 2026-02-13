export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string;
          alert_id: string;
          service: string;
          severity: string;
          message: string;
          affected_users: number | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          service: string;
          severity: string;
          message: string;
          affected_users?: number | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          service?: string;
          severity?: string;
          message?: string;
          affected_users?: number | null;
          status?: string;
          created_at?: string;
        };
      };
      commits: {
        Row: {
          id: string;
          alert_id: string;
          sha: string;
          author: string;
          message: string;
          url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          sha: string;
          author: string;
          message: string;
          url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          sha?: string;
          author?: string;
          message?: string;
          url?: string | null;
          created_at?: string;
        };
      };
      log_patterns: {
        Row: {
          id: string;
          alert_id: string;
          error_type: string;
          count: number;
          sample_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          error_type: string;
          count?: number;
          sample_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          error_type?: string;
          count?: number;
          sample_message?: string | null;
          created_at?: string;
        };
      };
      ai_summaries: {
        Row: {
          id: string;
          alert_id: string;
          root_cause: string;
          confidence: number;
          recommended_action: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          root_cause: string;
          confidence: number;
          recommended_action?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          root_cause?: string;
          confidence?: number;
          recommended_action?: string | null;
          created_at?: string;
        };
      };

      actions_taken: {
        Row: {
          id: string;
          alert_id: string;
          action_type: string;
          status: string;
          user_email: string | null;
          details: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_id: string;
          action_type: string;
          status: string;
          user_email?: string | null;
          details?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          alert_id?: string;
          action_type?: string;
          status?: string;
          user_email?: string | null;
          details?: any | null;
          created_at?: string;
        };
      };
    };
  };
}
