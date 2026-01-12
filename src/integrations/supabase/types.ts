export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      broker_sessions: {
        Row: {
          account_id: string | null
          broker: Database["public"]["Enums"]["broker_type"]
          created_at: string | null
          credentials_encrypted: string | null
          id: string
          is_authenticated: boolean | null
          last_authenticated: string | null
          refresh_token: string | null
          session_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          broker: Database["public"]["Enums"]["broker_type"]
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          is_authenticated?: boolean | null
          last_authenticated?: string | null
          refresh_token?: string | null
          session_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          broker?: Database["public"]["Enums"]["broker_type"]
          created_at?: string | null
          credentials_encrypted?: string | null
          id?: string
          is_authenticated?: boolean | null
          last_authenticated?: string | null
          refresh_token?: string | null
          session_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ibkr_sessions: {
        Row: {
          account_id: string | null
          created_at: string | null
          id: string
          is_authenticated: boolean | null
          last_authenticated: string | null
          session_token: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          created_at?: string | null
          id?: string
          is_authenticated?: boolean | null
          last_authenticated?: string | null
          session_token?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          created_at?: string | null
          id?: string
          is_authenticated?: boolean | null
          last_authenticated?: string | null
          session_token?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          broker: Database["public"]["Enums"]["broker_type"] | null
          created_at: string | null
          expiry: string | null
          filled_at: string | null
          filled_price: number | null
          ibkr_order_id: string | null
          id: string
          limit_price: number | null
          option_type: Database["public"]["Enums"]["option_type"] | null
          quantity: number
          side: Database["public"]["Enums"]["order_side"]
          signal_id: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          stop_loss_price: number | null
          strategy: Database["public"]["Enums"]["option_strategy"] | null
          strike: number | null
          symbol: string
          take_profit_price: number | null
          trailing_stop_percent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          broker?: Database["public"]["Enums"]["broker_type"] | null
          created_at?: string | null
          expiry?: string | null
          filled_at?: string | null
          filled_price?: number | null
          ibkr_order_id?: string | null
          id?: string
          limit_price?: number | null
          option_type?: Database["public"]["Enums"]["option_type"] | null
          quantity: number
          side: Database["public"]["Enums"]["order_side"]
          signal_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stop_loss_price?: number | null
          strategy?: Database["public"]["Enums"]["option_strategy"] | null
          strike?: number | null
          symbol: string
          take_profit_price?: number | null
          trailing_stop_percent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          broker?: Database["public"]["Enums"]["broker_type"] | null
          created_at?: string | null
          expiry?: string | null
          filled_at?: string | null
          filled_price?: number | null
          ibkr_order_id?: string | null
          id?: string
          limit_price?: number | null
          option_type?: Database["public"]["Enums"]["option_type"] | null
          quantity?: number
          side?: Database["public"]["Enums"]["order_side"]
          signal_id?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          stop_loss_price?: number | null
          strategy?: Database["public"]["Enums"]["option_strategy"] | null
          strike?: number | null
          symbol?: string
          take_profit_price?: number | null
          trailing_stop_percent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          avg_cost: number
          broker: Database["public"]["Enums"]["broker_type"] | null
          closed_at: string | null
          current_price: number | null
          expiry: string | null
          id: string
          is_open: boolean | null
          opened_at: string | null
          option_type: Database["public"]["Enums"]["option_type"] | null
          order_id: string | null
          quantity: number
          stop_loss_price: number | null
          strike: number | null
          symbol: string
          take_profit_price: number | null
          trailing_stop_price: number | null
          unrealized_pnl: number | null
          user_id: string
        }
        Insert: {
          avg_cost: number
          broker?: Database["public"]["Enums"]["broker_type"] | null
          closed_at?: string | null
          current_price?: number | null
          expiry?: string | null
          id?: string
          is_open?: boolean | null
          opened_at?: string | null
          option_type?: Database["public"]["Enums"]["option_type"] | null
          order_id?: string | null
          quantity: number
          stop_loss_price?: number | null
          strike?: number | null
          symbol: string
          take_profit_price?: number | null
          trailing_stop_price?: number | null
          unrealized_pnl?: number | null
          user_id: string
        }
        Update: {
          avg_cost?: number
          broker?: Database["public"]["Enums"]["broker_type"] | null
          closed_at?: string | null
          current_price?: number | null
          expiry?: string | null
          id?: string
          is_open?: boolean | null
          opened_at?: string | null
          option_type?: Database["public"]["Enums"]["option_type"] | null
          order_id?: string | null
          quantity?: number
          stop_loss_price?: number | null
          strike?: number | null
          symbol?: string
          take_profit_price?: number | null
          trailing_stop_price?: number | null
          unrealized_pnl?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_rules: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          expiry_days: number | null
          id: string
          max_position_value: number | null
          name: string
          option_strategy: Database["public"]["Enums"]["option_strategy"]
          position_size_percent: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          stop_loss_percent: number | null
          strike_offset_percent: number | null
          take_profit_percent: number | null
          trailing_stop_percent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          expiry_days?: number | null
          id?: string
          max_position_value?: number | null
          name: string
          option_strategy: Database["public"]["Enums"]["option_strategy"]
          position_size_percent?: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          stop_loss_percent?: number | null
          strike_offset_percent?: number | null
          take_profit_percent?: number | null
          trailing_stop_percent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          expiry_days?: number | null
          id?: string
          max_position_value?: number | null
          name?: string
          option_strategy?: Database["public"]["Enums"]["option_strategy"]
          position_size_percent?: number | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          stop_loss_percent?: number | null
          strike_offset_percent?: number | null
          take_profit_percent?: number | null
          trailing_stop_percent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signals: {
        Row: {
          bb_lower: number | null
          bb_middle: number | null
          bb_upper: number | null
          executed: boolean | null
          id: string
          price_at_signal: number
          signal_rule_id: string | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          symbol: string
          triggered_at: string | null
          user_id: string
          volume: number | null
          vwap: number | null
          watchlist_id: string | null
        }
        Insert: {
          bb_lower?: number | null
          bb_middle?: number | null
          bb_upper?: number | null
          executed?: boolean | null
          id?: string
          price_at_signal: number
          signal_rule_id?: string | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          symbol: string
          triggered_at?: string | null
          user_id: string
          volume?: number | null
          vwap?: number | null
          watchlist_id?: string | null
        }
        Update: {
          bb_lower?: number | null
          bb_middle?: number | null
          bb_upper?: number | null
          executed?: boolean | null
          id?: string
          price_at_signal?: number
          signal_rule_id?: string | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          symbol?: string
          triggered_at?: string | null
          user_id?: string
          volume?: number | null
          vwap?: number | null
          watchlist_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_signal_rule_id_fkey"
            columns: ["signal_rule_id"]
            isOneToOne: false
            referencedRelation: "signal_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlist"
            referencedColumns: ["id"]
          },
        ]
      }
      trading_settings: {
        Row: {
          auto_trade_enabled: boolean | null
          created_at: string | null
          id: string
          max_daily_loss: number | null
          max_daily_trades: number | null
          max_position_size: number | null
          preferred_broker: Database["public"]["Enums"]["broker_type"] | null
          trading_hours_end: string | null
          trading_hours_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_trade_enabled?: boolean | null
          created_at?: string | null
          id?: string
          max_daily_loss?: number | null
          max_daily_trades?: number | null
          max_position_size?: number | null
          preferred_broker?: Database["public"]["Enums"]["broker_type"] | null
          trading_hours_end?: string | null
          trading_hours_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_trade_enabled?: boolean | null
          created_at?: string | null
          id?: string
          max_daily_loss?: number | null
          max_daily_trades?: number | null
          max_position_size?: number | null
          preferred_broker?: Database["public"]["Enums"]["broker_type"] | null
          trading_hours_end?: string | null
          trading_hours_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          bb_period: number | null
          bb_std_dev: number | null
          created_at: string | null
          enabled: boolean | null
          id: string
          symbol: string
          updated_at: string | null
          user_id: string
          vwap_enabled: boolean | null
        }
        Insert: {
          bb_period?: number | null
          bb_std_dev?: number | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          symbol: string
          updated_at?: string | null
          user_id: string
          vwap_enabled?: boolean | null
        }
        Update: {
          bb_period?: number | null
          bb_std_dev?: number | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          symbol?: string
          updated_at?: string | null
          user_id?: string
          vwap_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      broker_type: "ibkr" | "public" | "tastytrade"
      option_strategy:
        | "buy_call"
        | "buy_put"
        | "sell_call"
        | "sell_put"
        | "bull_call_spread"
        | "bear_put_spread"
        | "iron_condor"
        | "straddle"
        | "strangle"
      option_type: "call" | "put"
      order_side: "buy" | "sell"
      order_status:
        | "pending"
        | "submitted"
        | "filled"
        | "partial"
        | "cancelled"
        | "rejected"
      signal_type:
        | "bb_breakout_up"
        | "bb_breakout_down"
        | "bb_mean_reversion_up"
        | "bb_mean_reversion_down"
        | "vwap_cross_up"
        | "vwap_cross_down"
        | "custom"
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
  public: {
    Enums: {
      broker_type: ["ibkr", "public", "tastytrade"],
      option_strategy: [
        "buy_call",
        "buy_put",
        "sell_call",
        "sell_put",
        "bull_call_spread",
        "bear_put_spread",
        "iron_condor",
        "straddle",
        "strangle",
      ],
      option_type: ["call", "put"],
      order_side: ["buy", "sell"],
      order_status: [
        "pending",
        "submitted",
        "filled",
        "partial",
        "cancelled",
        "rejected",
      ],
      signal_type: [
        "bb_breakout_up",
        "bb_breakout_down",
        "bb_mean_reversion_up",
        "bb_mean_reversion_down",
        "vwap_cross_up",
        "vwap_cross_down",
        "custom",
      ],
    },
  },
} as const
