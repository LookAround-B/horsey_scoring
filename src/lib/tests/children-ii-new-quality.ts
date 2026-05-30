import { type TestConfig } from "./types";

export const config: TestConfig = {
  label: "Children II – Quality",
  appendix: "Appendix 'D'",
  abbr: "Ch II Q",
  subtitle: "Quality Marking Sheet · Combined with Technical score",
  movements: [
    { no: "1", letters: "", test: "Rider's position and seat.\nSeat: well balanced, elastic, in centre of saddle, absorbing movements of horse. Correct position of upper body, arm, elbow, hand, leg, heel.", coefficient: 1, directive: "" },
    { no: "2", letters: "", test: "Effectiveness of aids.\nInfluence of the aids on presentation of horse accord. to 'Scale of Training'. Influence of aids on correct presentation of movements/paces. Sensitive use of aids. Independence of rider's seat", coefficient: 1, directive: "" },
    { no: "3", letters: "", test: "Precision.\nPreparation of movements. Accuracy of execution of figures. Execution of movements at markers prescribed. Maintenance of correct tempo.", coefficient: 1, directive: "" },
    { no: "4", letters: "", test: "General impression.\nHarmony of presentation. Correctness of paces. Ability to present the horse favourably.", coefficient: 1, directive: "" },
  ],
  hasCollective: false,
  technicalCombined: true,
  otherErrorPenalty: 0.5,
};
