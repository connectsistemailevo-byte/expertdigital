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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      provider_customization: {
        Row: {
          company_name: string | null
          created_at: string
          custom_domain: string | null
          id: string
          logo_url: string | null
          primary_color: string | null
          provider_id: string
          secondary_color: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          provider_id: string
          secondary_color?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string | null
          provider_id?: string
          secondary_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_customization_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payments: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          status: string
          stripe_payment_intent_id: string | null
          tipo: string
          valor: number
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          tipo: string
          valor: number
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          tipo?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "provider_payments_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_subscriptions: {
        Row: {
          adesao_paga: boolean
          adesao_paga_em: string | null
          corridas_usadas: number
          created_at: string
          id: string
          limite_corridas: number | null
          mensalidade_atual: number | null
          plano: Database["public"]["Enums"]["provider_plan"] | null
          provider_id: string
          proxima_cobranca: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ativo: boolean
          trial_corridas_restantes: number
          updated_at: string
        }
        Insert: {
          adesao_paga?: boolean
          adesao_paga_em?: string | null
          corridas_usadas?: number
          created_at?: string
          id?: string
          limite_corridas?: number | null
          mensalidade_atual?: number | null
          plano?: Database["public"]["Enums"]["provider_plan"] | null
          provider_id: string
          proxima_cobranca?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ativo?: boolean
          trial_corridas_restantes?: number
          updated_at?: string
        }
        Update: {
          adesao_paga?: boolean
          adesao_paga_em?: string | null
          corridas_usadas?: number
          created_at?: string
          id?: string
          limite_corridas?: number | null
          mensalidade_atual?: number | null
          plano?: Database["public"]["Enums"]["provider_plan"] | null
          provider_id?: string
          proxima_cobranca?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ativo?: boolean
          trial_corridas_restantes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_subscriptions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: true
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          address: string | null
          base_price: number | null
          created_at: string
          has_patins: boolean
          id: string
          latitude: number
          longitude: number
          name: string
          patins_extra_price: number | null
          price_per_km: number | null
          region: string | null
          service_types: string[]
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string | null
          base_price?: number | null
          created_at?: string
          has_patins?: boolean
          id?: string
          latitude: number
          longitude: number
          name: string
          patins_extra_price?: number | null
          price_per_km?: number | null
          region?: string | null
          service_types?: string[]
          updated_at?: string
          whatsapp: string
        }
        Update: {
          address?: string | null
          base_price?: number | null
          created_at?: string
          has_patins?: boolean
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          patins_extra_price?: number | null
          price_per_km?: number | null
          region?: string | null
          service_types?: string[]
          updated_at?: string
          whatsapp?: string
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
      provider_plan: "basico" | "profissional" | "pro"
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
      provider_plan: ["basico", "profissional", "pro"],
    },
  },
} as const
