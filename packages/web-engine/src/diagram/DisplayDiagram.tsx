import {
  diagramToMermaid,
  FilterOptions,
  PuzzleDependencyDiagram,
} from "@point-n-click/puzzle-dependency-diagram";
import mermaid from "mermaid";
import React, { useEffect, useState } from "react";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

export const DisplayDiagram: React.FC<{
  diagram: PuzzleDependencyDiagram;
  diagramFilter: FilterOptions<PuzzleDependencyDiagram>;
}> = ({ diagram, diagramFilter }) => {
  const [image, setImage] = useState("");
  useEffect(() => {
    mermaid
      .render("graphDiv", diagramToMermaid(diagram, diagramFilter))
      .then(({ svg }) => {
        setImage(svg);
      });
  }, [diagram, diagramFilter]);

  return <div dangerouslySetInnerHTML={{ __html: image }}></div>;
};
