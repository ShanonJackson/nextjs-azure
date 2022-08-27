const fs = require("fs-extra")
fs.cpSync("./scripts", "./dist/scripts", {recursive: true});