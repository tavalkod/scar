export default `
CREATE TYPE sc2_event_name AS ENUM (
    'UnitBornEvent',
    'UnitInitEvent',
    'UnitDiedEvent'
);

CREATE TABLE sc2_events (
    id BIGSERIAL PRIMARY KEY,

    frame INTEGER NOT NULL,
    second INTEGER NOT NULL,
    event_name sc2_event_name NOT NULL,

    unit_id_index INTEGER,
    unit_id_recycle INTEGER,
    unit_id BIGINT,
    unit_type_name TEXT,

    control_pid INTEGER,
    upkeep_pid INTEGER,

    killer_pid INTEGER,
    killing_player_id INTEGER,
    killing_unit_index INTEGER,
    killing_unit_recycle INTEGER,
    killing_unit_id BIGINT,

    x INTEGER,
    y INTEGER,

    raw JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX sc2_events_frame_idx ON sc2_events(frame);
CREATE INDEX sc2_events_event_name_idx ON sc2_events(event_name);
CREATE INDEX sc2_events_unit_id_idx ON sc2_events(unit_id);


CREATE TABLE IF NOT EXISTS sc2_unit_types (
      type_id INTEGER PRIMARY KEY,

      str_id TEXT,
      name TEXT,
      title TEXT,
      race TEXT,

      minerals INTEGER NOT NULL DEFAULT 0,
      vespene INTEGER NOT NULL DEFAULT 0,
      supply REAL NOT NULL DEFAULT 0,

      is_building BOOLEAN NOT NULL DEFAULT FALSE,
      is_worker BOOLEAN NOT NULL DEFAULT FALSE,
      is_army BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS sc2_unit_types_name_idx
    ON sc2_unit_types(name);

CREATE INDEX IF NOT EXISTS sc2_unit_types_str_id_idx
    ON sc2_unit_types(str_id);

CREATE INDEX IF NOT EXISTS sc2_unit_types_race_idx
    ON sc2_unit_types(race);


`