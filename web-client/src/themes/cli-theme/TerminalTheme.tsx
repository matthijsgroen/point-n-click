import { Theme, ThemeRenderer } from "../theme-manager/types";
import "./screen.css";
import styles from "./display.module.css";
import { TerminalText } from "./ui/TerminalText";
import { TerminalButton } from "./ui/TerminalButton";
import { Settings } from "./types";

const TerminalTheme: ThemeRenderer<Settings> = ({
  contents,
  interactions,
  gameModelManager,
  settings,
  onInteraction,
}) => {
  return (
    <div className={styles.display}>
      {contents.map((item, index) => (
        <TerminalText
          key={index}
          item={item}
          gameModelManager={gameModelManager}
          settings={settings}
        />
      ))}
      <p>{interactions.prompt}</p>
      {interactions.actions.map((item, index) => (
        <p key={index}>
          <TerminalButton
            onClick={() => {
              onInteraction(item.id);
            }}
            item={item}
          />
        </p>
      ))}
    </div>
  );
};

export const terminalTheme: Theme<Settings> = {
  name: "Terminal",
  author: "Matthijs Groen",
  version: "0.0.1",
  render: TerminalTheme,
  defaultSettings: { color: true },
};
