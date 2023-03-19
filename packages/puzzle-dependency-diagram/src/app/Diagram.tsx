import React from "react";
import Graph from "graphology";
import { SigmaContainer } from "@react-sigma/core";
import "@react-sigma/core/lib/react-sigma.min.css";
import { useGraph } from "./GraphProvider";

export const Diagram = () => {
  const graph = useGraph();
  //   const graph = new Graph();
  //   graph.addNode("first", {
  //     x: 0,
  //     y: 0,
  //     size: 15,
  //     label: "My first node",
  //     color: "#FA4F40",
  //   });
  return (
    <SigmaContainer
      style={{ height: "500px", width: "500px" }}
      graph={graph}
    ></SigmaContainer>
  );
};
