import React, { useEffect, useState } from "react";
import { useGameContent } from "../content/ContentProvider";
import { DiagramView } from "./DiagramView";

export const WireDiagram = () => {
  const content = useGameContent();
  const [diagram, setDiagram] = useState(content.getModel().diagram);

  useEffect(() => {
    content.waitForChange().then(() => {
      setDiagram(content.getModel().diagram);
    });
  }, [diagram]);

  return <DiagramView diagram={diagram} />;
};
