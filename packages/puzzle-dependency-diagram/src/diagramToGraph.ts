import Graph, { DirectedGraph } from "graphology";
import { EventStyle, PuzzleDependencyDiagram } from "./types";

type NodeAttributes = {
  label: string;
  color?: string;
  type: "act" | "task" | "puzzle";
};

type EdgeAttributes = {};

type GraphAttributes = {
  name: string;
};

export const diagramToGraph = <Diagram extends PuzzleDependencyDiagram>(
  diagram: Diagram
): Graph => {
  const graph = new DirectedGraph<
    NodeAttributes,
    EdgeAttributes,
    GraphAttributes
  >();

  const colorMap: Record<string, string> = {};
  for (const [style, settings] of Object.entries<EventStyle>(
    diagram.styles ?? {}
  )) {
    colorMap[style] = settings.color;
  }

  graph.addNode("Start", { label: "start", type: "act" });

  for (const [eventName, event] of Object.entries(diagram.events)) {
    graph.addNode(eventName, {
      label: event.name ?? eventName,
      color: colorMap[String(event.status)],
      type: event.type ?? "puzzle",
    });
  }

  return graph;
};
