import { useAtomValue } from "jotai";
import React from "react";
// import { useGameContent } from "../content/ContentProvider";
import { gameContentAtom } from "../content/gameContent";
import { DiagramView } from "./DiagramView";

export const WireDiagram = () => {
  const gameContent = useAtomValue(gameContentAtom);
  // const content = useGameContent();
  // const [diagram, setDiagram] = useState(content.getModel().diagram);

  // useEffect(() => {
  //   content.waitForChange().then(() => {
  // setDiagram(content.getModel().diagram);
  // });
  // }, [diagram]);
  // const diagram = content.getModel().diagram;
  // useEffect(() => {
  //   console.log("Diagram updated!");
  // }, [diagram]);
  if (!gameContent) {
    return null;
  }

  return <DiagramView diagram={gameContent.diagram} />;
};
