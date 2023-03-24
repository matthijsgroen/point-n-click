import {
  diagramToFilterOptions,
  diagramToMermaid,
  PuzzleDependencyDiagram,
} from "@point-n-click/puzzle-dependency-diagram";
import React, { ChangeEventHandler, useState } from "react";
import { produce } from "immer";

const DisplayDiagram = React.lazy(() => import("./DisplayMermaid"));

export const DiagramView: React.FC<{
  diagram: PuzzleDependencyDiagram;
}> = ({ diagram }) => {
  const filterOptions = diagramToFilterOptions(diagram);
  const [diagramFilter, setDiagramFilter] =
    useState<Record<string, string[]>>(filterOptions);

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

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr max-content" }}>
        <React.Suspense fallback={<div>Loading...</div>}>
          <DisplayDiagram diagram={mermaidDiagram} />
        </React.Suspense>
        <div>
          <h2>Options:</h2>
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
            return (
              <fieldset key={name}>
                <h3>{name}</h3>
                {options.map((option) => (
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
