import { bold, resetStyling } from "../../cli-client/utils";
import { StateError } from "../text/applyState";
import { ParseSyntaxError } from "../text/processText";
import sourceMap from "source-map";
import { FormattedText } from "../text/types";

export type DisplayErrorText = {
  type: "error";
  message: FormattedText[];
};

export const formatParserError = (e: ParseSyntaxError): DisplayErrorText => ({
  type: "error",
  message: [
    [{ type: "text", text: "Could not parse:" }],
    [{ type: "text", text: `"${e.text}"` }],
    [
      {
        type: "formatting",
        format: "b",
        value: null,
        contents: [
          {
            type: "text",
            text: `${Array(e.location.start.offset + 1)
              .fill(" ")
              .join("")}^`,
          },
        ],
      },
    ],
    [{ type: "text", text: e.message }],
    e.found === "["
      ? [
          {
            type: "text",
            text: "An interpolation was encountered, but it was not closed. (missing ']'?)",
          },
        ]
      : [],
  ],
});

export const formatStateError = (
  text: string,
  e: StateError
): DisplayErrorText => ({
  type: "error",
  message: [
    [{ type: "text", text: `Could not interpolate:\n'${text}'` }],
    [{ type: "text", text: e.message }],
  ],
});

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
