import { ContentPlugin, SystemInterface } from "@point-n-click/engine";

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
