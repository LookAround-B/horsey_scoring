import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A",    test: "Enter medium walk",                                coefficient: 1, directive: "Straightness on centreline." },
  { no: "2",  letters: "X",    test: "Halt, Salute\nProceed in medium walk",             coefficient: 1, directive: "Rider's position & Clarity of salute." },
  { no: "3",  letters: "C\nH", test: "Track left\nTrot",                                 coefficient: 1, directive: "Rider's position & Balance on turn." },
  { no: "4",  letters: "S",    test: "Circle left 10 meters\nTrot",                      coefficient: 1, directive: "Rider's position & Balance on turns." },
  { no: "5",  letters: "E-B",  test: "Turn left to B",                                   coefficient: 1, directive: "Rider's position & Balance on turns." },
  { no: "6",  letters: "B-H",  test: "Across the short diagonal\nIn walk",               coefficient: 1, directive: "Consistency of walk & Straightness on diagonal line." },
  { no: "7",  letters: "C\nR", test: "Trot\nCircle right 10 meters",                     coefficient: 1, directive: "Rider's position & Balance on turns." },
  { no: "8",  letters: "B",    test: "Walk &\nTurn right to X",                          coefficient: 1, directive: "Rider's position & Balance on turns." },
  { no: "9",  letters: "X",    test: "Turn right to I",                                  coefficient: 1, directive: "Straightness on centreline." },
  { no: "10", letters: "I",    test: "Halt, Salute",                                     coefficient: 1, directive: "Rider's position & Clarity of salute." },
];

export const config: TestConfig = {
  label: "Lead Rein",
  appendix: "KSEC Show",
  abbr: "LR",
  subtitle: "Lead Rein Dressage Test · Max 130",
  movements,
  collectives: [
    { no: "1", label: "Rider's position",           coefficient: 1 },
    { no: "2", label: "Turnout of horse and rider", coefficient: 1 },
    { no: "3", label: "Overall impressions",        coefficient: 1 },
  ],
};
