CREATE TABLE accounts (
  id UUID PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  is_guest BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE characters (
  id UUID PRIMARY KEY,
  account_id UUID REFERENCES accounts(id),
  name TEXT NOT NULL,
  portrait_url TEXT NOT NULL,
  class_id TEXT NOT NULL,
  health INTEGER NOT NULL,
  movement INTEGER NOT NULL,
  gold INTEGER NOT NULL DEFAULT 0,
  inventory JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE adventure_rooms (
  id UUID PRIMARY KEY,
  room_code TEXT UNIQUE NOT NULL,
  dm_account_id UUID REFERENCES accounts(id),
  active_scene_id TEXT NOT NULL,
  active_encounter_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE adventure_saves (
  id UUID PRIMARY KEY,
  room_id UUID REFERENCES adventure_rooms(id) ON DELETE CASCADE,
  state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
