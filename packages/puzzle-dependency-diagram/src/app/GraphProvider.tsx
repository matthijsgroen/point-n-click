import { useQuery } from "@tanstack/react-query";
import Graph from "graphology";
import React, {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import { diagramToGraph } from "../diagramToGraph";
import { PuzzleDependencyDiagram, ValidationError } from "../types";
import { validateDiagram } from "../validator";

const GraphContext = createContext<{
  graph: Graph | undefined;
  errorMessages: ValidationError[];
}>({
  graph: undefined,
  errorMessages: [],
});

export const useDiagramErrors = (): ValidationError[] => {
  const { errorMessages } = useContext(GraphContext);
  return errorMessages;
};

export const useGraph = (): Graph | undefined => {
  const { graph } = useContext(GraphContext);
  return graph;
};

export const GraphProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const { data: diagram } = useQuery({
    queryFn: async (): Promise<PuzzleDependencyDiagram> => {
      const data = await fetch("/assets/contents.json");
      const gameModel = await data.json();
      return gameModel.diagram;
    },
  });

  const errorMessages = useMemo(
    () => (diagram ? validateDiagram(diagram) : []),
    [diagram]
  );

  const graph = useMemo(
    () =>
      diagram && errorMessages.length === 0
        ? diagramToGraph(diagram)
        : undefined,
    [diagram, errorMessages]
  );

  return (
    <GraphContext.Provider value={{ graph, errorMessages }}>
      {children}
    </GraphContext.Provider>
  );
};
