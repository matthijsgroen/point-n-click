import React from "react";
import { useDiagramErrors } from "./GraphProvider";

export const DiagramErrors = () => {
  const errors = useDiagramErrors();

  return (
    <ul>
      {errors.map((error) => (
        <li>{error.message}</li>
      ))}
    </ul>
  );
};
