import fs from "fs";
import path from "path";

const filePath = path.resolve("node_modules/pdf-parse/index.js");

const cleanCode = `const Fs = require('fs');
const Pdf = require('./lib/pdf-parse.js');

module.exports = Pdf;
`;

try {
  fs.writeFileSync(filePath, cleanCode, "utf-8");
  console.log("✅ Cleaned pdf-parse/index.js to remove debug block");
} catch (err) {
  console.error("❌ Failed to clean pdf-parse/index.js", err);
}
