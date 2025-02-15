import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContentProvider } from "./content/ContentProvider";
import { ThemeProvider } from "./content/ThemeProvider";

const queryClient = new QueryClient();

export const App: React.FC = () => (
  <QueryClientProvider client={queryClient}>
    <ContentProvider>
      <ThemeProvider />
    </ContentProvider>
  </QueryClientProvider>
);
