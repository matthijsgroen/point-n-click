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

  return <div dangerouslySetInnerHTML={{ __html: image }}></div>;
};

export default DisplayMermaid;
