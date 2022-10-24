import { Command } from "commander";
import { devServer } from "./dev-server/devServer";

export const cli = (args: string[]) => {
  const program = new Command();
  program
    .description(
      "A tool to build adventure games. Start with a CLI text adventure, and work towards a graphical adventure PWA."
    )
    .version("2.0.0");

  program
    .command("dev [source]")
    .option("-l, --lang <language>")
    .description("start build server and game")
    .action((source, options) => {
      devServer(source, options);
    });

  program.parse(args);
};
