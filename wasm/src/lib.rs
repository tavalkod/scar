// see https://github.com/sebosp/cooper/tree/main

use wasm_bindgen::prelude::*;
use serde_json::{json, Value};

//use s2protocol::tracker_events::TrackerEvent;
use s2protocol::versions::{
    //read_details, 
    // read_message_events, 
    read_tracker_events
};use s2protocol::tracker_events::{
    UnitBornEvent,
    UnitInitEvent,
    UnitDiedEvent,
    ReplayTrackerEvent
};
use nom_mpq::parser;


#[wasm_bindgen]
pub fn parse_replay(bytes: &[u8]) -> Result<String, JsValue> {
    if let Ok((_, mpq)) = parser::parse(bytes) {
        let players: Vec<Value> = vec![];
        let mut unit_events: Vec<Value> = vec![];
        let unit_type_change_events: Vec<Value> = vec![];
        let unit_types: Vec<Value> = vec![];
        let player_stats_event: Vec<Value> = vec![];
        if let Ok(tracker_events) = read_tracker_events("", &mpq, &bytes) {
            unit_events = tracker_events.iter().filter_map(|event| {
                let delta = event.delta;
                let event = &event.event;
                match event {
                    ReplayTrackerEvent::UnitBorn(e) => Some(unit_born_event_to_json(delta, e)),
                    ReplayTrackerEvent::UnitDied(e) => Some(unit_died_event_to_json(delta, e)),
                    //UnitOwnerChange(UnitOwnerChangeEvent),
                    //UnitTypeChange(UnitTypeChangeEvent),
                    //Upgrade(UpgradeEvent),
                    ReplayTrackerEvent::UnitInit(e) => Some(unit_init_event_to_json(delta, e)),
                    _ => None
                }
            }).collect()
        }


        //Ok(format!("{:#?}", details))
        let data = json!({
            "players": players,
            "unitEvents": unit_events,
            "unitTypeChangeEvents": unit_type_change_events,
            "unitTypes": unit_types,
            "playerStatsEvent": player_stats_event
        });

        return Ok(serde_json::to_string_pretty(&data).unwrap());
    }    
    else {
        Ok("Error".into())
    }
    
}

pub fn unit_born_event_to_json(frame: u32, event: &UnitBornEvent) -> Value {
    json!({
        "frame": frame,
        "event_name": "UnitBornEvent",

        "unit_id_index": event.unit_tag_index,
        "unit_id_recycle": event.unit_tag_recycle,

        "unit_id":
            (event.unit_tag_index << 18) | event.unit_tag_recycle,

        "unit_type_name": event.unit_type_name,

        "control_pid": event.control_player_id,
        "upkeep_pid": event.upkeep_player_id,

        "x": event.x,
        "y": event.y,

        "location": [
            event.x,
            event.y
        ],

        // rust parser extras
        "creator_unit_tag_index":
            event.creator_unit_tag_index,

        "creator_unit_tag_recycle":
            event.creator_unit_tag_recycle,

        "creator_ability_name":
            event.creator_ability_name,
    })
}


pub fn unit_init_event_to_json(frame: u32, event: &UnitInitEvent) -> Value {
    let x = event.x;
    let y = event.y;

    json!({
        "frame": frame,
        "event_name": "UnitInitEvent",

        "unit_id_index": event.unit_tag_index,
        "unit_id_recycle": event.unit_tag_recycle,

        "unit_id":
            (event.unit_tag_index << 18) | event.unit_tag_recycle,


        "unit_type_name": event.unit_type_name,

        "control_pid": event.control_player_id,
        "upkeep_pid": event.upkeep_player_id,

        "x": x,
        "y": y,
    })
}

pub fn unit_died_event_to_json(frame: u32, event: &UnitDiedEvent,) -> Value {
    let x = event.x;
    let y = event.y;


    let killing_unit_id = match (
        event.killer_unit_tag_index,
        event.killer_unit_tag_recycle,
    ) {
        (Some(index), Some(recycle)) if index != 0 => {
            Some((index << 18) | recycle)
        }

        _ => None,
    };

    json!({
        "frame": frame,
        "event_name": "UnitDiedEvent",
        "unit_id_index": event.unit_tag_index,
        "unit_id_recycle": event.unit_tag_recycle,

        "unit_id":
            (event.unit_tag_index << 18)
            | event.unit_tag_recycle,

        // deprecated python fields
        "killer_pid": event.killer_player_id,
        // newer python fields
        "killing_player_id": event.killer_player_id,

        "x": x,
        "y": y,

        "location": [
            x,
            y
        ],

        "killing_unit_index":
            event.killer_unit_tag_index,

        "killing_unit_recycle":
            event.killer_unit_tag_recycle,

        "killing_unit_id":
            killing_unit_id,

        "killing_unit": null
    })
}
#[cfg(test)]
mod tests {
    // Note this useful idiom: importing names from outer (for mod tests) scope.
    use super::*;

    #[test]
    fn test_add() {
        assert_eq!(add(1, 2), 3);
    }

    #[test]
    fn test_bad_add() {
        // This assert would fire and test will fail.
        // Please note, that private functions can be tested too!
        assert_eq!(bad_add(1, 2), 3);
    }
}

