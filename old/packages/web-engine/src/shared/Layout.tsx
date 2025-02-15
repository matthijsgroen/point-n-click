import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { PropsWithChildren } from "react";
import { ContentProvider } from "../content/ContentProvider";

const queryClient = new QueryClient();

export const Layout: React.FC<PropsWithChildren> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ContentProvider>
      <div style={{ color: "white" }}>{children}</div>
    </ContentProvider>
  </QueryClientProvider>
);
