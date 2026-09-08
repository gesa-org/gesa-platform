const fs = require("fs");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const files = ["components/home/Paths.tsx", "components/home/Stats.tsx"];

let bad = 0;
for (const f of files) {
  const src = fs.readFileSync(f, "utf8");
  const ast = parser.parse(src, {
    sourceType: "module",
    plugins: ["typescript", "jsx"],
  });
  traverse(ast, {
    JSXText(path) {
      const raw = src.slice(path.node.start, path.node.end);
      if (/[‘’“”]/.test(raw)) {
        console.log(f, path.node.loc.start.line, JSON.stringify(raw));
        bad++;
      }
    },
  });
}
console.log(bad === 0 ? "CLEAN" : `${bad} suspicious lines`);
