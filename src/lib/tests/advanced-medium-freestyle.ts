import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "", test: "The entrance and halts at the beginning and the end of the test",  coefficient: 1, directive: "" },
  { no: "2",  letters: "", test: "Medium walk (minimum 10m consecutive)",                             coefficient: 1, directive: "" },
  { no: "3",  letters: "", test: "Extended walk (minimum 20m consecutive)",                           coefficient: 2, directive: "" },
  { no: "4",  letters: "", test: "Turn on the haunches Left",                                         coefficient: 1, directive: "" },
  { no: "5",  letters: "", test: "Turn on the haunches Right",                                        coefficient: 2, directive: "" },
  { no: "6",  letters: "", test: "Extended trot",                                                     coefficient: 1, directive: "" },
  { no: "7",  letters: "", test: "Collected trot – shoulder-in right",                               coefficient: 2, directive: "" },
  { no: "8",  letters: "", test: "Collected trot – shoulder-in left",                                coefficient: 2, directive: "" },
  { no: "9",  letters: "", test: "Extended canter",                                                   coefficient: 1, directive: "" },
  { no: "10", letters: "", test: "Simple change of lead from left to right",                         coefficient: 1, directive: "" },
  { no: "11", letters: "", test: "Simple change of lead from right to left",                         coefficient: 1, directive: "" },
  { no: "12", letters: "", test: "Flying change of leg from right to left",                          coefficient: 2, directive: "" },
  { no: "13", letters: "", test: "Flying change of leg from left to right",                          coefficient: 2, directive: "" },
];

export const artisticMovements: Movement[] = [
  { no: "A1", letters: "", test: "Rhythm, energy and elasticity",                  coefficient: 4, directive: "" },
  { no: "A2", letters: "", test: "Harmony between rider and horse",                coefficient: 4, directive: "" },
  { no: "A3", letters: "", test: "Choreography. Use of arena. Inventiveness",      coefficient: 4, directive: "" },
  { no: "A4", letters: "", test: "Degree of difficulty. Calculated risks",         coefficient: 4, directive: "" },
  { no: "A5", letters: "", test: "Music and interpretation of the music",          coefficient: 4, directive: "" },
];

export const config: TestConfig = {
  label: "Advanced Medium Freestyle",
  appendix: "Appendix 'D'",
  abbr: "AM FS",
  subtitle: "Time Allowed: 4:30–5:00 min · Minimum age of horse: 6 years",
  movements,
  artisticMovements,
  hasCollective: false,
  otherErrorPenalty: 0.5,
};
