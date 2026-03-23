import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const tokens = JSON.parse(readFileSync(join(__dirname, "figma-lupo.json"), "utf8"));

function hexToRgb(hex) {
    const h = hex.replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    if (h.length === 8) {
        const a = parseInt(h.slice(6, 8), 16) / 255;
        return `rgb(${r} ${g} ${b} / ${a})`;
    }
    return `rgb(${r} ${g} ${b})`;
}

function normalizeHex(hex) {
    const h = hex.replace("#", "").toLowerCase();
    if (h.length === 8) return `#${h.slice(0, 6)}`;
    return `#${h}`;
}

function colorPrimitiveSlug(key) {
    let rest = key.slice("Colors/".length).replace(/Rosé/gi, "rose");
    rest = rest.replace(/\(([^)]+)\)/g, (_, inner) => `-${inner.trim().replace(/\s+/g, "-").toLowerCase()}`);
    rest = rest.replace(/\//g, "-");
    rest = rest.replace(/\s+/g, "-");
    return rest
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function splitFigmaColorKey(key) {
    const rest = key.slice("Colors/".length);
    const idx = rest.lastIndexOf("/");
    return { family: rest.slice(0, idx), shade: rest.slice(idx + 1) };
}

const SHADE_ORDER = ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

function shadeSortKey(shade) {
    const i = SHADE_ORDER.indexOf(shade);
    return i === -1 ? 1000 : i;
}

function isSemanticColorKey(key) {
    return /^Colors\/(Text|Background|Border|Foreground)\//.test(key);
}

const semanticStrip = {
    text: /^text-/,
    background: /^bg-/,
    border: /^border-/,
    foreground: /^fg-/,
};

function semanticCssName(key) {
    const m = key.match(/^Colors\/(Text|Background|Border|Foreground)\/(.+)$/);
    const group = m[1].toLowerCase();
    let rest = m[2]
        .replace(/\s*\((\d+)\)\s*$/g, "-$1")
        .replace(/\s*\(([^)]+)\)\s*$/g, "-$1")
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-");
    const strip = semanticStrip[group];
    if (strip?.test(rest)) rest = rest.replace(strip, "");
    return `--semantic-color-${group}-${rest}`;
}

