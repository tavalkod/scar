import { useEffect, useRef, useState } from "react";
import Plotter from "./Plotter"
import { PGlite } from "@electric-sql/pglite";

import { live } from "@electric-sql/pglite/live"
import { PGliteProvider } from "@electric-sql/pglite-react"
import Counter from "./Counter";


// load python and get the result
console.log("Loading Pyodide...");
const { loadPyodide } = await import("https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.mjs");
const pyodide = await loadPyodide();

console.log("Loading micropip...");
await pyodide.loadPackage("micropip");
await pyodide.runPythonAsync(`
import sys
sys.path.append("/app")
`);
const mpyqSource = await fetch("/mpyq.py").then(r => r.text());
pyodide.FS.mkdir("/app");
pyodide.FS.writeFile("/app/mpyq.py", mpyqSource);

console.log("Installing sc2reader...");
await pyodide.runPythonAsync(`
import micropip
await micropip.install("sc2reader", deps=False)
`);

console.log("Setting up import script...");
const txt = await fetch("./read.py").then(r => r.text())
await pyodide.runPythonAsync(txt);
console.log("Pyodide ready.");

console.log("Loading replay file");
const file = await fetch("/replay.SC2Replay")
const buffer = await file.arrayBuffer();
const bytes = new Uint8Array(buffer);

pyodide.globals.set("replay_bytes_js", bytes);

const resultJson = await pyodide.runPythonAsync(
  `parse_sc2_replay_bytes(replay_bytes_js.to_bytes())`
);

const result = JSON.parse(resultJson);
const events = result.unitEvents;
console.log("Parse result:", result);


// init pg
type RawSc2Event = {
  frame: number;
  second: number;
  name: string;

  unit_id_index?: number;
  unit_id_recycle?: number;
  unit_id?: number;
  unit_type_name?: string;

  control_pid?: number;
  upkeep_pid?: number;

  killer_pid?: number;
  killing_player_id?: number;
  killing_unit_index?: number;
  killing_unit_recycle?: number;
  killing_unit_id?: number;

  x?: number;
  y?: number;
  location?: [number, number];

  unit?: unknown;
  unit_upkeeper?: unknown;
  unit_controller?: unknown;
  killer?: unknown;
  killing_player?: unknown;
  killing_unit?: unknown;

  [key: string]: unknown;
};

function cleanEvent(e: RawSc2Event) {
  const {
    unit,
    unit_upkeeper,
    unit_controller,
    killer,
    killing_player,
    killing_unit,
    location,
    name,
    ...rest
  } = e;

  return {
    frame: e.frame,
    second: e.second,
    event_name: e.name,

    unit_id_index: e.unit_id_index ?? null,
    unit_id_recycle: e.unit_id_recycle ?? null,
    unit_id: e.unit_id ?? null,
    unit_type_name: e.unit_type_name ?? null,

    control_pid: e.control_pid ?? null,
    upkeep_pid: e.upkeep_pid ?? null,

    killer_pid: e.killer_pid ?? null,
    killing_player_id: e.killing_player_id ?? null,
    killing_unit_index: e.killing_unit_index ?? null,
    killing_unit_recycle: e.killing_unit_recycle ?? null,
    killing_unit_id: e.killing_unit_id ?? null,

    x: e.x ?? location?.[0] ?? null,
    y: e.y ?? location?.[1] ?? null,

    raw: rest,
  };
}

async function initSchema(db: PGlite) {
  await db.exec(`
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
  `);
}

async function insertSc2Events(db: PGlite, events: RawSc2Event[]) {
  await db.exec("BEGIN");

  try {
    for (const event of events) {
      const e = cleanEvent(event);

      await db.query(
        `
        INSERT INTO sc2_events (
          frame, second, event_name,
          unit_id_index, unit_id_recycle, unit_id, unit_type_name,
          control_pid, upkeep_pid,
          killer_pid, killing_player_id,
          killing_unit_index, killing_unit_recycle, killing_unit_id,
          x, y,
          raw
        )
        VALUES (
          $1, $2, $3::sc2_event_name,
          $4, $5, $6, $7,
          $8, $9,
          $10, $11,
          $12, $13, $14,
          $15, $16,
          $17::jsonb
        )
        `,
        [
          e.frame,
          e.second,
          e.event_name,

          e.unit_id_index,
          e.unit_id_recycle,
          e.unit_id,
          e.unit_type_name,

          e.control_pid,
          e.upkeep_pid,

          e.killer_pid,
          e.killing_player_id,
          e.killing_unit_index,
          e.killing_unit_recycle,
          e.killing_unit_id,

          e.x,
          e.y,

          JSON.stringify(e.raw),
        ],
      );
    }

    await db.exec("COMMIT");
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  }
}

const db = await PGlite.create({
  extensions: { live }
})

await initSchema(db);

await insertSc2Events(db, events);
const count = await db.query<{ count: string }>(
  `SELECT COUNT(*)::text AS count FROM sc2_events`,
);
console.log("Read events", count)



export default function App() {
  /*const [result, setResult] = useState(null);
  useEffect(() => {
    boot(setResult);
  }, [])*/

  if (!result) return <>NO RESULT?!</>;

  return (
  
    <PGliteProvider db={db}>
      <Counter/>
    </PGliteProvider>)

}