import { NodeStyle, styleToMermaidString } from "./mermaidStyle";

describe(styleToMermaidString, () => {
  it.each<{ name: string; style: NodeStyle; expected: string }>([
    {
      name: "border-color",
      style: { border: { color: "#fff" } },
      expected: "stroke: #fff",
    },
    {
      name: "border-width",
      style: { border: { width: 4 } },
      expected: "stroke-width: 4px",
    },
    {
      name: "border-style: solid",
      style: { border: { style: "solid" } },
      expected: "",
    },
    {
      name: "border-style: dashed",
      style: { border: { style: "dashed" } },
      expected: "stroke-dasharray: 5 5",
    },
    {
      name: "border-style: dotted",
      style: { border: { style: "dotted" } },
      expected: "stroke-dasharray: 1 3",
    },
    {
      name: "text-color",
      style: { text: { color: "#fff" } },
      expected: "color: #fff",
    },
    {
      name: "background-color",
      style: { background: { color: "#fff" } },
      expected: "fill: #fff",
    },
    {
      name: "multiple properties",
      style: { background: { color: "#fff" }, border: { color: "#777" } },
      expected: "stroke: #777,fill: #fff",
    },
  ])("supports $name", ({ style, expected }) => {
    const result = styleToMermaidString(style);
    expect(result).toEqual(expected);
  });
});
