import mermaid from "mermaid";
import React, { useEffect, useState } from "react";

mermaid.initialize({ startOnLoad: false, theme: "dark" });

const DisplayMermaid: React.FC<{
  diagram: string;
}> = ({ diagram }) => {
  const [image, setImage] = useState("");
  useEffect(() => {
    mermaid.render("graphDiv", diagram).then(({ svg }) => {
      setImage(svg);
    });
  }, [diagram]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <div
        style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
        dangerouslySetInnerHTML={{ __html: image }}
      ></div>
    </div>
  );
};

export default DisplayMermaid;
