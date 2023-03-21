import React, { useEffect, useState } from "react";
import { useGameContent } from "../content/ContentProvider";
import { DisplayDiagram } from "./DisplayDiagram";

export const WireDiagram = () => {
  const content = useGameContent();
  const [diagram, setDiagram] = useState(content.getModel().diagram);

  useEffect(() => {
    content.waitForChange().then((change) => {
      if (change) {
        setDiagram(content.getModel().diagram);
      }
    });
  }, [diagram]);

  return <DisplayDiagram diagram={diagram} />;
};
