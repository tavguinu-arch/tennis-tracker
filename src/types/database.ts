// Supabase public schema after profiles_and_user_ownership was applied on
// 2026-11-08. Regenerate this file from Supabase after schema changes.

type Relationship<
  Name extends string,
  Columns extends string[],
  Relation extends string,
  ReferencedColumns extends string[],
> = {
  foreignKeyName: Name;
  columns: Columns;
  isOneToOne: false;
  referencedRelation: Relation;
  referencedColumns: ReferencedColumns;
};

type Table<Row, Insert, Relationships extends unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Relationships;
};

type Id = number; // PostgreSQL bigint maps to number in supabase-js.
type OwnerId = string;
type CreatedAt = string | null;

type ModelRelation = Relationship<"rackets_model_id_fkey", ["model_id"], "racket_models", ["id"]>;
type SameOwnerModelRelation = Relationship<"rackets_same_owner_model_fk", ["user_id", "model_id"], "racket_models", ["user_id", "id"]>;
type StringRelation = Relationship<"string_reels_string_id_fkey", ["string_id"], "strings", ["id"]>;
type SameOwnerStringRelation = Relationship<"string_reels_same_owner_string_fk", ["user_id", "string_id"], "strings", ["user_id", "id"]>;
type RacketRelation = Relationship<"stringings_racket_id_fkey", ["racket_id"], "rackets", ["id"]>;
type MainReelRelation = Relationship<"stringings_main_reel_id_fkey", ["main_reel_id"], "string_reels", ["id"]>;
type CrossReelRelation = Relationship<"stringings_cross_reel_id_fkey", ["cross_reel_id"], "string_reels", ["id"]>;
type StringerRelation = Relationship<"stringings_stringer_id_fkey", ["stringer_id"], "stringers", ["id"]>;
type SameOwnerRacketRelation = Relationship<"stringings_same_owner_racket_fk", ["user_id", "racket_id"], "rackets", ["user_id", "id"]>;
type SameOwnerMainReelRelation = Relationship<"stringings_same_owner_main_reel_fk", ["user_id", "main_reel_id"], "string_reels", ["user_id", "id"]>;
type SameOwnerCrossReelRelation = Relationship<"stringings_same_owner_cross_reel_fk", ["user_id", "cross_reel_id"], "string_reels", ["user_id", "id"]>;
type SameOwnerStringerRelation = Relationship<"stringings_same_owner_stringer_fk", ["user_id", "stringer_id"], "stringers", ["user_id", "id"]>;

type PlayerOwned = { user_id: OwnerId };
type PlayerOwnedInsert = { user_id?: OwnerId };

type RacketModelRow = PlayerOwned & {
  id: Id;
  created_at: string;
  brand: string | null;
  model_name: string | null;
  head_size: number | null;
  string_pattern: string | null;
  weight_grams: number | null;
  notes: string | null;
};
type RacketModelInsert = PlayerOwnedInsert & {
  id?: Id;
  created_at?: string;
  brand?: string | null;
  model_name?: string | null;
  head_size?: number | null;
  string_pattern?: string | null;
  weight_grams?: number | null;
  notes?: string | null;
};

type RacketRow = PlayerOwned & {
  id: Id;
  created_at: CreatedAt;
  identifier: string;
  model_id: Id | null;
  purchase_date: string | null;
  price: number | null;
  is_active: boolean | null;
  notes: string | null;
};
type RacketInsert = PlayerOwnedInsert & {
  id?: Id;
  created_at?: string | null;
  identifier: string;
  model_id?: Id | null;
  purchase_date?: string | null;
  price?: number | null;
  is_active?: boolean | null;
  notes?: string | null;
};

type StringRow = PlayerOwned & {
  id: Id;
  created_at: CreatedAt;
  brand: string;
  name: string;
  type: string | null;
  gauge: string | null;
};
type StringInsert = PlayerOwnedInsert & {
  id?: Id;
  created_at?: string | null;
  brand: string;
  name: string;
  type?: string | null;
  gauge?: string | null;
};

type StringReelRow = PlayerOwned & {
  id: Id;
  created_at: CreatedAt;
  string_id: Id | null;
  purchase_date: string | null;
  price: number | null;
  total_stringings: number | null;
  notes: string | null;
};
type StringReelInsert = PlayerOwnedInsert & {
  id?: Id;
  created_at?: string | null;
  string_id?: Id | null;
  purchase_date?: string | null;
  price?: number | null;
  total_stringings?: number | null;
  notes?: string | null;
};

