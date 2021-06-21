import { Slice, SliceCaseReducers } from "@reduxjs/toolkit";
import {
  Button as ButtonProps,
  Highlight as HighlightProps,
} from "../../types/interface";
import { MessageBus } from "../messageBus";
import { Queue } from "../queue";
import { callback } from "../queue-utils/callback";

type ButtonSupport = {
  remove: () => void;
  hide: (id?: string) => void;
  hideAll: () => void;
  show: (id?: string) => void;
};

type ButtonActions<GameState> = {
  role?: "hud";
  skip?: (state: GameState) => boolean;
  condition?: (state: GameState) => boolean;
  onClick: (buttonRef: ButtonSupport) => void;
};

export type Button<GameState> = ButtonActions<GameState> & ButtonProps;
export type Highlight<GameState> = ButtonActions<GameState> & HighlightProps;

export const interfaceHelpers = <
  GameState,
  Reducers extends SliceCaseReducers<GameState>,
  Name extends string
>(
  slice: Slice<GameState, Reducers, Name>,
  q: Queue
) => {
  return {
    buttons: (buttons: (Button<GameState> | Highlight<GameState>)[]) => {
      callback<GameState>(q, ({ request, store }, { startSubQueue }) => {
        request<string, { items: string[] }>("ui:waitButtonPress", {
          items: buttons.map((b) => b.id),
        }).then((pressed) => {
          const item = buttons.find((b) => b.id === pressed);
          if (item) {
            const gameState = () => store.getState()["gameState"];
            const skipResult = item.skip ? item.skip(gameState()) : false;
            const conditionResult = item.condition
              ? item.condition(gameState())
              : true;

            if (conditionResult && !skipResult) {
              const endSubQueue = startSubQueue();

              item.onClick({
                hide: () => {
                  // TODO
                },
                show: () => {
                  // TODO
                },
                hideAll: () => {
                  // TODO
                },
                remove: () => {
                  // TODO
                },
              });

              endSubQueue();
            }
          }
        });

        // test for each button the 'condition' and 'skip'

        // for all active buttons, send data to UI (dispatch)
        // request to wait for button press (given selection of buttons)
        // when button is pressed, handle add appropriate 'onClick' to Queue
        // recheck

        // Wait till queue is here (callback?)
      });
    },
  };
};
