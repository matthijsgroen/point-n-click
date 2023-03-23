import {
  diagramToFilterOptions,
  PuzzleDependencyDiagram,
} from "@point-n-click/puzzle-dependency-diagram";
import React, { ChangeEventHandler, useState } from "react";
import { DisplayDiagram } from "./DisplayDiagram";
import { produce } from "immer";

export const DiagramView: React.FC<{
  diagram: PuzzleDependencyDiagram;
}> = ({ diagram }) => {
  const filterOptions = diagramToFilterOptions(diagram);
  const [diagramFilter, setDiagramFilter] =
    useState<Record<string, string[]>>(filterOptions);

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
    <div style={{ display: "grid", gridTemplateColumns: "1fr max-content" }}>
      <DisplayDiagram diagram={diagram} diagramFilter={diagramFilter} />
      <div>
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
  );
};
