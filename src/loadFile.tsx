import type { PGlite } from "@electric-sql/pglite";
import init, { parse_replay, parse_replay2 } from "../wasm/pkg";
import { getWriter, unitBornEvent, unitDiedEvent, unitDoneEvent, unitInitEvent } from "./sqlInit";
await init();

export async function loadFile(db: PGlite, file: File) {
    const writeUnitBorn = getWriter(db, "unit_born_event", unitBornEvent)
    const writeUnitDied = getWriter(db, "unit_died_event", unitDiedEvent)
    const writeUnitInit = getWriter(db, "unit_init_event", unitInitEvent)
    const writeUnitDone = getWriter(db, "unit_done_event", unitDoneEvent)


    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const replay = JSON.parse(parse_replay2(bytes))
    console.log(replay);

    const replay_id = self.crypto.randomUUID()// TODO: hack?;

    const preprocessUnitEvent = (frame, ev) => {
        const { unit_tag_index, unit_tag_recycle, ...event } = ev;
        const unit_id = unit_tag_index << 18 + unit_tag_recycle;
        return { replay_id, frame, unit_id, ...event }
    }

    await db.exec("BEGIN");
    try {
        let frame = 0;
        for (const trackerEvent of replay.tracker_events) {
            frame += trackerEvent.delta;
            const eventEnum = trackerEvent.event;
            if ("UnitBorn" in eventEnum) {
                writeUnitBorn(preprocessUnitEvent(frame, eventEnum["UnitBorn"]))
            }
            else if ("UnitDied" in eventEnum) {
                writeUnitDied(preprocessUnitEvent(frame, eventEnum["UnitDied"]))
            }
            else if ("UnitInit" in eventEnum) {
                writeUnitInit(preprocessUnitEvent(frame, eventEnum["UnitInit"]))
            }
            else if ("UnitDone" in eventEnum) {
                writeUnitDone(preprocessUnitEvent(frame, eventEnum["UnitDone"]))
            }
        }

        await db.exec("COMMIT");
    } catch (err) {
        await db.exec("ROLLBACK");
        throw err;
    }
}
