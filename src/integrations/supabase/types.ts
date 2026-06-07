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
  public: {
    Tables: {
      clinical_reports: {
        Row: {
          ai_assessment: string
          ai_severity: string
          checked_in_at: string | null
          checked_in_clinic: string | null
          chief_complaint: string
          created_at: string
          dispensing: Json | null
          esi_level: number | null
          esi_rationale: string | null
          forwarded_to_mo: string | null
          forwarded_to_pharmacist: string | null
          generated_at: string
          id: string
          mo_review: Json | null
          patient: Json
          patient_user_id: string | null
          qr_token: string | null
          recommended_action: string
          ref: string
          status: string
          symptoms: Json
          updated_at: string
        }
        Insert: {
          ai_assessment: string
          ai_severity: string
          checked_in_at?: string | null
          checked_in_clinic?: string | null
          chief_complaint: string
          created_at?: string
          dispensing?: Json | null
          esi_level?: number | null
          esi_rationale?: string | null
          forwarded_to_mo?: string | null
          forwarded_to_pharmacist?: string | null
          generated_at?: string
          id?: string
          mo_review?: Json | null
          patient: Json
          patient_user_id?: string | null
          qr_token?: string | null
          recommended_action: string
          ref: string
          status?: string
          symptoms?: Json
          updated_at?: string
        }
        Update: {
          ai_assessment?: string
          ai_severity?: string
          checked_in_at?: string | null
          checked_in_clinic?: string | null
          chief_complaint?: string
          created_at?: string
          dispensing?: Json | null
          esi_level?: number | null
          esi_rationale?: string | null
          forwarded_to_mo?: string | null
          forwarded_to_pharmacist?: string | null
          generated_at?: string
          id?: string
          mo_review?: Json | null
          patient?: Json
          patient_user_id?: string | null
          qr_token?: string | null
          recommended_action?: string
          ref?: string
          status?: string
          symptoms?: Json
          updated_at?: string
        }
        Relationships: []
      }
      clinics: {
        Row: {
          best_time: string
          created_at: string
          crowd: string
          distance: string
          id: string
          lat: number
          lng: number
          name: string
          queue: number
          sort_order: number
          updated_at: string
          wait: string
        }
        Insert: {
          best_time: string
          created_at?: string
          crowd: string
          distance: string
          id: string
          lat: number
          lng: number
          name: string
          queue?: number
          sort_order?: number
          updated_at?: string
          wait: string
        }
        Update: {
          best_time?: string
          created_at?: string
          crowd?: string
          distance?: string
          id?: string
          lat?: number
          lng?: number
          name?: string
          queue?: number
          sort_order?: number
          updated_at?: string
          wait?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          chief_complaint: string
          clinic: string
          created_at: string
          diagnosis: string | null
          id: string
          medications: string[]
          severity: string
          status: string
          symptoms: string[]
          updated_at: string
          user_id: string
          visit_date: string
        }
        Insert: {
          chief_complaint: string
          clinic: string
          created_at?: string
          diagnosis?: string | null
          id?: string
          medications?: string[]
          severity: string
          status?: string
          symptoms?: string[]
          updated_at?: string
          user_id: string
          visit_date?: string
        }
        Update: {
          chief_complaint?: string
          clinic?: string
          created_at?: string
          diagnosis?: string | null
          id?: string
          medications?: string[]
          severity?: string
          status?: string
          symptoms?: string[]
          updated_at?: string
          user_id?: string
          visit_date?: string
        }
        Relationships: []
      }
      google_oauth_tokens: {
        Row: {
          access_token: string | null
          created_at: string
          expires_at: string | null
          refresh_token: string
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          refresh_token: string
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          expires_at?: string | null
          refresh_token?: string
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      med_reminders: {
        Row: {
          created_at: string
          email_message_id: string | null
          fire_at: string
          google_event_id: string | null
          id: string
          medication_id: string
          status: string
          taken: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_message_id?: string | null
          fire_at: string
          google_event_id?: string | null
          id?: string
          medication_id: string
          status?: string
          taken?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_message_id?: string | null
          fire_at?: string
          google_event_id?: string | null
          id?: string
          medication_id?: string
          status?: string
          taken?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "med_reminders_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          calendar_reminders: boolean
          created_at: string
          dose: string | null
          email_reminders: boolean
          end_date: string | null
          google_event_id: string | null
          id: string
          instructions: string | null
          name: string
          start_date: string
          times_of_day: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          calendar_reminders?: boolean
          created_at?: string
          dose?: string | null
          email_reminders?: boolean
          end_date?: string | null
          google_event_id?: string | null
          id?: string
          instructions?: string | null
          name: string
          start_date?: string
          times_of_day?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          calendar_reminders?: boolean
          created_at?: string
          dose?: string | null
          email_reminders?: boolean
          end_date?: string | null
          google_event_id?: string | null
          id?: string
          instructions?: string | null
          name?: string
          start_date?: string
          times_of_day?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          dob: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          ic_number: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          ic_number?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dob?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          ic_number?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "medical_officer" | "pharmacist"
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
      app_role: ["patient", "medical_officer", "pharmacist"],
    },
  },
} as const
