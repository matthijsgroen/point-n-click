import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { ContentProvider } from "../content/ContentProvider";
import { WireDiagram } from "./WireDiagram";

const queryClient = new QueryClient();

export const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ContentProvider>
      <div style={{ color: "white" }}>
        <p>Hello world! We're back!</p>
        <WireDiagram />
      </div>
    </ContentProvider>
  </QueryClientProvider>
);
