import {
  diagramToMermaid,
  PuzzleDependencyDiagram,
} from "@point-n-click/puzzle-dependency-diagram";
import mermaid from "mermaid";
import React, { useEffect, useState } from "react";

mermaid.initialize({ startOnLoad: false });

export const DisplayDiagram: React.FC<{
  diagram: PuzzleDependencyDiagram;
}> = ({ diagram }) => {
  const [image, setImage] = useState("");
  useEffect(() => {
    mermaid.render("graphDiv", diagramToMermaid(diagram)).then(({ svg }) => {
      setImage(svg);
    });
  }, [diagram]);

  return <div dangerouslySetInnerHTML={{ __html: image }}></div>;
};
