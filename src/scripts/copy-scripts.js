const fs = require("fs-extra")
fs.cpSync("./src/scripts", "./dist/scripts", {recursive: true});