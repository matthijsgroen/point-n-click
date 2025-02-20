import {
  Action,
  ContentPlugin,
  GameWorld,
  PluginAction,
  SystemPluginInterface,
} from "@point-n-click/engine";
import { Fragment } from "react/jsx-runtime";

type DescribeTextAction = PluginAction<
  "Descriptions",
  { type: "descriptionText"; text: string[] }
>;

const actions = {
  descriptionText:
    <TGame extends GameWorld>(helper: SystemPluginInterface<TGame>) =>
    (...text: string[]) => {
      helper.addAction({
        type: "descriptionText",
        text,
      });
    },
} as const;

export const plugin: ContentPlugin<"Descriptions", typeof actions, {}> = {
  name: "Descriptions",
  actions,
  content: {},
};

export const isDescribeTextAction = <Game extends GameWorld>(
  action: Action<Game>
): action is DescribeTextAction =>
  action.type === "plugin" &&
  action.plugin === "Descriptions" &&
  action.action.type === "descriptionText";

export const DescribeText = ({ action }: { action: DescribeTextAction }) => (
  <>
    {action.action.text.map((line) => (
      <Fragment key={line}>
        {line} <br />
      </Fragment>
    ))}
  </>
);
