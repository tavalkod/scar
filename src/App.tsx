import { PGlite } from "@electric-sql/pglite";
import sqlInit from "./sqlInit"

import { live } from "@electric-sql/pglite/live"
import { PGliteProvider } from "@electric-sql/pglite-react"
import UnitCompositions from "./Counter";
import Economy from "./Economy";


// load python and get the result
console.log("Loading Pyodide...");
const { loadPyodide } = await import("https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.mjs");
const pyodide = await loadPyodide();

await pyodide.loadPackage("micropip");
await pyodide.runPythonAsync(`
import sys
sys.path.append("/app")
`);
const mpyqSource = await fetch("/mpyq.py").then(r => r.text());
pyodide.FS.mkdir("/app");
pyodide.FS.writeFile("/app/mpyq.py", mpyqSource);

await pyodide.runPythonAsync(`
import micropip
await micropip.install("sc2reader", deps=False)
`);

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
const unitTypes = result.unitTypes;
const stats = result.playerStatsEvent;

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


export type Sc2UnitType = {
  id: number;
  str_id?: string | null;
  name?: string | null;
  title?: string | null;
  race?: string | null;
  minerals?: number | null;
  vespene?: number | null;
  supply?: number | null;
  is_building?: boolean | null;
  is_worker?: boolean | null;
  is_army?: boolean | null;
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


async function insertUnitTypes(
  db: PGlite,
  unitTypes: Sc2UnitType[],
) {
  await db.exec("BEGIN");

  try {
    for (const unit of unitTypes) {
      await db.query(
        `
        INSERT INTO sc2_unit_types (
          type_id,
          str_id,
          name,
          title,
          race,
          minerals,
          vespene,
          supply,
          is_building,
          is_worker,
          is_army
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8,
          $9, $10, $11
        )
        ON CONFLICT (type_id) DO UPDATE SET
          str_id = EXCLUDED.str_id,
          name = EXCLUDED.name,
          title = EXCLUDED.title,
          race = EXCLUDED.race,
          minerals = EXCLUDED.minerals,
          vespene = EXCLUDED.vespene,
          supply = EXCLUDED.supply,
          is_building = EXCLUDED.is_building,
          is_worker = EXCLUDED.is_worker,
          is_army = EXCLUDED.is_army
        `,
        [
          unit.id,
          unit.str_id ?? null,
          unit.name ?? null,
          unit.title ?? null,
          unit.race ?? null,
          unit.minerals ?? 0,
          unit.vespene ?? 0,
          unit.supply ?? 0,
          unit.is_building ?? false,
          unit.is_worker ?? false,
          unit.is_army ?? false,
        ],
      );
    }

    await db.exec("COMMIT");
  } catch (err) {
    await db.exec("ROLLBACK");
    throw err;
  }
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


async function insertStats(
  db: PGlite,
  stats: any[],
) {
  await db.exec("BEGIN");

  try {
    for (const stat of stats) {
      await db.query(
        `
        INSERT INTO player_stats_events (
          frame,
          pid,
          minearls_current,
          vespene_current,
          minerals_collection_rate,
          vespene_collection_rate,
          workers_active_count
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7
        )
        `,
        [
          stat.frame,
          stat.pid,
          stat.minearls_current,
          stat.vespene_current,
          stat.minerals_collection_rate,
          stat.vespene_collection_rate,
          stat.workers_active_count,
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

await db.exec(sqlInit)

if (events) await insertSc2Events(db, events);
if (unitTypes) await insertUnitTypes(db, unitTypes)
if (stats) await insertStats(db, stats)


export default function App() {
  /*const [result, setResult] = useState(null);
  useEffect(() => {
    boot(setResult);
  }, [])*/

  if (!result) return <>NO RESULT?!</>;

  return (

    <PGliteProvider db={db}>
      <Economy/>
      <UnitCompositions />
    </PGliteProvider>)

}