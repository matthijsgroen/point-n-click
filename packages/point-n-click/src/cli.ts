import { Command } from "commander";
import { devServer } from "./dev-server/devServer";
import "@parcel/config-default";

export const cli = (
  args: string[],
  resolver: (packageName: string) => string
) => {
  const program = new Command();
  program
    .description(
      "A tool to build adventure games. Start with a CLI text adventure, and work towards a graphical adventure PWA."
    )
    .version("2.0.0");

  program
    .command("dev [source]")
    .option("-l, --lang <language>")
    .option("--light", "light mode (terminal with light background)")
    .option(
      "-p, --port <portnumber>",
      "port to run the dev server on",
      (value) => parseInt(value, 10),
      3456
    )
    .description("start build server and game")
    .action((source, { light, ...options }) => {
      devServer(source, {
        ...options,
        lightMode: options.light ?? false,
        resolver,
      });
    });

  program.parse(args);
};
