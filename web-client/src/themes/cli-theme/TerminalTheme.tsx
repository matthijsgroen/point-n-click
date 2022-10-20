import { Theme, ThemeRenderer } from "../theme-manager/types";

const TerminalTheme: ThemeRenderer = ({
  contents,
  interactions,
  onInteraction,
}) => {
  return (
    <div>
      {contents.map((item, index) => (
        <p key={index}>{JSON.stringify(item)}</p>
      ))}
      <p>{JSON.stringify(interactions.prompt)}</p>
      {interactions.actions.map((item, index) => (
        <p key={index}>
          <button
            onClick={() => {
              onInteraction(item.id);
            }}
          >
            {JSON.stringify(item)}
          </button>
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
