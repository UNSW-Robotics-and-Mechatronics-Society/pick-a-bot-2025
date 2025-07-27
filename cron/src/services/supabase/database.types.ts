export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          extensions?: Json
          variables?: Json
          query?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      cron_log: {
        Row: {
          by: string
          id: string
          payload: string | null
          run_at: string
          status: string
        }
        Insert: {
          by?: string
          id?: string
          payload?: string | null
          run_at: string
          status?: string
        }
        Update: {
          by?: string
          id?: string
          payload?: string | null
          run_at?: string
          status?: string
        }
        Relationships: []
      }
      current_match: {
        Row: {
          bot1: string
          bot2: string
          id: string
          is_final: boolean
          match_id: string
          ordering: number
          round: number
          score_bot1: number | null
          score_bot2: number | null
          state: Database["public"]["Enums"]["match_state"]
          tournament_id: string
          underway_time: string | null
          updated_time: string | null
          winner: string | null
        }
        Insert: {
          bot1: string
          bot2: string
          id?: string
          is_final?: boolean
          match_id: string
          ordering: number
          round: number
          score_bot1?: number | null
          score_bot2?: number | null
          state?: Database["public"]["Enums"]["match_state"]
          tournament_id: string
          underway_time?: string | null
          updated_time?: string | null
          winner?: string | null
        }
        Update: {
          bot1?: string
          bot2?: string
          id?: string
          is_final?: boolean
          match_id?: string
          ordering?: number
          round?: number
          score_bot1?: number | null
          score_bot2?: number | null
          state?: Database["public"]["Enums"]["match_state"]
          tournament_id?: string
          underway_time?: string | null
          updated_time?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "current_match_match_id_match_id_fk"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
        ]
      }
      match: {
        Row: {
          bot1: string
          bot2: string
          challonge_match_id: number
          id: string
          is_final: boolean
          ordering: number
          round: number
          score_bot1: number | null
          score_bot2: number | null
          state: Database["public"]["Enums"]["match_state"]
          tournament_id: string
          underway_time: string | null
          updated_time: string | null
          winner: string | null
        }
        Insert: {
          bot1: string
          bot2: string
          challonge_match_id: number
          id?: string
          is_final?: boolean
          ordering: number
          round: number
          score_bot1?: number | null
          score_bot2?: number | null
          state?: Database["public"]["Enums"]["match_state"]
          tournament_id: string
          underway_time?: string | null
          updated_time?: string | null
          winner?: string | null
        }
        Update: {
          bot1?: string
          bot2?: string
          challonge_match_id?: number
          id?: string
          is_final?: boolean
          ordering?: number
          round?: number
          score_bot1?: number | null
          score_bot2?: number | null
          state?: Database["public"]["Enums"]["match_state"]
          tournament_id?: string
          underway_time?: string | null
          updated_time?: string | null
          winner?: string | null
        }
        Relationships: []
      }
      token_transaction: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          balance_delta: number
          bot_chosen: string
          created_at: string
          description: string | null
          id: string
          match_id: string | null
          user_id: string
          vote_id: string
          winner: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          balance_delta: number
          bot_chosen: string
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string | null
          user_id: string
          vote_id: string
          winner: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          balance_delta?: number
          bot_chosen?: string
          created_at?: string
          description?: string | null
          id?: string
          match_id?: string | null
          user_id?: string
          vote_id?: string
          winner?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_transaction_match_id_match_id_fk"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_transaction_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_transaction_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_transaction_vote_id_vote_id_fk"
            columns: ["vote_id"]
            isOneToOne: false
            referencedRelation: "vote"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string
          tokens: number
        }
        Insert: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          tokens?: number
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          tokens?: number
        }
        Relationships: []
      }
      vote: {
        Row: {
          bot_chosen: string
          created_at: string | null
          id: string
          match_id: string
          used_tokens: number | null
          user_id: string
        }
        Insert: {
          bot_chosen: string
          created_at?: string | null
          id?: string
          match_id: string
          used_tokens?: number | null
          user_id: string
        }
        Update: {
          bot_chosen?: string
          created_at?: string | null
          id?: string
          match_id?: string
          used_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vote_match_id_match_id_fk"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "match"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vote_user_id_user_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          email: string | null
          id: string | null
          name: string | null
          tokens: number | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          name?: string | null
          tokens?: number | null
        }
        Update: {
          email?: string | null
          id?: string | null
          name?: string | null
          tokens?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      match_state: "pending" | "open" | "complete"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      match_state: ["pending", "open", "complete"],
    },
  },
} as const