type StringerRow = PlayerOwned & {
  id: Id;
  created_at: CreatedAt;
  name: string;
  notes: string | null;
};
type StringerInsert = PlayerOwnedInsert & {
  id?: Id;
  created_at?: string | null;
  name: string;
  notes?: string | null;
};

type StringingRow = PlayerOwned & {
  id: Id;
  created_at: CreatedAt;
  racket_id: Id | null;
  main_reel_id: Id | null;
  main_tension_kg: number;
  cross_reel_id: Id | null;
  cross_tension_kg: number;
  stringing_date: string | null;
  notes: string | null;
  main_tension_unit: string | null;
  cross_tension_unit: string | null;
  service_cost: number | null;
  stringer_id: Id | null;
  hours_played: number | null;
  replacement_reason: string | null;
};
type StringingInsert = PlayerOwnedInsert & {
  id?: Id;
  created_at?: string | null;
  racket_id?: Id | null;
  main_reel_id?: Id | null;
  main_tension_kg: number;
  cross_reel_id?: Id | null;
  cross_tension_kg: number;
  stringing_date?: string | null;
  notes?: string | null;
  main_tension_unit?: string | null;
  cross_tension_unit?: string | null;
  service_cost?: number | null;
  stringer_id?: Id | null;
  hours_played?: number | null;
  replacement_reason?: string | null;
};

type TrainingSessionRow = PlayerOwned & {
  id: Id; training_date: string; duration_minutes: number | null;
  session_type: string; focus: string | null; intensity: number | null;
  location: string | null; notes: string | null; created_at: string;
};
type TrainingSessionInsert = PlayerOwnedInsert & {
  id?: Id; training_date?: string; duration_minutes?: number | null;
  session_type?: string; focus?: string | null; intensity?: number | null;
  location?: string | null; notes?: string | null; created_at?: string;
};
type TournamentRow = PlayerOwned & {
  id: Id; name: string; start_date: string; end_date: string | null;
  location: string | null; surface: string | null; category: string | null;
  notes: string | null; created_at: string;
};
type TournamentInsert = PlayerOwnedInsert & {
  id?: Id; name: string; start_date: string; end_date?: string | null;
  location?: string | null; surface?: string | null; category?: string | null;
  notes?: string | null; created_at?: string;
};
type TournamentMatchRow = PlayerOwned & {
  id: Id; tournament_id: Id; match_date: string | null; round: string | null;
  opponent: string; outcome: string; score: string | null; notes: string | null;
  created_at: string;
};
type TournamentMatchInsert = PlayerOwnedInsert & {
  id?: Id; tournament_id: Id; match_date?: string | null; round?: string | null;
  opponent: string; outcome: string; score?: string | null; notes?: string | null;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        {
          id: string;
          display_name: string | null;
          locale: string;
          currency_code: string;
          timezone: string;
          preferred_tension_unit: string;
          theme: string;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          display_name?: string | null;
          locale?: string;
          currency_code?: string;
          timezone?: string;
          preferred_tension_unit?: string;
          theme?: string;
          created_at?: string;
          updated_at?: string;
        }
      >;
      racket_models: Table<RacketModelRow, RacketModelInsert>;
      rackets: Table<RacketRow, RacketInsert, [ModelRelation, SameOwnerModelRelation]>;
      strings: Table<StringRow, StringInsert>;
      string_reels: Table<StringReelRow, StringReelInsert, [StringRelation, SameOwnerStringRelation]>;
      stringers: Table<StringerRow, StringerInsert>;
      stringings: Table<
        StringingRow,
        StringingInsert,
        [RacketRelation, MainReelRelation, CrossReelRelation, StringerRelation, SameOwnerRacketRelation, SameOwnerMainReelRelation, SameOwnerCrossReelRelation, SameOwnerStringerRelation]
      >;
      tennis_training_sessions: Table<TrainingSessionRow, TrainingSessionInsert>;
      tournaments: Table<TournamentRow, TournamentInsert>;
      tournament_matches: Table<
        TournamentMatchRow,
        TournamentMatchInsert,
        [Relationship<"tournament_matches_tournament_owner_fk", ["user_id", "tournament_id"], "tournaments", ["user_id", "id"]>]
      >;
    };
    Views: Record<string, never>;
    Functions: {
      delete_my_tennis_account: { Args: Record<PropertyKey, never>; Returns: undefined };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
