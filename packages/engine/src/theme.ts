import { ThemeDefinition, ThemeSettings } from "@point-n-click/themes";
import { ContentPlugin, DSLExtension } from "@point-n-click/types";

type RegisteredTheme<
  Settings extends ThemeSettings,
  Extensions extends ContentPlugin<DSLExtension>[]
> = {
  theme: ThemeDefinition<Settings, Extensions>;
  id: string;
};

let themeList: RegisteredTheme<ThemeSettings, ContentPlugin<DSLExtension>[]>[] =
  [];

export const clearRegisteredThemes = () => {
  themeList = [];
};

export const registerTheme = <
  Settings extends ThemeSettings,
  Extensions extends ContentPlugin<DSLExtension>[]
>(
  id: string,
  theme: ThemeDefinition<Settings, Extensions>
) => {
  themeList.push({
    id,
    theme: theme as unknown as ThemeDefinition<ThemeSettings, Extensions>,
  });
};

export const getRegisteredThemes = () => themeList;
