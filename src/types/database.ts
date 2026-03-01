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
    PostgrestVersion: "14.4"
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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in_latitude: number | null
          check_in_longitude: number | null
          check_out_latitude: number | null
          check_out_longitude: number | null
          checked_at: string | null
          checked_out_at: string | null
          excuse_reason: string | null
          excuse_status: string | null
          id: string
          schedule_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          checked_at?: string | null
          checked_out_at?: string | null
          excuse_reason?: string | null
          excuse_status?: string | null
          id?: string
          schedule_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          check_in_latitude?: number | null
          check_in_longitude?: number | null
          check_out_latitude?: number | null
          check_out_longitude?: number | null
          checked_at?: string | null
          checked_out_at?: string | null
          excuse_reason?: string | null
          excuse_status?: string | null
          id?: string
          schedule_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_goals: {
        Row: {
          created_at: string
          created_by: string
          group_id: string
          id: string
          period: string
          target_rate: number
        }
        Insert: {
          created_at?: string
          created_by: string
          group_id: string
          id?: string
          period?: string
          target_rate: number
        }
        Update: {
          created_at?: string
          created_by?: string
          group_id?: string
          id?: string
          period?: string
          target_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "attendance_goals_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      board_categories: {
        Row: {
          created_at: string
          group_id: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "board_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      board_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          id: string
          is_hidden: boolean
          parent_id: string | null
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "board_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      board_poll_options: {
        Row: {
          id: string
          poll_id: string
          sort_order: number | null
          text: string
        }
        Insert: {
          id?: string
          poll_id: string
          sort_order?: number | null
          text: string
        }
        Update: {
          id?: string
          poll_id?: string
          sort_order?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "board_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      board_poll_votes: {
        Row: {
          id: string
          option_id: string
          user_id: string
        }
        Insert: {
          id?: string
          option_id: string
          user_id: string
        }
        Update: {
          id?: string
          option_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "board_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      board_polls: {
        Row: {
          allow_multiple: boolean | null
          ends_at: string | null
          id: string
          post_id: string
        }
        Insert: {
          allow_multiple?: boolean | null
          ends_at?: string | null
          id?: string
          post_id: string
        }
        Update: {
          allow_multiple?: boolean | null
          ends_at?: string | null
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_polls_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: true
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      board_post_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          post_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          post_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_post_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      board_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      board_post_revisions: {
        Row: {
          content: string
          id: string
          post_id: string
          revised_at: string | null
          revised_by: string | null
          title: string
        }
        Insert: {
          content: string
          id?: string
          post_id: string
          revised_at?: string | null
          revised_by?: string | null
          title: string
        }
        Update: {
          content?: string
          id?: string
          post_id?: string
          revised_at?: string | null
          revised_by?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_post_revisions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      board_posts: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string | null
          deleted_at: string | null
          group_id: string
          id: string
          is_pinned: boolean | null
          pinned_at: string | null
          pinned_by: string | null
          project_id: string | null
          published_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          group_id: string
          id?: string
          is_pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          project_id?: string | null
          published_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          group_id?: string
          id?: string
          is_pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          project_id?: string | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "board_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "board_posts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_verifications: {
        Row: {
          group_id: string
          id: string
          requested_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          group_id: string
          id?: string
          requested_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          group_id?: string
          id?: string
          requested_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_verifications_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          created_at: string
          description: string | null
          group_id: string
          id: string
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          target_id: string
          target_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id: string
          target_type: string
        }
        Update: {
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_reports_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_features: {
        Row: {
          enabled: boolean
          entity_id: string
          entity_type: string
          feature: string
          id: string
          independent: boolean
        }
        Insert: {
          enabled?: boolean
          entity_id: string
          entity_type: string
          feature: string
          id?: string
          independent?: boolean
        }
        Update: {
          enabled?: boolean
          entity_id?: string
          entity_type?: string
          feature?: string
          id?: string
          independent?: boolean
        }
        Relationships: []
      }
      entity_permissions: {
        Row: {
          entity_id: string
          entity_type: string
          granted_at: string | null
          granted_by: string | null
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          entity_id: string
          entity_type: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          entity_id?: string
          entity_type?: string
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entity_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entity_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entity_settings: {
        Row: {
          entity_id: string
          entity_type: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          entity_id: string
          entity_type: string
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          entity_id?: string
          entity_type?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      finance_budgets: {
        Row: {
          budget_expense: number
          budget_income: number
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          updated_at: string
          year_month: string
        }
        Insert: {
          budget_expense?: number
          budget_income?: number
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          updated_at?: string
          year_month: string
        }
        Update: {
          budget_expense?: number
          budget_income?: number
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          updated_at?: string
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_budgets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          created_at: string | null
          fee_rate: number
          group_id: string
          id: string
          name: string
          project_id: string | null
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          fee_rate?: number
          group_id: string
          id?: string
          name: string
          project_id?: string | null
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          fee_rate?: number
          group_id?: string
          id?: string
          name?: string
          project_id?: string | null
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_categories_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_split_members: {
        Row: {
          amount: number
          id: string
          is_settled: boolean
          settled_at: string | null
          split_id: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          is_settled?: boolean
          settled_at?: string | null
          split_id: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          is_settled?: boolean
          settled_at?: string | null
          split_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_split_members_split_id_fkey"
            columns: ["split_id"]
            isOneToOne: false
            referencedRelation: "finance_splits"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_splits: {
        Row: {
          created_at: string
          group_id: string
          id: string
          paid_by: string
          project_id: string | null
          settled_at: string | null
          split_type: string
          title: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          paid_by: string
          project_id?: string | null
          settled_at?: string | null
          split_type?: string
          title: string
          total_amount: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          paid_by?: string
          project_id?: string | null
          settled_at?: string | null
          split_type?: string
          title?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "finance_splits_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_splits_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          group_id: string
          id: string
          paid_by: string | null
          project_id: string | null
          title: string
          transaction_date: string
          type: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id: string
          id?: string
          paid_by?: string | null
          project_id?: string | null
          title: string
          transaction_date?: string
          type: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          group_id?: string
          id?: string
          paid_by?: string | null
          project_id?: string | null
          title?: string
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_challenges: {
        Row: {
          created_at: string | null
          created_by: string
          description: string | null
          ends_at: string
          group_id: string
          id: string
          is_achieved: boolean | null
          starts_at: string
          target_rate: number
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description?: string | null
          ends_at: string
          group_id: string
          id?: string
          is_achieved?: boolean | null
          starts_at: string
          target_rate?: number
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string | null
          ends_at?: string
          group_id?: string
          id?: string
          is_achieved?: boolean | null
          starts_at?: string
          target_rate?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_challenges_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          category_id: string | null
          dashboard_settings: Json | null
          group_id: string | null
          id: string
          joined_at: string | null
          nickname: string | null
          role: string
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          dashboard_settings?: Json | null
          group_id?: string | null
          id?: string
          joined_at?: string | null
          nickname?: string | null
          role?: string
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          dashboard_settings?: Json | null
          group_id?: string | null
          id?: string
          joined_at?: string | null
          nickname?: string | null
          role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "member_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      group_payment_methods: {
        Row: {
          account_holder: string | null
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          created_by: string | null
          group_id: string
          id: string
          is_active: boolean
          kakao_link: string | null
          label: string
          sort_order: number
          toss_id: string | null
          type: string
        }
        Insert: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id: string
          id?: string
          is_active?: boolean
          kakao_link?: string | null
          label: string
          sort_order?: number
          toss_id?: string | null
          type: string
        }
        Update: {
          account_holder?: string | null
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          created_by?: string | null
          group_id?: string
          id?: string
          is_active?: boolean
          kakao_link?: string | null
          label?: string
          sort_order?: number
          toss_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_payment_methods_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          dance_genre: string[] | null
          description: string | null
          group_type: string
          id: string
          invite_code: string | null
          invite_code_enabled: boolean | null
          invite_code_expires_at: string | null
          join_policy: string
          max_members: number | null
          name: string
          parent_group_id: string | null
          visibility: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          dance_genre?: string[] | null
          description?: string | null
          group_type?: string
          id?: string
          invite_code?: string | null
          invite_code_enabled?: boolean | null
          invite_code_expires_at?: string | null
          join_policy?: string
          max_members?: number | null
          name: string
          parent_group_id?: string | null
          visibility?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          dance_genre?: string[] | null
          description?: string | null
          group_type?: string
          id?: string
          invite_code?: string | null
          invite_code_enabled?: boolean | null
          invite_code_expires_at?: string | null
          join_policy?: string
          max_members?: number | null
          name?: string
          parent_group_id?: string | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_parent_group_id_fkey"
            columns: ["parent_group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      join_requests: {
        Row: {
          group_id: string
          id: string
          requested_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          requested_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "join_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "join_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_minutes: {
        Row: {
          action_items: Json
          attendees: string[]
          content: string | null
          created_at: string
          created_by: string
          decisions: string[]
          group_id: string
          id: string
          meeting_date: string
          project_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          action_items?: Json
          attendees?: string[]
          content?: string | null
          created_at?: string
          created_by: string
          decisions?: string[]
          group_id: string
          id?: string
          meeting_date?: string
          project_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          action_items?: Json
          attendees?: string[]
          content?: string | null
          created_at?: string
          created_by?: string
          decisions?: string[]
          group_id?: string
          id?: string
          meeting_date?: string
          project_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_minutes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_minutes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      member_categories: {
        Row: {
          color: string | null
          created_at: string | null
          group_id: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          group_id: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          group_id?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "member_categories_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      member_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          group_id: string
          id: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          group_id: string
          id?: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          group_id?: string
          id?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_notes_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      member_skills: {
        Row: {
          group_id: string
          id: string
          skill_level: number
          skill_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          skill_level?: number
          skill_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          skill_level?: number
          skill_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_skills_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          read_at: string | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_records: {
        Row: {
          audience_count: number | null
          created_at: string | null
          created_by: string
          event_date: string
          event_name: string
          event_type: string
          group_id: string
          id: string
          notes: string | null
          project_id: string | null
          ranking: string | null
          result: string | null
          venue: string | null
        }
        Insert: {
          audience_count?: number | null
          created_at?: string | null
          created_by: string
          event_date: string
          event_name: string
          event_type?: string
          group_id: string
          id?: string
          notes?: string | null
          project_id?: string | null
          ranking?: string | null
          result?: string | null
          venue?: string | null
        }
        Update: {
          audience_count?: number | null
          created_at?: string | null
          created_by?: string
          event_date?: string
          event_name?: string
          event_type?: string
          group_id?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          ranking?: string | null
          result?: string | null
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_records_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_audits: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          description: string | null
          group_id: string
          id: string
          new_value: string | null
          old_value: string | null
          target_user_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          description?: string | null
          group_id: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          target_user_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          description?: string | null
          group_id?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          target_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_audits_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      post_bookmarks: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_bookmarks_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_read_status: {
        Row: {
          post_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          post_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          post_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_read_status_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "board_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_videos: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          platform: string
          project_id: string | null
          schedule_id: string | null
          song_id: string | null
          tags: string[] | null
          title: string
          uploaded_by: string
          url: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          platform?: string
          project_id?: string | null
          schedule_id?: string | null
          song_id?: string | null
          tags?: string[] | null
          title?: string
          uploaded_by: string
          url: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          platform?: string
          project_id?: string | null
          schedule_id?: string | null
          song_id?: string | null
          tags?: string[] | null
          title?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_videos_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_videos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_videos_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "practice_videos_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "project_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_region: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          dance_genre: string[] | null
          dance_genre_start_dates: Json | null
          id: string
          instagram: string | null
          name: string
          phone: string | null
          privacy_settings: Json | null
          team_privacy: Json | null
          updated_at: string | null
          youtube: string | null
        }
        Insert: {
          active_region?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          dance_genre?: string[] | null
          dance_genre_start_dates?: Json | null
          id: string
          instagram?: string | null
          name: string
          phone?: string | null
          privacy_settings?: Json | null
          team_privacy?: Json | null
          updated_at?: string | null
          youtube?: string | null
        }
        Update: {
          active_region?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          dance_genre?: string[] | null
          dance_genre_start_dates?: Json | null
          id?: string
          instagram?: string | null
          name?: string
          phone?: string | null
          privacy_settings?: Json | null
          team_privacy?: Json | null
          updated_at?: string | null
          youtube?: string | null
        }
        Relationships: []
      }
      project_members: {
        Row: {
          dashboard_settings: Json | null
          id: string
          joined_at: string | null
          project_id: string
          role: string | null
          user_id: string
        }
        Insert: {
          dashboard_settings?: Json | null
          id?: string
          joined_at?: string | null
          project_id: string
          role?: string | null
          user_id: string
        }
        Update: {
          dashboard_settings?: Json | null
          id?: string
          joined_at?: string | null
          project_id?: string
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_shared_groups: {
        Row: {
          group_id: string
          project_id: string
          shared_at: string | null
          shared_by: string | null
        }
        Insert: {
          group_id: string
          project_id: string
          shared_at?: string | null
          shared_by?: string | null
        }
        Update: {
          group_id?: string
          project_id?: string
          shared_at?: string | null
          shared_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_shared_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shared_groups_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_shared_groups_shared_by_fkey"
            columns: ["shared_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      project_songs: {
        Row: {
          artist: string | null
          created_at: string | null
          created_by: string
          id: string
          project_id: string
          sort_order: number | null
          spotify_url: string | null
          status: string
          title: string
          youtube_url: string | null
        }
        Insert: {
          artist?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          project_id: string
          sort_order?: number | null
          spotify_url?: string | null
          status?: string
          title: string
          youtube_url?: string | null
        }
        Update: {
          artist?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          project_id?: string
          sort_order?: number | null
          spotify_url?: string | null
          status?: string
          title?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_songs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tasks: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          created_by: string
          due_date: string | null
          id: string
          project_id: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          created_by: string
          due_date?: string | null
          id?: string
          project_id: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string
          due_date?: string | null
          id?: string
          project_id?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          group_id: string
          id: string
          name: string
          start_date: string | null
          status: string | null
          type: string | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          group_id: string
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          group_id?: string
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_share_tokens: {
        Row: {
          created_at: string | null
          created_by: string
          expires_at: string
          id: string
          token: string
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          expires_at: string
          id?: string
          token: string
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          expires_at?: string
          id?: string
          token?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_share_tokens_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_carpool_offers: {
        Row: {
          created_at: string | null
          departure_location: string | null
          departure_time: string | null
          driver_id: string
          id: string
          notes: string | null
          schedule_id: string
          total_seats: number
        }
        Insert: {
          created_at?: string | null
          departure_location?: string | null
          departure_time?: string | null
          driver_id: string
          id?: string
          notes?: string | null
          schedule_id: string
          total_seats?: number
        }
        Update: {
          created_at?: string | null
          departure_location?: string | null
          departure_time?: string | null
          driver_id?: string
          id?: string
          notes?: string | null
          schedule_id?: string
          total_seats?: number
        }
        Relationships: [
          {
            foreignKeyName: "schedule_carpool_offers_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_carpool_requests: {
        Row: {
          created_at: string | null
          id: string
          offer_id: string
          passenger_id: string
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          offer_id: string
          passenger_id: string
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          offer_id?: string
          passenger_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_carpool_requests_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "schedule_carpool_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_checkin_codes: {
        Row: {
          code: string
          created_at: string | null
          created_by: string
          expires_at: string
          id: string
          schedule_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          created_by: string
          expires_at: string
          id?: string
          schedule_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          created_by?: string
          expires_at?: string
          id?: string
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_checkin_codes_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_checklist_items: {
        Row: {
          assignee_id: string | null
          created_at: string | null
          created_by: string
          id: string
          is_done: boolean | null
          schedule_id: string
          sort_order: number | null
          title: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          is_done?: boolean | null
          schedule_id: string
          sort_order?: number | null
          title: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          is_done?: boolean | null
          schedule_id?: string
          sort_order?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_checklist_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_feedback: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string
          rating: number
          schedule_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating: number
          schedule_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string
          rating?: number
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_feedback_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_roles: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          role_name: string
          schedule_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          role_name: string
          schedule_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          role_name?: string
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_roles_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_rsvp: {
        Row: {
          created_at: string
          id: string
          response: string
          schedule_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          response: string
          schedule_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          response?: string
          schedule_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_rsvp_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_rsvp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          entity_id: string
          entity_type: string
          id: string
          location: string | null
          name: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          entity_id: string
          entity_type: string
          id?: string
          location?: string | null
          name: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          entity_id?: string
          entity_type?: string
          id?: string
          location?: string | null
          name?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_waitlist: {
        Row: {
          id: string
          joined_at: string | null
          position: number
          schedule_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          position: number
          schedule_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          position?: number
          schedule_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_waitlist_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          address: string | null
          attendance_deadline: string | null
          attendance_method: string
          created_by: string | null
          description: string | null
          ends_at: string
          group_id: string | null
          id: string
          late_threshold: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          max_attendees: number | null
          project_id: string | null
          recurrence_id: string | null
          require_checkout: boolean
          starts_at: string
          title: string
        }
        Insert: {
          address?: string | null
          attendance_deadline?: string | null
          attendance_method?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          group_id?: string | null
          id?: string
          late_threshold?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          max_attendees?: number | null
          project_id?: string | null
          recurrence_id?: string | null
          require_checkout?: boolean
          starts_at: string
          title: string
        }
        Update: {
          address?: string | null
          attendance_deadline?: string | null
          attendance_method?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          group_id?: string | null
          id?: string
          late_threshold?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          max_attendees?: number | null
          project_id?: string | null
          recurrence_id?: string | null
          require_checkout?: boolean
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_request_members: {
        Row: {
          confirmed_at: string | null
          id: string
          paid_at: string | null
          request_id: string
          status: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          id?: string
          paid_at?: string | null
          request_id: string
          status?: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          id?: string
          paid_at?: string | null
          request_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_request_members_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "settlement_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      settlement_requests: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          due_date: string | null
          group_id: string
          id: string
          memo: string | null
          payment_method_id: string | null
          status: string
          title: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          group_id: string
          id?: string
          memo?: string | null
          payment_method_id?: string | null
          status?: string
          title: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          due_date?: string | null
          group_id?: string
          id?: string
          memo?: string | null
          payment_method_id?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_requests_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "settlement_requests_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "group_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      song_notes: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          id: string
          song_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          id?: string
          song_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          id?: string
          song_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_notes_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "project_songs"
            referencedColumns: ["id"]
          },
        ]
      }
      song_parts: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          notes: string | null
          part_name: string
          part_type: string
          song_id: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          notes?: string | null
          part_name: string
          part_type?: string
          song_id: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          notes?: string | null
          part_name?: string
          part_type?: string
          song_id?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_parts_song_id_fkey"
            columns: ["song_id"]
            isOneToOne: false
            referencedRelation: "project_songs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_entity: {
        Args: { p_id: string; p_type: string }
        Returns: boolean
      }
      can_access_post: {
        Args: { p_group_id: string; p_project_id: string }
        Returns: boolean
      }
      can_access_project: { Args: { pid: string }; Returns: boolean }
      can_edit_entity: {
        Args: { p_id: string; p_type: string }
        Returns: boolean
      }
      can_manage_finance: { Args: { gid: string }; Returns: boolean }
      can_manage_finance_v2: {
        Args: { p_id: string; p_type: string }
        Returns: boolean
      }
      can_manage_projects: { Args: { gid: string }; Returns: boolean }
      can_manage_projects_v2: { Args: { gid: string }; Returns: boolean }
      can_view_finance: { Args: { gid: string }; Returns: boolean }
      can_view_finance_v2: {
        Args: { p_id: string; p_type: string }
        Returns: boolean
      }
      create_group_with_leader:
        | {
            Args: { group_description?: string; group_name: string }
            Returns: string
          }
        | {
            Args: {
              group_description?: string
              group_name: string
              group_type?: string
              p_dance_genre?: string[]
              p_join_policy?: string
              p_max_members?: number
              p_visibility?: string
              parent_group_id?: string
            }
            Returns: string
          }
      create_project: {
        Args: {
          p_description?: string
          p_enabled_features?: string[]
          p_end_date?: string
          p_group_id: string
          p_name: string
          p_start_date?: string
          p_type?: string
          p_visibility?: string
        }
        Returns: string
      }
      create_settlement_request_with_notifications: {
        Args: {
          p_amount: number
          p_due_date?: string
          p_group_id: string
          p_member_ids: string[]
          p_memo?: string
          p_payment_method_id?: string
          p_title: string
        }
        Returns: string
      }
      get_all_independent_project_ids: {
        Args: { p_group_id: string }
        Returns: {
          entity_id: string
          feature: string
        }[]
      }
      get_ancestor_group_ids: { Args: { gid: string }; Returns: string[] }
      get_conversations: {
        Args: never
        Returns: {
          last_message: string
          last_message_at: string
          partner_avatar_url: string
          partner_id: string
          partner_name: string
          unread_count: number
        }[]
      }
      get_entity_features: {
        Args: { p_id: string; p_type: string }
        Returns: {
          enabled: boolean
          feature: string
          independent: boolean
        }[]
      }
      get_group_ancestors: {
        Args: { gid: string }
        Returns: {
          depth: number
          id: string
          name: string
        }[]
      }
      get_group_children: {
        Args: { p_group_id: string }
        Returns: {
          description: string
          group_type: string
          id: string
          member_count: number
          name: string
          visibility: string
        }[]
      }
      get_group_depth: { Args: { gid: string }; Returns: number }
      get_group_projects: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: {
          created_at: string
          created_by: string
          description: string
          enabled_features: string[]
          end_date: string
          group_id: string
          id: string
          is_shared: boolean
          member_count: number
          name: string
          start_date: string
          status: string
          type: string
          updated_at: string
          visibility: string
        }[]
      }
      get_independent_entity_ids: {
        Args: { p_feature: string; p_group_id: string }
        Returns: {
          entity_id: string
          entity_type: string
        }[]
      }
      get_poll_options_with_votes: {
        Args: { p_poll_id: string; p_user_id: string }
        Returns: {
          id: string
          poll_id: string
          sort_order: number
          text: string
          vote_count: number
          voted_by_me: boolean
        }[]
      }
      get_public_groups: {
        Args: { p_genre?: string; p_search?: string }
        Returns: {
          avatar_url: string
          created_at: string
          created_by: string
          dance_genre: string[]
          description: string
          group_type: string
          id: string
          join_policy: string
          max_members: number
          member_count: number
          name: string
          parent_group_id: string
          visibility: string
        }[]
      }
      get_public_projects: {
        Args: { p_search?: string }
        Returns: {
          created_at: string
          description: string
          group_id: string
          group_name: string
          id: string
          member_count: number
          name: string
          status: string
          type: string
          visibility: string
        }[]
      }
      get_suggested_follows: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          dance_genre: string[]
          id: string
          name: string
          shared_group_count: number
        }[]
      }
      get_unread_message_count: { Args: never; Returns: number }
      get_user_attendance_stats: {
        Args: { p_user_id: string }
        Returns: {
          absent_count: number
          early_leave_count: number
          group_id: string
          group_name: string
          late_count: number
          present_count: number
          total_schedules: number
        }[]
      }
      get_user_group_context: { Args: { p_group_id: string }; Returns: Json }
      get_user_groups: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          created_by: string
          dance_genre: string[]
          description: string
          group_type: string
          id: string
          invite_code: string
          join_policy: string
          max_members: number
          member_count: number
          my_role: string
          name: string
          parent_group_id: string
          visibility: string
        }[]
      }
      get_user_permissions: {
        Args: { p_id: string; p_type: string }
        Returns: {
          granted_at: string
          permission: string
        }[]
      }
      has_entity_permission: {
        Args: { p_id: string; p_perm: string; p_type: string }
        Returns: boolean
      }
      is_following: {
        Args: { p_follower: string; p_target: string }
        Returns: boolean
      }
      is_group_leader: { Args: { gid: string }; Returns: boolean }
      is_group_leader_or_sub_leader: { Args: { gid: string }; Returns: boolean }
      is_group_member: { Args: { gid: string }; Returns: boolean }
      is_mutual_follow: {
        Args: { user_a: string; user_b: string }
        Returns: boolean
      }
      is_project_leader: { Args: { pid: string }; Returns: boolean }
      is_project_member: { Args: { pid: string }; Returns: boolean }
      remind_settlement_request: {
        Args: { p_request_id: string }
        Returns: number
      }
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
    Enums: {},
  },
} as const
