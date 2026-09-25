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
      allergens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_path: string | null
          is_active: boolean | null
          lead_days: number
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean | null
          lead_days?: number
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_path?: string | null
          is_active?: boolean | null
          lead_days?: number
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
      discount_code_uses: {
        Row: {
          code_id: string
          created_at: string
          id: string
          order_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code_id: string
          created_at?: string
          id?: string
          order_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code_id?: string
          created_at?: string
          id?: string
          order_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_uses_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_uses_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_uses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          max_discount_grosze: number | null
          max_uses: number | null
          min_order_grosze: number
          per_user_once: boolean
          pickup_point_id: string | null
          type: string
          updated_at: string
          uses_count: number
          valid_from: string | null
          valid_to: string | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_discount_grosze?: number | null
          max_uses?: number | null
          min_order_grosze?: number
          per_user_once?: boolean
          pickup_point_id?: string | null
          type: string
          updated_at?: string
          uses_count?: number
          valid_from?: string | null
          valid_to?: string | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_discount_grosze?: number | null
          max_uses?: number | null
          min_order_grosze?: number
          per_user_once?: boolean
          pickup_point_id?: string | null
          type?: string
          updated_at?: string
          uses_count?: number
          valid_from?: string | null
          valid_to?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_stamps: {
        Row: {
          consumed_at: string | null
          created_at: string
          cycle_started_at: string
          earned_at: string
          expires_at: string
          id: string
          order_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          cycle_started_at: string
          earned_at?: string
          expires_at: string
          id?: string
          order_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          cycle_started_at?: string
          earned_at?: string
          expires_at?: string
          id?: string
          order_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_stamps_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_stamps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_vouchers: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          issued_at: string
          restored_from_order_id: string | null
          type: string
          updated_at: string
          used_order_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          issued_at?: string
          restored_from_order_id?: string | null
          type: string
          updated_at?: string
          used_order_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          issued_at?: string
          restored_from_order_id?: string | null
          type?: string
          updated_at?: string
          used_order_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_vouchers_restored_from_order_id_fkey"
            columns: ["restored_from_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_vouchers_used_order_id_fkey"
            columns: ["used_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          discount_code_id: string | null
          discount_grosze: number
          expires_at: string | null
          id: string
          invoice_address: string | null
          invoice_company: string | null
          invoice_nip: string | null
          invoice_requested: boolean
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
          discount_code_id?: string | null
          discount_grosze?: number
          expires_at?: string | null
          id?: string
          invoice_address?: string | null
          invoice_company?: string | null
          invoice_nip?: string | null
          invoice_requested?: boolean
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
          discount_code_id?: string | null
          discount_grosze?: number
          expires_at?: string | null
          id?: string
          invoice_address?: string | null
          invoice_company?: string | null
          invoice_nip?: string | null
          invoice_requested?: boolean
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
            foreignKeyName: "orders_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
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
      pickup_point_access: {
        Row: {
          created_at: string
          granted_at: string
          granted_via: string
          id: string
          pickup_point_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_at?: string
          granted_via: string
          id?: string
          pickup_point_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          granted_at?: string
          granted_via?: string
          id?: string
          pickup_point_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_point_access_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickup_point_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_point_unlock_attempts: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pickup_point_unlock_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickup_points: {
        Row: {
          access_code: string | null
          address: string
          allowed_email_domains: string[]
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
          visibility: string
          weekdays: number[]
        }
        Insert: {
          access_code?: string | null
          address: string
          allowed_email_domains?: string[]
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
          visibility?: string
          weekdays?: number[]
        }
        Update: {
          access_code?: string | null
          address?: string
          allowed_email_domains?: string[]
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
          visibility?: string
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
      product_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
          is_featured: boolean
          is_new: boolean
          lead_days: number | null
          name: string
          price_grosze: number
          promo_from: string | null
          promo_price_grosze: number | null
          promo_to: string | null
          slug: string
          sort_order: number
          tags: string[]
          updated_at: string
          weekdays: number[]
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
          is_featured?: boolean
          is_new?: boolean
          lead_days?: number | null
          name: string
          price_grosze: number
          promo_from?: string | null
          promo_price_grosze?: number | null
          promo_to?: string | null
          slug: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
          weekdays?: number[]
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
          is_featured?: boolean
          is_new?: boolean
          lead_days?: number | null
          name?: string
          price_grosze?: number
          promo_from?: string | null
          promo_price_grosze?: number | null
          promo_to?: string | null
          slug?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
          weekdays?: number[]
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
          invoice_defaults: Json | null
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
          invoice_defaults?: Json | null
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
          invoice_defaults?: Json | null
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
          customer_cancellation_enabled: boolean
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
          customer_cancellation_enabled?: boolean
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
          customer_cancellation_enabled?: boolean
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
      standing_orders: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          items: Json
          name: string
          note: string | null
          pickup_point_id: string
          remind: boolean
          updated_at: string
          user_id: string
          weekdays: number[]
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          items: Json
          name: string
          note?: string | null
          pickup_point_id: string
          remind?: boolean
          updated_at?: string
          user_id: string
          weekdays: number[]
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          items?: Json
          name?: string
          note?: string | null
          pickup_point_id?: string
          remind?: boolean
          updated_at?: string
          user_id?: string
          weekdays?: number[]
        }
        Relationships: [
          {
            foreignKeyName: "standing_orders_pickup_point_id_fkey"
            columns: ["pickup_point_id"]
            isOneToOne: false
            referencedRelation: "pickup_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "standing_orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_login_email: { Args: { p_login: string }; Returns: string }
      available_pickup_dates:
        | { Args: never; Returns: string[] }
        | { Args: { p_lead_days: number }; Returns: string[] }
      create_order: {
        Args: {
          p_discount?: Json
          p_invoice?: Json
          p_items: Json
          p_note: string
          p_pickup_date: string
          p_pickup_point_id: string
        }
        Returns: string
      }
      customer_cancel_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      discount_code_amount: {
        Args: {
          p_max_discount_grosze: number
          p_subtotal: number
          p_type: string
          p_value: number
        }
        Returns: number
      }
      expire_order: { Args: { p_order_id: string }; Returns: undefined }
      expire_pending_orders: { Args: never; Returns: number }
      grant_pickup_point_access: {
        Args: { p_email: string; p_pickup_point_id: string }
        Returns: undefined
      }
      grant_stamps_for_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      has_pickup_point_access: { Args: { p_id: string }; Returns: boolean }
      is_owner: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
      is_valid_nip: { Args: { p_nip: string }; Returns: boolean }
      loyalty_status: { Args: { p_user: string }; Returns: Json }
      mark_order_paid: {
        Args: { p_order_id: string; p_payment_intent_id: string }
        Returns: undefined
      }
      mark_order_refunded: { Args: { p_order_id: string }; Returns: undefined }
      pickup_point_visible: { Args: { p_id: string }; Returns: boolean }
      product_availability: {
        Args: { p_day: string }
        Returns: {
          cap: number
          earliest_date: string
          effective_price_grosze: number
          is_available: boolean
          is_promo: boolean
          lead_days: number
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
      rename_allergen: {
        Args: { p_new: string; p_old: string }
        Returns: undefined
      }
      rename_tag: { Args: { p_new: string; p_old: string }; Returns: undefined }
      restore_discount_for_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      restore_loyalty_for_order: {
        Args: { p_order_id: string }
        Returns: undefined
      }
      revoke_pickup_point_access: {
        Args: { p_pickup_point_id: string; p_user_id: string }
        Returns: undefined
      }
      revoke_pickup_point_code_access: {
        Args: { p_pickup_point_id: string }
        Returns: undefined
      }
      set_order_status: {
        Args: { p_note: string; p_order_id: string; p_status: string }
        Returns: undefined
      }
      stats_by_pickup_point: {
        Args: { p_from: string; p_to: string }
        Returns: {
          order_count: number
          pickup_point_id: string
          point_name: string
          revenue_grosze: number
          uncollected_count: number
          uncollected_pct: number
        }[]
      }
      stats_orders_by_weekday: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_orders: number
          weekday: number
        }[]
      }
      stats_require_owner_range: {
        Args: { p_from: string; p_to: string }
        Returns: undefined
      }
      stats_revenue_by_day: {
        Args: { p_from: string; p_to: string }
        Returns: {
          day: string
          revenue_grosze: number
        }[]
      }
      stats_sellout_alerts: {
        Args: never
        Returns: {
          current_cap: number
          product_id: string
          product_name: string
          sellout_days: number
          suggested_cap: number
        }[]
      }
      stats_summary: {
        Args: { p_from: string; p_to: string }
        Returns: {
          avg_order_grosze: number
          order_count: number
          returning_customers: number
          revenue_grosze: number
          uncollected_count: number
          unique_customers: number
        }[]
      }
      stats_top_products: {
        Args: { p_from: string; p_to: string }
        Returns: {
          product_id: string
          product_name: string
          qty: number
          revenue_grosze: number
          sale_days: number
          sellout_days: number
          sellout_pct: number
        }[]
      }
      sync_domain_access: { Args: { p_user_id: string }; Returns: undefined }
      unlock_pickup_point: {
        Args: { p_code: string }
        Returns: {
          access_code: string | null
          address: string
          allowed_email_domains: string[]
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
          visibility: string
          weekdays: number[]
        }
        SetofOptions: {
          from: "*"
          to: "pickup_points"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      validate_discount_code: {
        Args: { p_code: string; p_pickup_point_id: string; p_subtotal: number }
        Returns: Json
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
