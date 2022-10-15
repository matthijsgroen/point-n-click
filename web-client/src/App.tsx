import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ContentProvider } from "./content/ContentProvider";
import { ThemeProvider } from "./themes/theme-manager/ThemeProvider";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ContentProvider>
        <ThemeProvider />
      </ContentProvider>
    </QueryClientProvider>
  );
}

export default App;
