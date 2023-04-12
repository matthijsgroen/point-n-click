import { StateError } from "../text/applyState";
import { ParseSyntaxError } from "../text/processText";
import { FormattedText } from "../text/types";

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
