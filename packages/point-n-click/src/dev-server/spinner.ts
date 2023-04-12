import { hexColor } from "..";
import { resetStyling } from "../cli-client/utils";
import { setColor } from "../cli-client/utils";

const delay = (duration: number) =>
  new Promise((resolve) => setTimeout(resolve, duration));

const spinnerSprites = ["⠟", "⠯", "⠷", "⠾", "⠽", "⠻"];

const editLine = (prefix: string, spinner: string) => {
  process.stdout.clearLine(0);
  process.stdout.write(`\r${prefix} `);
  setColor(hexColor("80ff80"));
  process.stdout.write(spinner);
  resetStyling();
};

export const progressSpinner = async <T>(
  line: string,
  waitFor: Promise<T>,
  spinner = spinnerSprites
): Promise<T> => {
  let busy = true;
  let result: T | null = null;

  waitFor.then((resolved) => {
    busy = false;
    result = resolved;
  });

  let counter = 0;
  process.stdout.write("\u001B[?25l");

  while (busy) {
    editLine(line, spinner[counter]);
    await delay(30);
    counter += 1;
    counter = counter % spinner.length;
  }
  process.stdout.write("\u001B[?25h");
  return result as T;
};
