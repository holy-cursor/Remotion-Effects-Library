// Print the agent manifest. `npm run manifest` → llms-components.txt on stdout;
// `npm run manifest -- --json` → components.json. Redirect to a file if you want one.
import { libraryJson, libraryManifest } from "../../meta/docs";

process.stdout.write(process.argv.includes("--json") ? JSON.stringify(libraryJson(), null, 2) : libraryManifest());
