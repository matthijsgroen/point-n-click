import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { Diagram } from "./Diagram";
import { DiagramErrors } from "./DiagramErrors";
import { GraphProvider } from "./GraphProvider";

const queryClient = new QueryClient();

export const DiagramDisplay = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <GraphProvider>
        <DiagramErrors />
        <div>
          <h1>Ready for development!</h1>
          <p>Next steps:</p>
          <ul>
            <li>
              <del>Reading content</del>
            </li>
            <li>
              <del>Wire content of game to endpoint</del>
            </li>
            <li>
              <del>Validate content</del>
            </li>
            <li>
              <del>Convert to graph</del>
            </li>
            <li>
              <strong>Render using sigma.js</strong>
            </li>
            <li>
              <strong>Generate edges</strong>
            </li>
            <li>
              <strong>Generate layout</strong>
            </li>
          </ul>
        </div>
        <Diagram />
      </GraphProvider>
    </QueryClientProvider>
  );
};
