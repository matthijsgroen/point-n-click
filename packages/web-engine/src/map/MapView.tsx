import { mapToMermaid } from "@point-n-click/puzzle-dependency-diagram";
import React, { useEffect, useRef } from "react";
import { GameWorld, WorldMap } from "@point-n-click/types";

const DisplayDiagram = React.lazy(() => import("../shared/DisplayMermaid"));

const scales = [
  0.25, 0.5, 0.65, 0.75, 0.85, 1.0, 1.25, 1.5, 2.0, 2.5, 3, 4, 5, 7, 12,
];

export const MapView: React.FC<{
  map: WorldMap<GameWorld>;
}> = ({ map }) => {
  const scaleIndex = 5;
  const mermaidDiagram = mapToMermaid(map, {});

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPos = [
    scrollContainerRef.current?.scrollLeft,
    scrollContainerRef.current?.scrollTop,
  ];

  useEffect(() => {
    // diagram updated, fix scroll pos
    scrollContainerRef.current?.scrollTo({
      left: scrollPos[0],
      top: scrollPos[1],
    });
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({
        left: scrollPos[0],
        top: scrollPos[1],
      });
    }, 0);
  }, [mermaidDiagram]);

  return (
    <>
      <pre style={{ display: "none" }}>{mermaidDiagram}</pre>
      <div style={{ display: "grid", gridTemplateColumns: "1fr max-content" }}>
        <div
          style={{ overflow: "scroll", height: "100vh" }}
          ref={scrollContainerRef}
        >
          <figure style={{ width: `${scales[scaleIndex] * 100}%` }}>
            <React.Suspense fallback={<div>Loading...</div>}>
              <DisplayDiagram diagram={mermaidDiagram} />
            </React.Suspense>
          </figure>
        </div>
        <div>
          <p>Ok</p>
        </div>
      </div>
    </>
  );
};
