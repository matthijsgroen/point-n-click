export type ValidationMessage = {
  message: string;
  messageValue?: number;

  line?: string;
  startPos?: number;
  endPos?: number;

  location: { type: "file" | "key"; value: string }[];

  messageType: "info" | "warning" | "error";
  source: string;

  // | "stateError"
  // | "parsingError"
  // | "outdatedTranslation"
  // | "translationFileMissing"
  // | "notTranslated";
};
