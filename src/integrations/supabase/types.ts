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
      ads: {
        Row: {
          ad_format: string | null
          ad_type: string
          adsense_code: string | null
          auto_play: boolean | null
          clicks: number | null
          created_at: string
          description: string | null
          device: string | null
          end_date: string | null
          id: string
          image_type: string | null
          image_url: string | null
          impressions: number | null
          is_active: boolean | null
          link_url: string | null
          midroll_time_seconds: number | null
          placement: string
          rotation_interval_seconds: number | null
          show_close_button: boolean | null
          skip_after_seconds: number | null
          start_date: string
          title: string
          updated_at: string
          video_type: string | null
          video_url: string | null
        }
        Insert: {
          ad_format?: string | null
          ad_type?: string
          adsense_code?: string | null
          auto_play?: boolean | null
          clicks?: number | null
          created_at?: string
          description?: string | null
          device?: string | null
          end_date?: string | null
          id?: string
          image_type?: string | null
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          link_url?: string | null
          midroll_time_seconds?: number | null
          placement: string
          rotation_interval_seconds?: number | null
          show_close_button?: boolean | null
          skip_after_seconds?: number | null
          start_date?: string
          title: string
          updated_at?: string
          video_type?: string | null
          video_url?: string | null
        }
        Update: {
          ad_format?: string | null
          ad_type?: string
          adsense_code?: string | null
          auto_play?: boolean | null
          clicks?: number | null
          created_at?: string
          description?: string | null
          device?: string | null
          end_date?: string | null
          id?: string
          image_type?: string | null
          image_url?: string | null
          impressions?: number | null
          is_active?: boolean | null
          link_url?: string | null
          midroll_time_seconds?: number | null
          placement?: string
          rotation_interval_seconds?: number | null
          show_close_button?: boolean | null
          skip_after_seconds?: number | null
          start_date?: string
          title?: string
          updated_at?: string
          video_type?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      anime_characters: {
        Row: {
          age: string | null
          anilist_id: number | null
          anime_id: string
          birth_date: string | null
          created_at: string
          description: string | null
          gender: string | null
          id: string
          image_url: string | null
          mal_id: number | null
          name: string
          name_alternative: string[] | null
          name_native: string | null
          order_index: number | null
          role: string
          updated_at: string
        }
        Insert: {
          age?: string | null
          anilist_id?: number | null
          anime_id: string
          birth_date?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          mal_id?: number | null
          name: string
          name_alternative?: string[] | null
          name_native?: string | null
          order_index?: number | null
          role: string
          updated_at?: string
        }
        Update: {
          age?: string | null
          anilist_id?: number | null
          anime_id?: string
          birth_date?: string | null
          created_at?: string
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          mal_id?: number | null
          name?: string
          name_alternative?: string[] | null
          name_native?: string | null
          order_index?: number | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "anime_characters_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "animes"
            referencedColumns: ["id"]
          },
        ]
      }
      animes: {
        Row: {
          access: string
          anilist_id: string | null
          backdrop_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          episodes_count: number | null
          exclude_from_plan: boolean | null
          genre: string | null
          id: string
          mal_id: string | null
          pinned: boolean
          rating: number | null
          release_year: number | null
          rental_max_devices: number | null
          rental_period_days: number | null
          rental_price: number | null
          source_material: string | null
          status: string
          studio: string | null
          thumbnail: string | null
          title: string
          tmdb_id: string | null
          trailer_url: string | null
          type: string
          updated_at: string
          version: string | null
          video_sources: Json | null
          views: number
        }
        Insert: {
          access?: string
          anilist_id?: string | null
          backdrop_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          episodes_count?: number | null
          exclude_from_plan?: boolean | null
          genre?: string | null
          id?: string
          mal_id?: string | null
          pinned?: boolean
          rating?: number | null
          release_year?: number | null
          rental_max_devices?: number | null
          rental_period_days?: number | null
          rental_price?: number | null
          source_material?: string | null
          status?: string
          studio?: string | null
          thumbnail?: string | null
          title: string
          tmdb_id?: string | null
          trailer_url?: string | null
          type: string
          updated_at?: string
          version?: string | null
          video_sources?: Json | null
          views?: number
        }
        Update: {
          access?: string
          anilist_id?: string | null
          backdrop_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          episodes_count?: number | null
          exclude_from_plan?: boolean | null
          genre?: string | null
          id?: string
          mal_id?: string | null
          pinned?: boolean
          rating?: number | null
          release_year?: number | null
          rental_max_devices?: number | null
          rental_period_days?: number | null
          rental_price?: number | null
          source_material?: string | null
          status?: string
          studio?: string | null
          thumbnail?: string | null
          title?: string
          tmdb_id?: string | null
          trailer_url?: string | null
          type?: string
          updated_at?: string
          version?: string | null
          video_sources?: Json | null
          views?: number
        }
        Relationships: []
      }
      character_voice_actors: {
        Row: {
          character_id: string
          created_at: string
          id: string
          voice_actor_id: string
        }
        Insert: {
          character_id: string
          created_at?: string
          id?: string
          voice_actor_id: string
        }
        Update: {
          character_id?: string
          created_at?: string
          id?: string
          voice_actor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_voice_actors_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "anime_characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "character_voice_actors_voice_actor_id_fkey"
            columns: ["voice_actor_id"]
            isOneToOne: false
            referencedRelation: "voice_actors"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          media_id: string
          media_type: string
          order_index: number | null
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          media_id: string
          media_type: string
          order_index?: number | null
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          media_id?: string
          media_type?: string
          order_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          backdrop_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          poster_url: string | null
          tmdb_id: number | null
          updated_at: string
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          poster_url?: string | null
          tmdb_id?: number | null
          updated_at?: string
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          poster_url?: string | null
          tmdb_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          episode_id: string | null
          id: string
          is_deleted: boolean
          is_edited: boolean
          movie_id: string | null
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          episode_id?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          movie_id?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          episode_id?: string | null
          id?: string
          is_deleted?: boolean
          is_edited?: boolean
          movie_id?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          updated_at: string
          used_count: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          updated_at?: string
          used_count?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      episodes: {
        Row: {
          access: Database["public"]["Enums"]["access_type"] | null
          air_date: string | null
          created_at: string
          episode_number: number
          id: string
          name: string
          overview: string | null
          runtime: number | null
          season_id: string
          server_url: string | null
          still_path: string | null
          trailer_url: string | null
          updated_at: string
          video_sources: Json | null
          video_url: string | null
        }
        Insert: {
          access?: Database["public"]["Enums"]["access_type"] | null
          air_date?: string | null
          created_at?: string
          episode_number: number
          id?: string
          name: string
          overview?: string | null
          runtime?: number | null
          season_id: string
          server_url?: string | null
          still_path?: string | null
          trailer_url?: string | null
          updated_at?: string
          video_sources?: Json | null
          video_url?: string | null
        }
        Update: {
          access?: Database["public"]["Enums"]["access_type"] | null
          air_date?: string | null
          created_at?: string
          episode_number?: number
          id?: string
          name?: string
          overview?: string | null
          runtime?: number | null
          season_id?: string
          server_url?: string | null
          still_path?: string | null
          trailer_url?: string | null
          updated_at?: string
          video_sources?: Json | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "episodes_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_content: {
        Row: {
          created_at: string
          display_order: number
          id: string
          media_id: string
          media_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          media_id: string
          media_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          media_id?: string
          media_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      genres: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tmdb_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tmdb_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          created_at: string
          english_name: string | null
          id: string
          iso_639_1: string
          name: string
          tmdb_data: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          english_name?: string | null
          id?: string
          iso_639_1: string
          name: string
          tmdb_data?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          english_name?: string | null
          id?: string
          iso_639_1?: string
          name?: string
          tmdb_data?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      media_files: {
        Row: {
          bucket_name: string
          content_type: string | null
          created_at: string | null
          file_category: string | null
          file_path: string
          file_size: number | null
          id: string
          storage_account: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bucket_name?: string
          content_type?: string | null
          created_at?: string | null
          file_category?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          storage_account: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bucket_name?: string
          content_type?: string | null
          created_at?: string | null
          file_category?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          storage_account?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      movie_cast: {
        Row: {
          actor_name: string
          character_name: string | null
          created_at: string | null
          id: string
          movie_id: string | null
          order_index: number | null
          profile_url: string | null
          tmdb_id: number | null
        }
        Insert: {
          actor_name: string
          character_name?: string | null
          created_at?: string | null
          id?: string
          movie_id?: string | null
          order_index?: number | null
          profile_url?: string | null
          tmdb_id?: number | null
        }
        Update: {
          actor_name?: string
          character_name?: string | null
          created_at?: string | null
          id?: string
          movie_id?: string | null
          order_index?: number | null
          profile_url?: string | null
          tmdb_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movie_cast_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
      }
      movies: {
        Row: {
          access: Database["public"]["Enums"]["access_type"]
          backdrop_url: string | null
          created_at: string | null
          created_by: string | null
          description: string
          exclude_from_plan: boolean | null
          genre: string
          id: string
          imdb_id: string | null
          pinned: boolean
          price: number | null
          rating: number
          release_year: number
          rental_max_devices: number | null
          rental_period_days: number | null
          rental_price: number | null
          status: string
          thumbnail: string
          title: string
          tmdb_id: string | null
          trailer_url: string | null
          type: Database["public"]["Enums"]["media_type"]
          updated_at: string | null
          version: string | null
          video_sources: Json | null
          video_url: string | null
          views: number
        }
        Insert: {
          access: Database["public"]["Enums"]["access_type"]
          backdrop_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          exclude_from_plan?: boolean | null
          genre: string
          id?: string
          imdb_id?: string | null
          pinned?: boolean
          price?: number | null
          rating: number
          release_year: number
          rental_max_devices?: number | null
          rental_period_days?: number | null
          rental_price?: number | null
          status?: string
          thumbnail: string
          title: string
          tmdb_id?: string | null
          trailer_url?: string | null
          type: Database["public"]["Enums"]["media_type"]
          updated_at?: string | null
          version?: string | null
          video_sources?: Json | null
          video_url?: string | null
          views?: number
        }
        Update: {
          access?: Database["public"]["Enums"]["access_type"]
          backdrop_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          exclude_from_plan?: boolean | null
          genre?: string
          id?: string
          imdb_id?: string | null
          pinned?: boolean
          price?: number | null
          rating?: number
          release_year?: number
          rental_max_devices?: number | null
          rental_period_days?: number | null
          rental_price?: number | null
          status?: string
          thumbnail?: string
          title?: string
          tmdb_id?: string | null
          trailer_url?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          updated_at?: string | null
          version?: string | null
          video_sources?: Json | null
          video_url?: string | null
          views?: number
        }
        Relationships: []
      }
      networks: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          origin_country: string | null
          tmdb_id: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          origin_country?: string | null
          tmdb_id?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          origin_country?: string | null
          tmdb_id?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          khqr_data: Json | null
          metadata: Json | null
          payment_method: string
          payment_status: string
          reference_id: string | null
          reference_type: string | null
          transaction_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          khqr_data?: Json | null
          metadata?: Json | null
          payment_method?: string
          payment_status?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          khqr_data?: Json | null
          metadata?: Json | null
          payment_method?: string
          payment_status?: string
          reference_id?: string | null
          reference_type?: string | null
          transaction_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          cover_picture_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          location: string | null
          profile_picture_url: string | null
          social_links: Json | null
          updated_at: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          cover_picture_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          location?: string | null
          profile_picture_url?: string | null
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          cover_picture_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          location?: string | null
          profile_picture_url?: string | null
          social_links?: Json | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          id: string
          notified: boolean
          release_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified?: boolean
          release_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified?: boolean
          release_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "upcoming_releases"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          air_date: string | null
          created_at: string
          episode_count: number
          id: string
          media_id: string
          name: string
          overview: string | null
          poster_path: string | null
          season_number: number
          updated_at: string
        }
        Insert: {
          air_date?: string | null
          created_at?: string
          episode_count?: number
          id?: string
          media_id: string
          name: string
          overview?: string | null
          poster_path?: string | null
          season_number: number
          updated_at?: string
        }
        Update: {
          air_date?: string | null
          created_at?: string
          episode_count?: number
          id?: string
          media_id?: string
          name?: string
          overview?: string | null
          poster_path?: string | null
          season_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seasons_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series: {
        Row: {
          access: Database["public"]["Enums"]["access_type"]
          backdrop_url: string | null
          created_at: string | null
          created_by: string | null
          description: string
          episode_run_time: number[] | null
          exclude_from_plan: boolean | null
          first_air_date: string | null
          genre: string
          id: string
          imdb_id: string | null
          last_air_date: string | null
          number_of_episodes: number | null
          number_of_seasons: number | null
          original_language: string | null
          overview: string | null
          pinned: boolean
          popularity: number | null
          poster_url: string | null
          price: number | null
          rating: number
          release_year: number
          rental_max_devices: number | null
          rental_period_days: number | null
          rental_price: number | null
          status: string
          thumbnail: string
          title: string
          tmdb_id: string | null
          trailer_url: string | null
          type: Database["public"]["Enums"]["media_type"]
          updated_at: string | null
          version: string | null
          views: number
          vote_count: number | null
        }
        Insert: {
          access: Database["public"]["Enums"]["access_type"]
          backdrop_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description: string
          episode_run_time?: number[] | null
          exclude_from_plan?: boolean | null
          first_air_date?: string | null
          genre: string
          id?: string
          imdb_id?: string | null
          last_air_date?: string | null
          number_of_episodes?: number | null
          number_of_seasons?: number | null
          original_language?: string | null
          overview?: string | null
          pinned?: boolean
          popularity?: number | null
          poster_url?: string | null
          price?: number | null
          rating: number
          release_year: number
          rental_max_devices?: number | null
          rental_period_days?: number | null
          rental_price?: number | null
          status?: string
          thumbnail: string
          title: string
          tmdb_id?: string | null
          trailer_url?: string | null
          type: Database["public"]["Enums"]["media_type"]
          updated_at?: string | null
          version?: string | null
          views?: number
          vote_count?: number | null
        }
        Update: {
          access?: Database["public"]["Enums"]["access_type"]
          backdrop_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string
          episode_run_time?: number[] | null
          exclude_from_plan?: boolean | null
          first_air_date?: string | null
          genre?: string
          id?: string
          imdb_id?: string | null
          last_air_date?: string | null
          number_of_episodes?: number | null
          number_of_seasons?: number | null
          original_language?: string | null
          overview?: string | null
          pinned?: boolean
          popularity?: number | null
          poster_url?: string | null
          price?: number | null
          rating?: number
          release_year?: number
          rental_max_devices?: number | null
          rental_period_days?: number | null
          rental_price?: number | null
          status?: string
          thumbnail?: string
          title?: string
          tmdb_id?: string | null
          trailer_url?: string | null
          type?: Database["public"]["Enums"]["media_type"]
          updated_at?: string | null
          version?: string | null
          views?: number
          vote_count?: number | null
        }
        Relationships: []
      }
      series_cast: {
        Row: {
          actor_name: string
          character_name: string | null
          created_at: string | null
          id: string
          order_index: number | null
          profile_url: string | null
          series_id: string | null
          tmdb_id: number | null
        }
        Insert: {
          actor_name: string
          character_name?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          profile_url?: string | null
          series_id?: string | null
          tmdb_id?: number | null
        }
        Update: {
          actor_name?: string
          character_name?: string | null
          created_at?: string | null
          id?: string
          order_index?: number | null
          profile_url?: string | null
          series_id?: string | null
          tmdb_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "series_cast_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series_genres: {
        Row: {
          created_at: string | null
          genre_id: number
          genre_name: string
          id: string
          series_id: string | null
        }
        Insert: {
          created_at?: string | null
          genre_id: number
          genre_name: string
          id?: string
          series_id?: string | null
        }
        Update: {
          created_at?: string | null
          genre_id?: number
          genre_name?: string
          id?: string
          series_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_genres_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      series_producers: {
        Row: {
          company_name: string
          created_at: string | null
          id: string
          logo_url: string | null
          series_id: string | null
        }
        Insert: {
          company_name: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          series_id?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          id?: string
          logo_url?: string | null
          series_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "series_producers_series_id_fkey"
            columns: ["series_id"]
            isOneToOne: false
            referencedRelation: "series"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      streaming_channels: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          stream_url: string
          thumbnail_url: string | null
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          stream_url: string
          thumbnail_url?: string | null
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          stream_url?: string
          thumbnail_url?: string | null
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          features: Json | null
          id: string
          is_active: boolean | null
          max_devices: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_devices?: number | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_devices?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          admin_notes: string | null
          created_at: string
          description: string
          id: string
          priority: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          description: string
          id?: string
          priority?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          description?: string
          id?: string
          priority?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      upcoming_releases: {
        Row: {
          backdrop_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          genre: string | null
          id: string
          imdb_id: string | null
          release_date: string | null
          status: string
          thumbnail: string | null
          title: string
          tmdb_id: string | null
          trailer_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          backdrop_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          imdb_id?: string | null
          release_date?: string | null
          status?: string
          thumbnail?: string | null
          title: string
          tmdb_id?: string | null
          trailer_url?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          backdrop_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          genre?: string | null
          id?: string
          imdb_id?: string | null
          release_date?: string | null
          status?: string
          thumbnail?: string | null
          title?: string
          tmdb_id?: string | null
          trailer_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_followed_cast: {
        Row: {
          actor_name: string
          cast_id: string
          cast_type: string
          created_at: string
          id: string
          profile_url: string | null
          tmdb_person_id: number | null
          user_id: string
        }
        Insert: {
          actor_name: string
          cast_id: string
          cast_type: string
          created_at?: string
          id?: string
          profile_url?: string | null
          tmdb_person_id?: number | null
          user_id: string
        }
        Update: {
          actor_name?: string
          cast_id?: string
          cast_type?: string
          created_at?: string
          id?: string
          profile_url?: string | null
          tmdb_person_id?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_likes: {
        Row: {
          created_at: string | null
          id: string
          like_type: string
          media_id: string
          media_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          like_type: string
          media_id: string
          media_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          like_type?: string
          media_id?: string
          media_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_rentals: {
        Row: {
          created_at: string
          end_date: string
          id: string
          media_id: string | null
          media_type: string
          payment_method: string | null
          payment_status: string
          rental_price: number
          start_date: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          media_id?: string | null
          media_type: string
          payment_method?: string | null
          payment_status?: string
          rental_price: number
          start_date?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          media_id?: string | null
          media_type?: string
          payment_method?: string | null
          payment_status?: string
          rental_price?: number
          start_date?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          media_id: string | null
          media_type: string | null
          report_reason: string
          report_type: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          media_id?: string | null
          media_type?: string | null
          report_reason: string
          report_type: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          media_id?: string | null
          media_type?: string | null
          report_reason?: string
          report_type?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          last_active_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          last_active_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean | null
          payment_status: string | null
          plan_id: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean | null
          payment_status?: string | null
          plan_id: string
          start_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          payment_status?: string | null
          plan_id?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_watchlist: {
        Row: {
          created_at: string | null
          id: string
          media_id: string
          media_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_id: string
          media_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_id?: string
          media_type?: string
          user_id?: string
        }
        Relationships: []
      }
      video_sources: {
        Row: {
          created_at: string
          episode_id: string | null
          id: string
          is_default: boolean
          language: string | null
          media_id: string | null
          permission: string
          quality: string | null
          quality_urls: Json | null
          server_name: string
          source_type: string
          updated_at: string
          url: string | null
          version: string | null
        }
        Insert: {
          created_at?: string
          episode_id?: string | null
          id?: string
          is_default?: boolean
          language?: string | null
          media_id?: string | null
          permission?: string
          quality?: string | null
          quality_urls?: Json | null
          server_name: string
          source_type?: string
          updated_at?: string
          url?: string | null
          version?: string | null
        }
        Update: {
          created_at?: string
          episode_id?: string | null
          id?: string
          is_default?: boolean
          language?: string | null
          media_id?: string | null
          permission?: string
          quality?: string | null
          quality_urls?: Json | null
          server_name?: string
          source_type?: string
          updated_at?: string
          url?: string | null
          version?: string | null
        }
        Relationships: []
      }
      voice_actors: {
        Row: {
          age: number | null
          anilist_id: number | null
          created_at: string
          date_of_birth: string | null
          description: string | null
          gender: string | null
          id: string
          image_url: string | null
          language: string
          mal_id: number | null
          name: string
          name_native: string | null
          updated_at: string
        }
        Insert: {
          age?: number | null
          anilist_id?: number | null
          created_at?: string
          date_of_birth?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          language?: string
          mal_id?: number | null
          name: string
          name_native?: string | null
          updated_at?: string
        }
        Update: {
          age?: number | null
          anilist_id?: number | null
          created_at?: string
          date_of_birth?: string | null
          description?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          language?: string
          mal_id?: number | null
          name?: string
          name_native?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          balance_before: number
          created_at: string
          description: string | null
          id: string
          payment_transaction_id: string | null
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          balance_before: number
          created_at?: string
          description?: string | null
          id?: string
          payment_transaction_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          balance_before?: number
          created_at?: string
          description?: string | null
          id?: string
          payment_transaction_id?: string | null
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_payment_transaction_id_fkey"
            columns: ["payment_transaction_id"]
            isOneToOne: false
            referencedRelation: "payment_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "user_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_history: {
        Row: {
          completed: boolean
          created_at: string
          duration: number
          episode_id: string | null
          id: string
          last_watched_at: string
          movie_id: string | null
          progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          duration?: number
          episode_id?: string | null
          id?: string
          last_watched_at?: string
          movie_id?: string | null
          progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          duration?: number
          episode_id?: string | null
          id?: string
          last_watched_at?: string
          movie_id?: string | null
          progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "watch_history_movie_id_fkey"
            columns: ["movie_id"]
            isOneToOne: false
            referencedRelation: "movies"
            referencedColumns: ["id"]
          },
        ]
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
      access_type: "free" | "rent" | "vip"
      app_role: "admin" | "user"
      media_type: "movie" | "series"
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
      access_type: ["free", "rent", "vip"],
      app_role: ["admin", "user"],
      media_type: ["movie", "series"],
    },
  },
} as const
