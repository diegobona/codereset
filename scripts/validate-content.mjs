import { loadGuides } from "../lib/content/load.ts";

try {
  const guides = loadGuides();
  process.stdout.write(
    `Content validation passed: ${guides.length} source-backed guides are current.\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
