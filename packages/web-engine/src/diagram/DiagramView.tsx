import {
  diagramToFilterOptions,
  diagramToMermaid,
  PuzzleDependencyDiagram,
} from "@point-n-click/puzzle-dependency-diagram";
import React, { ChangeEventHandler, useEffect, useRef, useState } from "react";
import { produce } from "immer";

const DisplayDiagram = React.lazy(() => import("./DisplayMermaid"));

const getPercentage = (
  diagram: PuzzleDependencyDiagram,
  tagName: string,
  tagValue: string
) => {
  const puzzles = Object.values(diagram);
  const totalCount = puzzles.length;
  let counter = 0;

  puzzles.forEach((puzzle) => {
    const tag =
      puzzle.tags &&
      (puzzle.tags as Record<string, string | string[]>)[tagName];
    if (tag && (tag === tagValue || tag.includes(tagValue))) {
      counter++;
    }
  });

  return (counter / totalCount) * 100;
};

const scales = [0.5, 0.65, 0.75, 0.85, 1.0, 1.25, 1.5, 2.0, 2.5, 3, 4, 5, 7];

export const DiagramView: React.FC<{
  diagram: PuzzleDependencyDiagram;
}> = ({ diagram }) => {
  const filterOptions = diagramToFilterOptions(diagram);
  const [diagramFilter, setDiagramFilter] =
    useState<Record<string, string[]>>(filterOptions);
  const [scaleIndex, setScaleIndex] = useState<number>(4);
  const [togglePercentages, setTogglePercentages] = useState<string[]>([]);

  const [renderHierarchy, setRenderHierarchy] = useState(false);

  const mermaidDiagram = diagramToMermaid(diagram, {
    filter: diagramFilter,
    renderHierarchy,
  });

  const createEventHandler =
    (name: string, value: string): ChangeEventHandler<HTMLInputElement> =>
    (event) => {
      setDiagramFilter(
        produce((draft) => {
          draft[name] = (draft[name] || []).concat(value);
          if (!event.target.checked) {
            draft[name] = draft[name].filter((v) => v !== value);
          }
        })
      );
    };
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollPos = [
    scrollContainerRef.current?.scrollLeft,
    scrollContainerRef.current?.scrollTop,
  ];

  useEffect(() => {
    console.log(scrollPos);
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
          <h2>Options:</h2>
          <label style={{ display: "block", textTransform: "capitalize" }}>
            <button
              disabled={scaleIndex <= 0}
              onClick={() => setScaleIndex((index) => index - 1)}
            >
              -
            </button>
            <button
              disabled={scaleIndex >= scales.length - 1}
              onClick={() => setScaleIndex((index) => index + 1)}
            >
              +
            </button>
            Zoom
          </label>
          <label style={{ display: "block", textTransform: "capitalize" }}>
            <input
              name={"renderHierarchy"}
              type="checkbox"
              checked={renderHierarchy}
              onChange={(event) => setRenderHierarchy(event.target.checked)}
            ></input>
            Render Hierarchy
          </label>

          <h2>Filters:</h2>
          {Object.entries<string[]>(filterOptions).map(([name, options]) => {
            const showPercentage = togglePercentages.includes(name);
            return (
              <fieldset key={name}>
                <h3>
                  {name}{" "}
                  <button
                    onClick={() => {
                      setTogglePercentages((percentages) =>
                        showPercentage
                          ? percentages.filter((n) => n !== name)
                          : percentages.concat(name)
                      );
                    }}
                  >
                    % {showPercentage ? "on" : "off"}
                  </button>
                </h3>
                {options.map((option: string) => (
                  <label
                    key={option}
                    style={{ display: "block", textTransform: "capitalize" }}
                  >
                    <input
                      name={name}
                      value={option}
                      type="checkbox"
                      checked={diagramFilter[name].includes(option)}
                      onChange={createEventHandler(name, option)}
                    ></input>
                    {option === "_all" ? "All" : option}
                    {showPercentage
                      ? ` ${getPercentage(diagram, name, option)}%`
                      : ""}
                  </label>
                ))}
              </fieldset>
            );
          })}
        </div>
      </div>
      <pre style={{ display: "none" }}>{mermaidDiagram}</pre>
    </>
  );
};
