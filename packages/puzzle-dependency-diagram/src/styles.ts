import { NodeStyle } from "./mermaidStyle";

export const FILTERED_STYLE: NodeStyle = {
  border: {
    width: 1,
    style: "dashed",
  },
  background: { color: "#111" },
  text: { color: "#666" },
};

export const LOGIC_OR_STYLE: NodeStyle = {
  background: { color: "#999" },
  border: { color: "#000" },
  text: { color: "#000" },
};

export const ERROR_STYLE: NodeStyle = {
  background: { color: "#933" },
  border: { color: "#333" },
  text: { color: "#000" },
};

export const CHAPTER_STYLE: NodeStyle = {
  background: { color: "#393" },
  border: { color: "#3f3" },
  text: { color: "#000" },
};

export const GROUP_STYLE: NodeStyle = {
  background: { color: "#111" },
  border: { color: "#393", width: 3 },
  text: { color: "#fff" },
};
