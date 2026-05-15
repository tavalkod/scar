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

export const unitTypes = {
      str_id: "TEXT",
      replay_id: "TEXT",

      minerals: "INTEGER",
      vespene: "INTEGER",
      supply: "REAL",
};

export const players = {
    player_id: "INTEGER",
    replay_id: "TEXT",
    name: "TEXT",
    race: "TEXT",
    result: "TEXT"
};

export const playerStateEvents = {
    frame: "INTEGER NOT NULL",
    player_id: "INTEGER NOT NULL",
    replay_id: "TEXT",

    minearls_current: "INTEGER",
    vespene_current: "INTEGER",
    minerals_collection_rate: "INTEGER",
    vespene_collection_rate: "INTEGER",
    workers_active_count: "INTEGER"
}

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

export default `
${createTableSql("unit_born_event", unitBornEvent)}
CREATE INDEX unit_born_event_frame ON unit_born_event(frame);
CREATE INDEX unit_born_event_unit_id ON unit_born_event(unit_id);
${createTableSql("unit_died_event", unitDiedEvent)}
CREATE INDEX unit_died_event_frame ON unit_died_event(frame);
CREATE INDEX unit_died_event_unit_id ON unit_died_event(unit_id);
${createTableSql("unit_init_event", unitInitEvent)}
CREATE INDEX unit_init_event_frame ON unit_init_event(frame);
CREATE INDEX unit_init_event_unit_id ON unit_init_event(unit_id);
${createTableSql("unit_done_event", unitDoneEvent)}
CREATE INDEX unit_done_event_frame ON unit_done_event(frame);
CREATE INDEX unit_done_event_unit_id ON unit_done_event(unit_id);
${createTableSql("unit_types", unitTypes)}
CREATE INDEX unit_types_replay_id ON unit_types(replay_id);
CREATE INDEX unit_types_str_id ON unit_types(str_id);
${createTableSql("players", players)}
CREATE INDEX players_replay_id ON players(replay_id);
${createTableSql("player_stats_events", playerStateEvents)}
CREATE INDEX player_stats_events_replay_id ON player_stats_events(replay_id);
CREATE INDEX player_stats_events_frame ON player_stats_events(frame);
`