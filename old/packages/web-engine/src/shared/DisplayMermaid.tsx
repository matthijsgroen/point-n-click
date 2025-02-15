import mermaid from "mermaid";
import React, { useEffect, useState } from "react";

mermaid.initialize({
  startOnLoad: false,
  theme: "base",
  themeVariables: {
    darkMode: true,
    primaryColor: "#bb2528",
    primaryTextColor: "#fff",
    primaryBorderColor: "#ba4042",
    lineColor: "#f8b229",
    secondaryColor: "#006100",
    tertiaryColor: "#fff",
  },
});

const DisplayMermaid: React.FC<{
  diagram: string;
}> = ({ diagram }) => {
  const [image, setImage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    mermaid.parse(diagram).catch((error) => {
      setErrorMsg(error.message);
    });
    mermaid.render("graphDiv", diagram).then(({ svg }) => {
      setImage(svg);
    });
  }, [diagram]);

  return (
    <div style={{ position: "relative", width: "100%" }}>
      {errorMsg && <p>{errorMsg}</p>}
      <div
        style={{ position: "absolute", top: 0, left: 0, width: "100%" }}
        dangerouslySetInnerHTML={{ __html: image }}
      ></div>
    </div>
  );
};

export default DisplayMermaid;
