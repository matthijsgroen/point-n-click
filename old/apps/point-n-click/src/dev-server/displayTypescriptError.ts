import sourceMap from "source-map";
import { bold, resetStyling } from "../cli-client/utils";

export const displayTypescriptError = async (
  gameContentsSourceMap: string,
  e: TypeError
) => {
  const mapping = new sourceMap.SourceMapConsumer(gameContentsSourceMap);
  const [line, column] = (e.stack as string)
    .split("\n")[1]
    .split(":")
    .slice(-2)
    .map((num: string) => parseInt(num, 10));

  const result = (await mapping).originalPositionFor({ line, column });
  console.log(e.message);

  console.log(
    `  at ${process.cwd()}${result.source}:${result.line}:${result.column}`
  );
  console.log("");
  if (result.source && result.line) {
    const line = result.line;
    const originalContents =
      (await mapping).sourceContentFor(result.source)?.split("\n") ?? [];

    const errorLines = originalContents.slice(line - 3, line + 2);

    errorLines.forEach((l, index) => {
      if (index === 2) {
        bold();
      }
      console.log(`${line - 2 + index} ${index == 2 ? ">" : " "} ${l}`);
      resetStyling();
    });
  }
};
