import { Doll } from "../../types/doll";

const hiddo: Doll = {
  size: [800, 600],
  name: "hiddo",
  type: "imagestack",
  layers: ["body", "expression"],
  images: {
    body: {
      default: "body.png",
      fists: "body-fists.png",
      open: "body-arms-open.png",
      chin: "body-chin.png",
      wave: "body-wave.png",
    },
    expression: {
      happy: "01.png",
      shocked: "02.png",
      enthusiastic: "03.png",
      "very-enthusiastic": "04.png",
      "mouth-closed": "05.png",
      question: "06.png",
      sip: "07.png",
      think: "08.png",
    },
  },
};

export default hiddo;
