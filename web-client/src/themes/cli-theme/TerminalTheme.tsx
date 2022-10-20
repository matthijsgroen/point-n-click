import { Theme, ThemeRenderer } from "../theme-manager/types";

const TerminalTheme: ThemeRenderer = ({ contents, interactions }) => {
  return (
    <div>
      {contents.map((item, index) => (
        <p key={index}>{JSON.stringify(item)}</p>
      ))}
      <p>{JSON.stringify(interactions.prompt)}</p>
      {interactions.actions.map((item, index) => (
        <p key={index}>{JSON.stringify(item)}</p>
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
