import { Command } from "commander";
import { devServer } from "./dev-server/devServer";
import "@parcel/config-default";
import { setTerminalTitle } from "./dev-server/terminalTitle";
import packageInfo from "../package.json";
import { buildContent } from "./content-builder/contentBuilder";

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

  program
    .command("verify <source>")
    .summary("verify game content")
    .action(async (source) => {
      const gameContent = await buildContent(source, { resolver });

      console.log(gameContent);
    });

  setTerminalTitle("point-n-click");
  program.parse(args);
};
