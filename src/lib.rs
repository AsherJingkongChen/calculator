#![no_std]

extern crate alloc;

use alloc::string::{String, ToString};
use evalexpr::eval;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn solve(input: &str) -> String {
    let input = input.to_string();
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
