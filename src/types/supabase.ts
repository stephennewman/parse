export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      form_fields: {
        Row: {
          created_at: string
          display_order: number
          field_type: string
          help_text: string | null
          id: string
          internal_key: string
          is_required: boolean | null
          label: string
          max_value: number | null
          min_value: number | null
          name: string | null
          options: Json | null
          rating_max: number | null
          rating_min: number | null
          template_id: string
        }
        Insert: {
          created_at?: string
          display_order: number
          field_type: string
          help_text?: string | null
          id?: string
          internal_key: string
          is_required?: boolean | null
          label: string
          max_value?: number | null
          min_value?: number | null
          name?: string | null
          options?: Json | null
          rating_max?: number | null
          rating_min?: number | null
          template_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          field_type?: string
          help_text?: string | null
          id?: string
          internal_key?: string
          is_required?: boolean | null
          label?: string
          max_value?: number | null
          min_value?: number | null
          name?: string | null
          options?: Json | null
          rating_max?: number | null
          rating_min?: number | null
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string
          form_data: Json
          id: string
          template_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          form_data: Json
          id?: string
          template_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          form_data?: Json
          id?: string
          template_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      form_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      form_workflows: {
        Row: {
          created_at: string
          form_template_id: string
          id: string
          updated_at: string
          user_id: string
          workflow_definition: Json | null
        }
        Insert: {
          created_at?: string
          form_template_id: string
          id?: string
          updated_at?: string
          user_id?: string
          workflow_definition?: Json | null
        }
        Update: {
          created_at?: string
          form_template_id?: string
          id?: string
          updated_at?: string
          user_id?: string
          workflow_definition?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_workflows_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: true
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      label_logs: {
        Row: {
          compliance: string | null
          created_at: string | null
          food_item_id: string | null
          id: string
          label_type: string
          printed_by: string | null
        }
        Insert: {
          compliance?: string | null
          created_at?: string | null
          food_item_id?: string | null
          id?: string
          label_type: string
          printed_by?: string | null
        }
        Update: {
          compliance?: string | null
          created_at?: string | null
          food_item_id?: string | null
          id?: string
          label_type?: string
          printed_by?: string | null
        }
        Relationships: []
      }
      sensor_events: {
        Row: {
          created_at: string | null
          event_timestamp: string
          event_type: string
          event_value: Json | null
          form_submission_id: string | null
          id: string
          raw_payload: Json | null
          sensor_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_timestamp: string
          event_type: string
          event_value?: Json | null
          form_submission_id?: string | null
          id?: string
          raw_payload?: Json | null
          sensor_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_timestamp?: string
          event_type?: string
          event_value?: Json | null
          form_submission_id?: string | null
          id?: string
          raw_payload?: Json | null
          sensor_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensor_events_form_submission_id_fkey"
            columns: ["form_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string
          form_template_id: string
          id: string
          originating_submission_id: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          form_template_id: string
          id?: string
          originating_submission_id: string
          status?: string
          title: string
          user_id?: string
        }
        Update: {
          created_at?: string
          form_template_id?: string
          id?: string
          originating_submission_id?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_form_template_id_fkey"
            columns: ["form_template_id"]
            isOneToOne: false
            referencedRelation: "form_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_originating_submission_id_fkey"
            columns: ["originating_submission_id"]
            isOneToOne: false
            referencedRelation: "form_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
