export const unitBornEvent = {
    replay_id: "TEXT NOT NULL",
    frame: "INTEGER NOT NULL",
    unit_id: "BIGINT",

    unit_type_name: "TEXT",
    control_pid: "INTEGER",
    upkeep_pid: "INTEGER",

    x: "INTEGER",
    y: "INTEGER",
};

export const unitDiedEvent = {
    replay_id: "TEXT NOT NULL",
    frame: "INTEGER NOT NULL",
    unit_id: "BIGINT",
    
    x: "INTEGER",
    y: "INTEGER",

    killing_player_id: "INTEGER",
    killing_unit_id: "INTEGER",
};

export const unitInitEvent = unitBornEvent;

export const unitDoneEvent = {
    replay_id: "TEXT NOT NULL",
    frame: "INTEGER NOT NULL",
    unit_id: "BIGINT",
};

export const unitTypeEvent = {
    replay_id: "TEXT NOT NULL",
    frame: "INTEGER NOT NULL",
    unit_id: "BIGINT",
    unit_type_name: "TEXT",
};

function createTableSql(name, dict) {
    return `CREATE TABLE ${name} (
    ` + `id BIGSERIAL PRIMARY KEY,` + Object.entries(dict).map(([field, type]) => `\t${field} ${type}`).join(",\n") + "); \n"
}

export function getWriter(db, name, dict: Record<string, string>) {
    const q = `INSERT INTO ${name} (${Object.keys(dict).join(", ")}) VALUES (${Object.keys(dict).map((v, i) => "$" + (i+1)).join(", ")});`
    return record => db.query(q,
        Object.keys(dict).map(name => record[name])
    )
}

export default 
createTableSql("unit_born_event", unitBornEvent) + 
"CREATE INDEX unit_born_event_frame ON unit_born_event(frame);" +
"CREATE INDEX unit_born_event_unit_id ON unit_born_event(unit_id);" +
createTableSql("unit_died_event", unitDiedEvent) + 
"CREATE INDEX unit_died_event_frame ON unit_died_event(frame);" + 
"CREATE INDEX unit_died_event_unit_id ON unit_died_event(unit_id);" +
createTableSql("unit_init_event", unitInitEvent) + 
"CREATE INDEX unit_init_event_frame ON unit_init_event(frame);" +
"CREATE INDEX unit_init_event_unit_id ON unit_init_event(unit_id);" +
createTableSql("unit_done_event", unitDoneEvent) + 
"CREATE INDEX unit_done_event_frame ON unit_done_event(frame);" + 
"CREATE INDEX unit_done_event_unit_id ON unit_done_event(unit_id);" + 

`
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

CREATE INDEX sc2_unit_types_name_idx ON sc2_unit_types(name);
CREATE INDEX sc2_unit_types_str_id_idx ON sc2_unit_types(str_id);
CREATE INDEX sc2_unit_types_race_idx ON sc2_unit_types(race);


CREATE TABLE IF NOT EXISTS player_stats_events (
    id BIGSERIAL PRIMARY KEY,

    frame INTEGER NOT NULL,
    pid INTEGER,

    minearls_current INTEGER,
    vespene_current INTEGER,
    minerals_collection_rate INTEGER,
    vespene_collection_rate INTEGER,
    workers_active_count INTEGER
);

`