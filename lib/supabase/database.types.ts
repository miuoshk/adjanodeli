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
    PostgrestVersion: "14.5"
  }
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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      daily_stock: {
        Row: {
          cap: number
          created_at: string
          day: string
          id: string
          product_id: string
          reserved_qty: number
          updated_at: string
        }
        Insert: {
          cap: number
          created_at?: string
          day: string
          id?: string
          product_id: string
          reserved_qty?: number
          updated_at?: string
        }
        Update: {
          cap?: number
          created_at?: string
          day?: string
          id?: string
          product_id?: string
          reserved_qty?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          actor: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          order_id: string
          to_status: string | null
          updated_at: string
        }
        Insert: {
          actor?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id: string
          to_status?: string | null
          updated_at?: string
        }
        Update: {
          actor?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          order_id?: string
          to_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_actor_fkey"
            columns: ["actor"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          qty: number
          unit_price_grosze: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          qty: number
          unit_price_grosze: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          qty?: number
          unit_price_grosze?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancelled_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          discount_grosze: number
          expires_at: string | null
          id: string
          note: string | null
          order_number: number
          paid_at: string | null
          picked_up_at: string | null
          pickup_code: string | null
          pickup_date: string
          pickup_point_id: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_grosze: number
          terms_accepted_at: string | null
          total_grosze: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          discount_grosze?: number
          expires_at?: string | null
          id?: string
          note?: string | null
          order_number?: never
          paid_at?: string | null
          picked_up_at?: string | null
          pickup_code?: string | null
          pickup_date: string
          pickup_point_id: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_grosze: number
          terms_accepted_at?: string | null
          total_grosze: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          discount_grosze?: number
          expires_at?: string | null
          id?: string
          note?: string | null
          order_number?: never
          paid_at?: string | null
          picked_up_at?: string | null
          pickup_code?: string | null
          pickup_date?: string
          pickup_point_id?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_grosze?: number
          terms_accepted_at?: string | null
          total_grosze?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_points: {
        Row: {
          address: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          pickup_from: string
          pickup_to: string
          slug: string
          sort_order: number
          updated_at: string
          weekdays: number[]
        }
        Insert: {
          address: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          pickup_from: string
          pickup_to: string
          slug: string
          sort_order?: number
          updated_at?: string
          weekdays?: number[]
        }
        Update: {
          address?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pickup_from?: string
          pickup_to?: string
          slug?: string
          sort_order?: number
          updated_at?: string
          weekdays?: number[]
        }
        Relationships: []
      }
      product_day_overrides: {
        Row: {
          cap: number | null
          created_at: string
          day: string
          id: string
          is_available: boolean
          product_id: string
          updated_at: string
        }
        Insert: {
          cap?: number | null
          created_at?: string
          day: string
          id?: string
          is_available?: boolean
          product_id: string
          updated_at?: string
        }
        Update: {
          cap?: number | null
          created_at?: string
          day?: string
          id?: string
          is_available?: boolean
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_day_overrides_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allergens: string[]
          category_id: string | null
          created_at: string
          daily_cap_default: number
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean
          name: string
          price_grosze: number
          slug: string
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          allergens?: string[]
          category_id?: string | null
          created_at?: string
          daily_cap_default?: number
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name: string
          price_grosze: number
          slug: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          allergens?: string[]
          category_id?: string | null
          created_at?: string
          daily_cap_default?: number
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean
          name?: string
          price_grosze?: number
          slug?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          marketing_consent: boolean | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          marketing_consent?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          marketing_consent?: boolean | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          bakery_name: string | null
          closed_dates: string[]
          created_at: string
          currency: string
          cutoff_time: string
          id: number
          max_days_ahead: number
          max_qty_per_item: number
          order_weekdays: number[]
          owner_email: string
          owner_phone: string | null
          pending_order_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          bakery_name?: string | null
          closed_dates?: string[]
          created_at?: string
          currency?: string
          cutoff_time?: string
          id: number
          max_days_ahead?: number
          max_qty_per_item?: number
          order_weekdays?: number[]
          owner_email: string
          owner_phone?: string | null
          pending_order_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          bakery_name?: string | null
          closed_dates?: string[]
          created_at?: string
          currency?: string
          cutoff_time?: string
          id?: number
          max_days_ahead?: number
          max_qty_per_item?: number
          order_weekdays?: number[]
          owner_email?: string
          owner_phone?: string | null
          pending_order_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      special_requests: {
        Row: {
          created_at: string
          description: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          status: string | null
          updated_at: string
          wanted_date: string | null
        }
        Insert: {
          created_at?: string
          description: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          wanted_date?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          status?: string | null
          updated_at?: string
          wanted_date?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      available_pickup_dates: { Args: never; Returns: string[] }
      create_order: {
        Args: {
          p_items: Json
          p_note: string
          p_pickup_date: string
          p_pickup_point_id: string
        }
        Returns: string
      }
      expire_order: { Args: { p_order_id: string }; Returns: undefined }
      expire_pending_orders: { Args: never; Returns: number }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      mark_order_paid: {
        Args: { p_order_id: string; p_payment_intent_id: string }
        Returns: undefined
      }
      product_availability: {
        Args: { p_day: string }
        Returns: {
          cap: number
          is_available: boolean
          product_id: string
          remaining: number
          reserved: number
        }[]
      }
      production_summary: {
        Args: { p_day: string }
        Returns: {
          by_point: Json
          product_id: string
          product_name: string
          total_qty: number
        }[]
      }
      release_order_stock: { Args: { p_order_id: string }; Returns: undefined }
      set_order_status: {
        Args: { p_note: string; p_order_id: string; p_status: string }
        Returns: undefined
      }
      warsaw_now: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {},
  },
} as const
