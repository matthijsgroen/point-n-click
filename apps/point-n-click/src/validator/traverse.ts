import { isContentPluginStatement } from "@point-n-click/engine";
import {
  ConditionElse,
  ConditionStatement,
  ContentPluginStatement,
  GameModel,
  GameWorld,
  ScriptAST,
  ScriptStatement,
} from "@point-n-click/types";

const processScript = <Game extends GameWorld>(
  script: ScriptAST<Game>,
  path: string[],
  walk: (
    path: string[],
    node: ContentPluginStatement | ScriptStatement<Game>
  ) => void
) => {
  for (const statement of script) {
    walk(path, statement);
    if (isContentPluginStatement(statement)) {
      continue;
    }
    if (statement.statementType === "Condition") {
      const exportBody = (
        testStatement:
          | ConditionStatement<Game>
          | ConditionElse<Game>
          | { body: ScriptAST<Game> }
      ) => {
        processScript(testStatement.body, path, walk);
        if ("else" in testStatement && testStatement.else) {
          exportBody(testStatement.else);
        }
      };
      exportBody(statement);
      continue;
    }
    if (statement.statementType === "DisplayList") {
      Object.values(statement.values).forEach((script) => {
        processScript(script as ScriptAST<Game>, path, walk);
      });
      continue;
    }
  }
};

export const traverse = <Game extends GameWorld>(
  model: GameModel<Game>,
  walk: (
    path: string[],
    node: ContentPluginStatement | ScriptStatement<Game>
  ) => void
) => {
  for (const location of model.locations) {
    const path = ["locations", String(location.id)];
    for (const enterScript of location.onEnter) {
      processScript(enterScript.script, path, walk);
    }
    for (const leaveScript of location.onLeave) {
      processScript(leaveScript.script, path, walk);
    }
    processScript(location.describe.script, path, walk);

    for (const interaction of location.interactions) {
      const interactionScope = path.concat("interactions", interaction.label);
      processScript(interaction.script, interactionScope, walk);
    }
  }
  for (const overlay of model.overlays) {
    const overlayScope = ["overlays", String(overlay.id)];
    processScript(overlay.onEnter.script, overlayScope, walk);
    processScript(overlay.onLeave.script, overlayScope, walk);
    for (const interaction of overlay.interactions) {
      processScript(interaction.script, overlayScope, walk);
    }
  }
  for (const globalInteraction of model.globalInteractions) {
    const overlayScope = [
      "global",
      "interactions",
      String(globalInteraction.label),
    ];
    processScript(globalInteraction.script, overlayScope, walk);
  }
};
