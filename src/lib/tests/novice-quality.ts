import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  {
    no: "1",
    letters: "",
    test: "Rider's position and seat",
    coefficient: 1,
    directive:
      "Seat: well balanced, elastic, in centre of saddle, absorbing movements of horse. Correct position of upper body, arm, elbow, hand, leg, heel.",
  },
  {
    no: "2",
    letters: "",
    test: "Effectiveness of aids",
    coefficient: 1,
    directive:
      "Influence of the aids on presentation of horse according to Scale of Training. Influence of aids on correct presentation of movements/paces. Sensitive use of aids. Independence of rider's seat.",
  },
  {
    no: "3",
    letters: "",
    test: "Precision",
    coefficient: 1,
    directive:
      "Preparation of movements. Accuracy of execution of figures. Execution of movements at markers prescribed. Maintenance of correct tempo.",
  },
  {
    no: "4",
    letters: "",
    test: "General impression",
    coefficient: 1,
    directive:
      "Harmony of presentation. Correctness of paces. Ability to present the horse favourably.",
  },
];

export const config: TestConfig = {
  label: "Novice – Quality",
  appendix: "KSEC Show",
  abbr: "NVQ",
  subtitle: "Novice Quality Marking Sheet · Max 40 · Combined with Technical score",
  movements,
  hasCollective: false,
  technicalCombined: true,
  otherErrorPenalty: 0.5,
};
