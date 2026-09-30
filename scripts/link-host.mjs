import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, realpathSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const host = process.argv[2] ?? join(execFileSync("npm", ["root", "-g"], { encoding: "utf8" }).trim(), "@earendil-works/pi-coding-agent");
const modules = new Map([
  ["@earendil-works/pi-coding-agent", host],
  ...["pi-ai", "pi-tui", "pi-agent-core"].map(name => [`@earendil-works/${name}`, join(host, "node_modules/@earendil-works", name)]),
  ["typebox", join(host, "node_modules/typebox")],
]);

for (const [name, target] of modules) {
  const destination = join(root, "node_modules", name);
  if (!existsSync(target)) throw new Error(`Host dependency is missing: ${target}`);
  if (existsSync(destination)) {
    if (realpathSync(destination) !== realpathSync(target)) {
      throw new Error(`Refusing to overwrite a separate dependency copy: ${destination}`);
    }
  } else {
    mkdirSync(dirname(destination), { recursive: true });
    symlinkSync(target, destination, "dir");
  }
  console.log(`${name} -> ${realpathSync(destination)}`);
}
