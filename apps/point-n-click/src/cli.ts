import { Command } from "commander";
import { devServer } from "./dev-server/devServer";
import "@parcel/config-default";
import { setTerminalTitle } from "./cli-utils/terminalTitle";
import packageInfo from "../package.json";
import { validateContent } from "./validator/validateContent";

export const cli = (
  args: string[],
  resolver: (packageName: string) => string
) => {
  const program = new Command();
  program
    .description(
      "A tool to build adventure games. Start with a CLI text adventure, and work towards a graphical adventure PWA."
    )
    .version(packageInfo.version);

  program
    .command("dev <source>")
    .summary("start development server")
    .description("start build server and game in both terminal and browser.")
    .option("-l, --lang <language>")
    .option("--light", "light mode (terminal with light background)")
    .option(
      "-p, --port <portnumber>",
      "port to run the dev server on",
      (value) => parseInt(value, 10),
      3456
    )
    .action((source, { light, ...options }) => {
      devServer(source, {
        ...options,
        lightMode: options.light ?? false,
        resolver,
      });
    });

  // Add command option to list untranslated texts for a language
  program
    .command("validate <source>")
    .summary("validate game content")
    .action(async (source) => {
      const result = validateContent(source, { resolver });
      if (!result) {
        process.exit(1);
      }
    });

  // Add command to show progress on tag
  // Add command to show next tasks for tag
  program
    .command("diagram")
    .summary("shows info from the puzzle dependency diagram")
    .action(() => {
      console.log("Hello there");
    });

  setTerminalTitle("point-n-click");
  program.parse(args);
};
