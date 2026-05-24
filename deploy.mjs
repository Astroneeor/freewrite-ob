import { copyFileSync, mkdirSync } from "fs";

const dest = "C:/Users/nerro/Documents/Obsidian/.obsidian/plugins/freewrite";

mkdirSync(dest, { recursive: true });
copyFileSync("main.js",       `${dest}/main.js`);
copyFileSync("manifest.json", `${dest}/manifest.json`);
copyFileSync("styles.css",    `${dest}/styles.css`);

console.log(`Deployed to ${dest}`);
