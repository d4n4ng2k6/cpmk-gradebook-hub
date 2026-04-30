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
      course_cpl: {
        Row: {
          bobot: number
          course_id: string
          cpl_id: string
          created_at: string
          id: string
        }
        Insert: {
          bobot?: number
          course_id: string
          cpl_id: string
          created_at?: string
          id?: string
        }
        Update: {
          bobot?: number
          course_id?: string
          cpl_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_cpl_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_cpl_cpl_id_fkey"
            columns: ["cpl_id"]
            isOneToOne: false
            referencedRelation: "cpl"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sub_cpmk: {
        Row: {
          course_id: string
          created_at: string
          id: string
          sub_cpmk_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          sub_cpmk_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          sub_cpmk_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sub_cpmk_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sub_cpmk_sub_cpmk_id_fkey"
            columns: ["sub_cpmk_id"]
            isOneToOne: false
            referencedRelation: "sub_cpmk"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          id: string
          jenjang: string | null
          kelas: string | null
          kode_mk: string
          lecturer_id: string
          nama_mk: string
          prodi: string | null
          prodi_id: string | null
          semester: string | null
          tahun_ajaran: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenjang?: string | null
          kelas?: string | null
          kode_mk: string
          lecturer_id: string
          nama_mk: string
          prodi?: string | null
          prodi_id?: string | null
          semester?: string | null
          tahun_ajaran?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          jenjang?: string | null
          kelas?: string | null
          kode_mk?: string
          lecturer_id?: string
          nama_mk?: string
          prodi?: string | null
          prodi_id?: string | null
          semester?: string | null
          tahun_ajaran?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
        ]
      }
      cpl: {
        Row: {
          created_at: string
          deskripsi: string
          id: string
          kode: string
          prodi_id: string
        }
        Insert: {
          created_at?: string
          deskripsi?: string
          id?: string
          kode: string
          prodi_id: string
        }
        Update: {
          created_at?: string
          deskripsi?: string
          id?: string
          kode?: string
          prodi_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpl_prodi_id_fkey"
            columns: ["prodi_id"]
            isOneToOne: false
            referencedRelation: "prodi"
            referencedColumns: ["id"]
          },
        ]
      }
      cpmk: {
        Row: {
          bobot: number
          cpl_id: string
          created_at: string
          deskripsi: string
          id: string
          kode: string
        }
        Insert: {
          bobot?: number
          cpl_id: string
          created_at?: string
          deskripsi?: string
          id?: string
          kode: string
        }
        Update: {
          bobot?: number
          cpl_id?: string
          created_at?: string
          deskripsi?: string
          id?: string
          kode?: string
        }
        Relationships: [
          {
            foreignKeyName: "cpmk_cpl_id_fkey"
            columns: ["cpl_id"]
            isOneToOne: false
            referencedRelation: "cpl"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      prodi: {
        Row: {
          created_at: string
          id: string
          jenjang: string | null
          kode: string
          nama: string
        }
        Insert: {
          created_at?: string
          id?: string
          jenjang?: string | null
          kode: string
          nama: string
        }
        Update: {
          created_at?: string
          id?: string
          jenjang?: string | null
          kode?: string
          nama?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          nidn: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          nidn?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          nidn?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          created_at: string
          id: string
          nama: string
          npm: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          npm: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          npm?: string
        }
        Relationships: []
      }
      sub_cpmk: {
        Row: {
          bobot: number
          cpmk_id: string
          created_at: string
          deskripsi: string
          id: string
          kode: string
        }
        Insert: {
          bobot?: number
          cpmk_id: string
          created_at?: string
          deskripsi?: string
          id?: string
          kode: string
        }
        Update: {
          bobot?: number
          cpmk_id?: string
          created_at?: string
          deskripsi?: string
          id?: string
          kode?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_cpmk_cpmk_id_fkey"
            columns: ["cpmk_id"]
            isOneToOne: false
            referencedRelation: "cpmk"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_cpmk_scores: {
        Row: {
          enrollment_id: string
          id: string
          nilai: number
          sub_cpmk_id: string
          updated_at: string
        }
        Insert: {
          enrollment_id: string
          id?: string
          nilai?: number
          sub_cpmk_id: string
          updated_at?: string
        }
        Update: {
          enrollment_id?: string
          id?: string
          nilai?: number
          sub_cpmk_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_cpmk_scores_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sub_cpmk_scores_sub_cpmk_id_fkey"
            columns: ["sub_cpmk_id"]
            isOneToOne: false
            referencedRelation: "sub_cpmk"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      owns_course: { Args: { _course_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "dosen"
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
      app_role: ["admin", "dosen"],
    },
  },
} as const
