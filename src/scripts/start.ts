import { realpathSync } from "fs";
import concurrently from "concurrently";
const projectRoot = realpathSync(process.cwd());

const scriptPath = require.resolve("./generate-code.ts");
const configPath = require.resolve("../../tsconfig.json");

concurrently(
  [
    { command: "parcel serve './src/index.html'", name: "parcel" },
    {
      command: `ts-node --project ${configPath} ${scriptPath} --watch`,
      name: "code",
    },
  ],
  {
    killOthers: ["failure", "success"],
    cwd: projectRoot,
  }
);
