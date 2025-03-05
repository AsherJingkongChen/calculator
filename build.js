#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { minify } = require("html-minifier");

execSync(`cargo build --release --target wasm32-unknown-unknown`, {
    stdio: "inherit",
});

let html = fs.readFileSync(path.join(__dirname, "src", "index.html"), "utf8");
html = appendWasmToHtml(html, "calculator");
html = minify(html, {
    collapseBooleanAttributes: true,
    collapseInlineTagWhitespace: true,
    collapseWhitespace: true,
    decodeEntities: true,
    html5: true,
    minifyCSS: true,
    minifyJS: {
        module: true,
    },
    minifyURLs: true,
    removeAttributeQuotes: !true,
    removeComments: !true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
    sortAttributes: true,
    sortClassName: true,
});
fs.writeFileSync(path.join(__dirname, "target", "index.html"), html);

/**
 * @param {String} html
 * @param {String} name
 * @returns {String}
 */
function appendWasmToHtml(html, name) {
    const dir = path.join("target", "wasm32-unknown-unknown", "release");
    execSync(
        `wasm-bindgen --out-dir ${dir} --no-typescript --omit-default-module-path \
            --remove-name-section --remove-producers-section --target no-modules \
            --no-modules-global ${name} --out-name ${name} \
            ${path.join(dir, `${name}.wasm`)}`,
        { stdio: "inherit" }
    );
    let js = fs.readFileSync(path.join(dir, `${name}.js`), "utf8");
    let wasm = fs.readFileSync(path.join(dir, `${name}_bg.wasm`), "base64");
    html = html.replace(
        "</body>",
        `<script>
            ${js}${name}.initSync({
                module: Uint8Array.from(atob("${wasm}"), c => c.charCodeAt(0))
            });
            globalThis.${name} = ${name};
        </script>
        </body>`
    );
    return html;
}
