type ChainedCondition = {
  (condition: boolean, action: () => void): {
    else: ChainedCondition;
  };
  (action: () => void): void;
};

export type CustomIfStatement = (
  condition: boolean,
  action: () => void
) => { else: ChainedCondition };

/**
 * By using this custom if statement, you can chain multiple conditions and actions together.
 * The engine will be able to browse all content when using this custom if statement, to collect
 * all potentially used assets and text for translation.
 *
 * @example
 *
 * ```typescript
 *   customIfStatement(someIfCondition, () => {
 *     console.log("This is an 'if'");
 *   }).else(someElseCondition, () => {
 *     console.log("This is an 'if else'");
 *   }).else( () => {
 *     console.log("This is an 'else'");
 *   });
 * ```
 */
export const customIfStatement: CustomIfStatement = (
  condition: boolean,
  action: () => void
) => {
  let executed = false;

  const elseAction = (
    conditionOrAction: boolean | (() => void),
    action?: () => void
  ) => {
    if (executed) {
      return { else: elseAction };
    }
    if (typeof conditionOrAction === "function") {
      executed = true;
      conditionOrAction();
    } else if (conditionOrAction && action) {
      executed = true;
      action();
    }
    return { else: elseAction };
  };

  if (condition) {
    executed = true;
    action();
  }
  return {
    else: elseAction,
  };
};
