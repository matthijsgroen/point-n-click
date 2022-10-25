import { DisplayErrorText } from "@point-n-click/engine";
import styles from "./Error.module.css";
import { formatText } from "@point-n-click/themes";

export const Error: React.FC<{ content: DisplayErrorText }> = ({ content }) => {
  return (
    <div className={styles.error}>
      <h1>Error</h1>
      {content.message.map((value, row) => (
        <pre key={row}>{formatText(value)}</pre>
      ))}
    </div>
  );
};
