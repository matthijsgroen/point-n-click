import { Doll } from "../../../types/doll";
import exp1 from "url:./02_expression/01.png";
import exp2 from "url:./02_expression/02.png";
import exp3 from "url:./02_expression/03.png";
import exp4 from "url:./02_expression/04.png";
import exp5 from "url:./02_expression/05.png";

import bodyDefault from "url:./01_body/body.png";
import bodyChin from "url:./01_body/chin.png";
import bodyFists from "url:./01_body/body-fists.png";

const hiddo: Doll = {
  size: [600, 800],
  name: "hiddo",
  type: "imagestack",
  layers: ["body", "expression"],
  images: {
    body: {
      default: bodyDefault,
      fists: bodyFists,
      open: "body-arms-open.png",
      chin: bodyChin,
      wave: "body-wave.png",
    },
    expression: {
      happy: exp1,
      shocked: exp2,
      enthusiastic: exp3,
      "very-enthusiastic": exp4,
      "mouth-closed": exp5,
      question: "06.png",
      sip: "07.png",
      think: "08.png",
    },
  },
};

export default hiddo;
