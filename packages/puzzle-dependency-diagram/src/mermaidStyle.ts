export type Color = `#${string}`;

export type NodeStyle = {
  border?: {
    color?: Color;
    width?: number;
    style?: "solid" | "dotted" | "dashed";
  };
  text?: {
    color?: Color;
  };
  background?: {
    color?: Color;
  };
};

export const styleToMermaidString = (style: NodeStyle) => {
  const props: string[] = [];

  if (style.border) {
    if (style.border.color) {
      props.push(`stroke-color: ${style.border.color}`);
    }
    if (style.border.width) {
      props.push(`stroke-width: ${style.border.width}px`);
    }
    if (style.border.style === "dashed") {
      props.push("stroke-dasharray: 5 5");
    }
    if (style.border.style === "dotted") {
      props.push("stroke-dasharray: 1 3");
    }
  }
  if (style.background) {
    if (style.background.color) {
      props.push(`fill-color: ${style.background.color}`);
    }
  }
  if (style.text) {
    if (style.text.color) {
      props.push(`color: ${style.text.color}`);
    }
  }

  return props.join(",");
};
