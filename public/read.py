import io
import json
import traceback
import sc2reader

def parse_sc2_replay_bytes(data: bytes) -> str:
    try:
        replay = sc2reader.load_replay(io.BytesIO(data), load_level=4, engine=None)

        players = [
            {
                "pid": p.pid,
                "name": p.name,
            } for p in replay.players
        ]


        tracker_events = replay.tracker_events

        unitEvents = [e.__dict__ for e in tracker_events if e.name in ["UnitBornEvent", "UnitInitEvent", "UnitDiedEvent"]]
        unitTypeChangeEvents = [e.__dict__ for e in tracker_events if e.name in ["UnitTypeChangeEvent"]]
        result = {
            "players": players,
            "unitEvents": unitEvents,
            "unitTypeChangeEvents": unitTypeChangeEvents
        }

        return json.dumps(result)
    except Exception:
        return json.dumps({
            "error": traceback.format_exc()
        })