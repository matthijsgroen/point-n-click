import { Theme, ThemeRenderer } from "../theme-manager/types";
import "./screen.css";
import styles from "./display.module.css";
import { TerminalText } from "./ui/TerminalText";
import { TerminalButton } from "./ui/TerminalButton";

const TerminalTheme: ThemeRenderer = ({
  contents,
  interactions,
  onInteraction,
}) => {
  return (
    <div className={styles.display}>
      {contents.map((item, index) => (
        <TerminalText key={index} item={item} />
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

export const terminalTheme: Theme = {
  name: "Terminal",
  author: "Matthijs Groen",
  version: "0.0.1",
  render: TerminalTheme,
};
