// see https://github.com/sebosp/cooper/tree/main

use wasm_bindgen::prelude::*;

//use s2protocol::tracker_events::TrackerEvent;
use s2protocol::versions::{
    //read_details, 
    // read_message_events, 
    read_tracker_events
};
use nom_mpq::parser;


#[wasm_bindgen]
pub fn parse_replay(bytes: &[u8]) -> Result<String, JsValue> {
    if let Ok((_, mpq)) = parser::parse(bytes) {
        let details = read_tracker_events("", &mpq, &bytes);
        Ok(format!("{:#?}", details))
        //Ok("ok".into())
    }
    else {
        Ok("helloWorld".into())
    }
    
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

