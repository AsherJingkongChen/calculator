use evalexpr::eval;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn solve(input: &str) -> String {
    let input = input.to_owned();
    if input.is_empty() {
        return input;
    }
    if let Ok(output) = eval(&input) {
        if output.is_empty() {
            input
        } else {
            output.to_string()
        }
    } else {
        input
    }
}
