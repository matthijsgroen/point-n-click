import generateDolls from "../lib/code-generators/generate-dolls";

const watchMode = process.argv.includes("--watch");

generateDolls(process.cwd(), { watchMode });
