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
html = appendLicenseToHtml(html, "LICENSE");
html = appendFontToHtml(html, {
    family: "Fira Code",
    style: "normal",
    weight: 700,
    src: fs.readFileSync(
        path.join(__dirname, "public", "firacode.woff2"),
        "base64"
    ),
    range: "U+21-7E",
    type: "woff2",
});
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
    removeAttributeQuotes: true,
    removeComments: false,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    removeTagWhitespace: true,
    sortAttributes: true,
    sortClassName: true,
});
fs.mkdirSync(path.join(__dirname, "build"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "build", "index.html"), html);

/**
 * @param {String} html
 * @param {Record<string, string>} font
 * @returns {String}
 */
function appendFontToHtml(html, font) {
    const { family, style, weight, src, range, type } = font;
    const url = `data:font/${type};base64,${src}`;
    return html.replace(
        "</head>",
        `<style>
            @font-face {
                font-family: '${family}';
                font-style: ${style};
                font-weight: ${weight};
                src: url('${url}') format('${type}');
                unicode-range: ${range};
            }
        </style>
        </head>`
    );
}

/**
 * @param {String} html
 * @param {String} file
 * @returns {String}
 */
function appendLicenseToHtml(html, file) {
    const license = fs.readFileSync(path.join(__dirname, file), "utf8");
    return html + `\n<!--\n${license}\n-->`;
}

/**
 * @param {String} html
 * @param {String} name
 * @returns {String}
 */
function appendWasmToHtml(html, name) {
    const dir = path.join(
        __dirname,
        "target",
        "wasm32-unknown-unknown",
        "release"
    );
    execSync(
        `wasm-bindgen --out-dir ${dir} --no-typescript --omit-default-module-path \
            --remove-name-section --remove-producers-section --target no-modules \
            --no-modules-global ${name} --out-name ${name} \
            ${path.join(dir, `${name}.wasm`)}`,
        { stdio: "inherit" }
    );
    let js = fs.readFileSync(path.join(dir, `${name}.js`), "utf8");
    let wasm = fs.readFileSync(path.join(dir, `${name}_bg.wasm`), "base64");
    return html.replace(
        "</body>",
        `<script>
            ${js}${name}.initSync({
                module: Uint8Array.from(atob("${wasm}"), c => c.charCodeAt(0))
            });
            globalThis.${name} = ${name};
        </script>
        </body>`
    );
}
