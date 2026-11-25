// Writes the agent manifests from meta/ so the built gallery serves them as static files.
// Runs before every build (`prebuild`). Outputs:
//   gallery/public/llms-components.txt and gallery/public/components.json (served by the site)
//   llms-components.txt and components.json at the library root (read by agents browsing the repo)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { libraryJson, libraryManifest } from "../../meta/docs";

const here = path.dirname(fileURLToPath(import.meta.url));
const gallery = path.resolve(here, "..");
const root = path.resolve(gallery, "..");
const txt = libraryManifest();
const json = JSON.stringify(libraryJson(), null, 2) + "\n";

fs.mkdirSync(path.join(gallery, "public"), { recursive: true });
for (const dir of [path.join(gallery, "public"), root]) {
  fs.writeFileSync(path.join(dir, "llms-components.txt"), txt);
  fs.writeFileSync(path.join(dir, "components.json"), json);
}
console.log(`manifest: ${libraryJson().effects.length} effects`);
