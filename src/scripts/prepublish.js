const fs = require("fs");
const npmrc = fs.readFileSync("./.npmrc", "utf8");
fs.writeFileSync("./.npmrc", npmrc.replace("{TOKEN}", process.env.NPM_TOKEN), "utf8")