const skipKeys = new Set();
for (const k of Object.keys(tokens)) {
    if (/^Main font styles\//.test(k) || /^Other fonts\//.test(k)) skipKeys.add(k);
}

/** @type {Array<{ figmaKey: string, cssVar: string, value: string }>} */
const colorPrimitives = [];

for (const [key, val] of Object.entries(tokens)) {
    if (skipKeys.has(key)) continue;
    if (typeof val !== "string" || val.startsWith("Font(")) continue;
    if (!key.startsWith("Colors/") || isSemanticColorKey(key)) continue;
    if (!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(val)) continue;
    colorPrimitives.push({
        figmaKey: key,
        cssVar: `--primitive-color-${colorPrimitiveSlug(key)}`,
        value: hexToRgb(val),
    });
}

const hexToPrimitives = new Map();
for (const row of colorPrimitives) {
    const nh = normalizeHex(tokens[row.figmaKey]);
    if (!hexToPrimitives.has(nh)) hexToPrimitives.set(nh, []);
    hexToPrimitives.get(nh).push(row.cssVar);
}

const SUCCESS_200_VAR = "--primitive-color-success-200";
const SUCCESS_200_RGB = "rgb(168 237 198)";
const nhS200 = normalizeHex("#a8edc6");
if (!hexToPrimitives.has(nhS200)) hexToPrimitives.set(nhS200, []);
hexToPrimitives.get(nhS200).push(SUCCESS_200_VAR);

const FAMILY_PRIORITY = [
    "Base",
    "Peach",
    "Gray (light mode)",
    "Gray (dark mode)",
    "Brand",
    "Error",
    "Warning",
    "Success",
];

function familyRank(family) {
    const i = FAMILY_PRIORITY.indexOf(family);
    return i === -1 ? 100 + family.localeCompare("") : i;
}

const families = [...new Set(colorPrimitives.map((r) => splitFigmaColorKey(r.figmaKey).family))];
families.sort((a, b) => {
    const da = familyRank(a);
    const db = familyRank(b);
    if (da !== db) return da - db;
    return a.localeCompare(b);
});

function pushBlock(lines, title, subtitle) {
    lines.push("");
    lines.push(`    /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`       ${title}`);
    if (subtitle) lines.push(`       ${subtitle}`);
    lines.push(`       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */`);
}

function emitColorFamily(lines, family) {
    const rows = colorPrimitives.filter((r) => splitFigmaColorKey(r.figmaKey).family === family);
    rows.sort((a, b) => {
        const sa = splitFigmaColorKey(a.figmaKey).shade;
        const sb = splitFigmaColorKey(b.figmaKey).shade;
        return shadeSortKey(sa) - shadeSortKey(sb) || sa.localeCompare(sb);
    });
    if (rows.length === 0) return;
    const label = family === "Gray (light mode)" ? `${family} (→ --color-gray-*)` : family;
    pushBlock(lines, label, "");
    for (const r of rows) {
        lines.push(`    ${r.cssVar}: ${r.value}; /* ${r.figmaKey} */`);
    }
}

function resolvePrimitiveVar(hex) {
    const nh = normalizeHex(hex);
    const list = hexToPrimitives.get(nh);
    if (list?.length) return `var(${list[0]})`;
    return hexToRgb(hex);
}

const primitiveLines = [];

primitiveLines.push("    /* ═══════════════════════════════════════════════════════════════════");
primitiveLines.push("       PRIMITIVE TOKENS (raw values from Figma)");
primitiveLines.push("       File: hxGMnRKwsUSaK6IEovB0Nr · frames 5225:371288 + 3307:417515");
primitiveLines.push("       Compare: Figma Variables panel vs comments on each line.");
primitiveLines.push("       ═══════════════════════════════════════════════════════════════════ */");
primitiveLines.push("");
primitiveLines.push("    --spacing: 4px; /* base unit; aligns with spacing-xxs scale in Figma */");

for (const family of families) {
    emitColorFamily(primitiveLines, family);
}

pushBlock(primitiveLines, "Success 200 (gap fill)", "Interpolated between Figma Success/100 and /300 — not exported");
primitiveLines.push(`    ${SUCCESS_200_VAR}: ${SUCCESS_200_RGB}; /* derived */`);

/** Non-color primitives with Figma keys */
const spacingKeys = Object.keys(tokens).filter((k) => /^spacing-/.test(k) && typeof tokens[k] === "string");
spacingKeys.sort((a, b) => {
    const na = parseInt(a.replace(/\D/g, ""), 10) || 0;
    const nb = parseInt(b.replace(/\D/g, ""), 10) || 0;
    if (na !== nb) return na - nb;
    return a.localeCompare(b);
});

pushBlock(primitiveLines, "Spacing", "Figma: spacing-xxs … spacing-10xl");
for (const k of spacingKeys) {
    primitiveLines.push(`    --primitive-${k}: ${tokens[k]}px; /* ${k} */`);
}

const radiusKeys = Object.keys(tokens).filter((k) => /^radius-/.test(k));
radiusKeys.sort();
pushBlock(primitiveLines, "Radius", "Figma: radius-*");
for (const k of radiusKeys) {
    const n = Number(tokens[k]);
    const v = n >= 999 ? `${tokens[k]}px` : `${n / 16}rem`;
    primitiveLines.push(`    --primitive-${k}: ${v}; /* ${k} */`);
}

pushBlock(primitiveLines, "Layout width", "Figma: width-* · paragraph-max-width");
for (const k of ["width-sm", "width-2xl"]) {
    if (tokens[k]) primitiveLines.push(`    --primitive-${k}: ${tokens[k]}px; /* ${k} */`);
}
if (tokens["paragraph-max-width"]) {
    primitiveLines.push(`    --primitive-paragraph-max-width: ${tokens["paragraph-max-width"]}px; /* paragraph-max-width */`);
}

const fontSizeKeys = Object.keys(tokens).filter((k) => k.startsWith("Font size/"));
fontSizeKeys.sort();
const lineHeightKeys = Object.keys(tokens).filter((k) => k.startsWith("Line height/"));
lineHeightKeys.sort();
const fontFamilyKeys = Object.keys(tokens).filter((k) => k.startsWith("Font family/"));
fontFamilyKeys.sort();
const fontWeightKeys = Object.keys(tokens).filter((k) => k.startsWith("Font weight/"));
fontWeightKeys.sort();

pushBlock(primitiveLines, "Typography", "Figma: Font size/* · Line height/* · Font family/* · Font weight/*");
for (const k of fontSizeKeys) {
    const slug = k.replace("Font size/", "").toLowerCase().replace(/\//g, "-");
    primitiveLines.push(`    --primitive-font-size-${slug}: ${tokens[k]}px; /* ${k} */`);
}
for (const k of lineHeightKeys) {
    const slug = k.replace("Line height/", "").toLowerCase().replace(/\//g, "-");
    primitiveLines.push(`    --primitive-line-height-${slug}: ${tokens[k]}px; /* ${k} */`);
}
for (const k of fontFamilyKeys) {
    const slug = k.replace("Font family/", "").toLowerCase().replace(/\//g, "-");
    const v = JSON.stringify(tokens[k]);
    primitiveLines.push(`    --primitive-font-family-${slug}: ${v}, ui-sans-serif, system-ui, sans-serif; /* ${k} */`);
}
const weightMap = { regular: 400, medium: 500, semibold: 600, bold: 700 };
for (const k of fontWeightKeys) {
    const slug = k.replace("Font weight/", "").toLowerCase();
    primitiveLines.push(`    --primitive-font-weight-${slug}: ${weightMap[slug] ?? 400}; /* ${k} */`);
}

const semanticByGroup = { Text: [], Background: [], Border: [], Foreground: [] };
for (const [key, val] of Object.entries(tokens)) {
    if (!isSemanticColorKey(key)) continue;
    if (!/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(val)) continue;
    const g = key.match(/^Colors\/(Text|Background|Border|Foreground)\//)[1];
    semanticByGroup[g].push({ key, val });
}
for (const g of Object.keys(semanticByGroup)) {
    semanticByGroup[g].sort((a, b) => a.key.localeCompare(b.key));
}

const semanticLines = [];
semanticLines.push("");
semanticLines.push("    /* ═══════════════════════════════════════════════════════════════════");
semanticLines.push("       SEMANTIC COLORS (Figma Text/Background/Border/Foreground → primitive)");
semanticLines.push("       Use these names when matching Figma semantic variables.");
semanticLines.push("       ═══════════════════════════════════════════════════════════════════ */");

const SEM_GROUP_ORDER = ["Text", "Background", "Border", "Foreground"];
for (const g of SEM_GROUP_ORDER) {
    const rows = semanticByGroup[g];
    if (rows.length === 0) continue;
    semanticLines.push("");
    semanticLines.push(`    /* --- Figma: Colors/${g}/* --- */`);
    for (const { key, val } of rows) {
        const name = semanticCssName(key);
        semanticLines.push(`    ${name}: ${resolvePrimitiveVar(val)}; /* ${key} */`);
    }
}

const graySteps = ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];
const brandSteps = ["25", "50", "100", "200", "300", "400", "500", "600", "700", "800", "900", "950"];

const pl = [];
pl.push("");
pl.push("    /* ═══════════════════════════════════════════════════════════════════");
pl.push("       PALETTE ALIASES (app / Tailwind names → primitives)");
pl.push("       Default gray = Figma “Gray (light mode)”.");
pl.push("       ═══════════════════════════════════════════════════════════════════ */");

pl.push("");
pl.push("    /* --- Base --- */");
pl.push("    --color-transparent: rgb(0 0 0 / 0); /* not from Figma token */");
pl.push("    --color-white: var(--primitive-color-base-white); /* Colors/Base/white */");
pl.push("    --color-black: var(--primitive-color-base-black); /* Colors/Base/black */");

pl.push("");
pl.push("    /* --- Figma: Colors/Brand/* → --color-brand-* --- */");
for (const s of brandSteps) {
    if (tokens[`Colors/Brand/${s}`] !== undefined) {
        pl.push(`    --color-brand-${s}: var(--primitive-color-brand-${s});`);
    }
}

pl.push("");
pl.push("    /* --- Figma: Colors/Gray (light mode)/* → --color-gray-* --- */");
for (const s of graySteps) {
    pl.push(`    --color-gray-${s}: var(--primitive-color-gray-light-mode-${s});`);
}

function addScale(figmaFamily, cssPrefix, plArr) {
    plArr.push("");
    plArr.push(`    /* --- Figma: Colors/${figmaFamily}/* → --color-${cssPrefix}-* --- */`);
    for (const s of graySteps) {
        const fk = `Colors/${figmaFamily}/${s}`;
        if (tokens[fk] === undefined) continue;
        const prim = `--primitive-color-${colorPrimitiveSlug(fk)}`;
        plArr.push(`    --color-${cssPrefix}-${s}: var(${prim});`);
    }
}

addScale("Error", "error", pl);
addScale("Warning", "warning", pl);
addScale("Success", "success", pl);
pl.push("    --color-success-200: var(--primitive-color-success-200); /* derived primitive */");

const ACCENT_SCALES = [
    ["Gray blue", "gray-blue"],
    ["Gray cool", "gray-cool"],
    ["Gray modern", "gray-modern"],
    ["Gray neutral", "gray-neutral"],
    ["Gray iron", "gray-iron"],
    ["Gray true", "gray-true"],
    ["Gray warm", "gray-warm"],
    ["Moss", "moss"],
    ["Green light", "green-light"],
    ["Green", "green"],
    ["Teal", "teal"],
    ["Cyan", "cyan"],
    ["Blue light", "blue-light"],
    ["Blue", "blue"],
    ["Blue dark", "blue-dark"],
    ["Indigo", "indigo"],
    ["Violet", "violet"],
    ["Purple", "purple"],
    ["Fuchsia", "fuchsia"],
    ["Pink", "pink"],
    ["Rosé", "rose"],
    ["Orange dark", "orange-dark"],
    ["Orange", "orange"],
    ["Yellow", "yellow"],
];

for (const [ff, cp] of ACCENT_SCALES) {
    addScale(ff, cp, pl);
}

const oldTheme = readFileSync(join(root, "src/styles/theme.css"), "utf8");
const primitiveBanner = "    /* ═══════════════════════════════════════════════════════════════════\n       PRIMITIVE TOKENS";
const legacyBanner = "    /* ─────────────────────────────────────────\n       PRIMITIVE TOKENS";
let start = oldTheme.indexOf(primitiveBanner);
if (start < 0) start = oldTheme.indexOf(legacyBanner);
if (start < 0) start = oldTheme.indexOf("    /* MAX WIDTH */");
const endUtility = oldTheme.indexOf("    /* LIGHT MODE VARIABLES */");
if (start === -1 || endUtility === -1) {
    throw new Error("Could not locate splice markers in theme.css");
}

const head = oldTheme.slice(0, start);
const tail = oldTheme.slice(endUtility);
const generated = [...primitiveLines, ...semanticLines, ...pl].join("\n");
writeFileSync(join(root, "src/styles/theme.css"), `${head}${generated}\n\n${tail}`, "utf8");
console.log("Wrote src/styles/theme.css");
