import { ContentPlugin, SystemInterface } from "../dsl/types/plugin";

const actions = {
  descriptionText: (helper: SystemInterface, ...text: string[]) => {
    helper.addAction({
      type: "descriptionText",
      text,
    });
  },
} as const;

export const plugin: ContentPlugin<"Descriptions", typeof actions> = {
  name: "Descriptions",
  actions,
};
