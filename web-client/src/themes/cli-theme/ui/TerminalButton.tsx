import { InteractionAction } from "@point-n-click/engine";
import { formatText } from "./formatText";
import styles from "./TerminalButton.module.css";

export const TerminalButton: React.FC<{
  onClick?: () => void;
  item: InteractionAction;
}> = ({ onClick, item }) => (
  <button className={styles.button} onClick={onClick}>
    {formatText(item.label)}
  </button>
);
