import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "", test: "The entrance and halts at the beginning and end of the test",                              coefficient: 1, directive: "" },
  { no: "2",  letters: "", test: "Free walk on a long rein (minimum 20m)",                                                   coefficient: 2, directive: "" },
  { no: "3",  letters: "", test: "Medium walk (minimum 10m)",                                                                coefficient: 1, directive: "" },
  { no: "4",  letters: "", test: "Collected trot half circle right followed by half circle left or vice versa",              coefficient: 1, directive: "" },
  { no: "5",  letters: "", test: "Collected trot shoulder in Right",                                                         coefficient: 2, directive: "" },
  { no: "6",  letters: "", test: "Collected trot shoulder in Left",                                                          coefficient: 2, directive: "" },
  { no: "7",  letters: "", test: "Medium Trot",                                                                              coefficient: 1, directive: "" },
  { no: "8",  letters: "", test: "Collected canter Right includes 10m circle",                                              coefficient: 1, directive: "" },
  { no: "9",  letters: "", test: "Collected canter Left includes 10m circle",                                               coefficient: 1, directive: "" },
  { no: "10", letters: "", test: "Collected canter Right one loop 10m using the entire length of the arena",                coefficient: 1, directive: "" },
  { no: "11", letters: "", test: "Collected canter Left one loop 10m using the entire length of the arena",                 coefficient: 1, directive: "" },
  { no: "12", letters: "", test: "Medium Canter Left",                                                                       coefficient: 2, directive: "" },
  { no: "13", letters: "", test: "Medium Canter Right",                                                                      coefficient: 2, directive: "" },
  { no: "14", letters: "", test: "Transition from collected to medium canter and from medium to collected canter",           coefficient: 2, directive: "" },
];

export const artisticMovements: Movement[] = [
  { no: "A1", letters: "", test: "Rhythm, energy and elasticity",                  coefficient: 4, directive: "" },
  { no: "A2", letters: "", test: "Harmony between rider and horse",                coefficient: 4, directive: "" },
  { no: "A3", letters: "", test: "Choreography. Use of arena. Inventiveness",      coefficient: 4, directive: "" },
  { no: "A4", letters: "", test: "Degree of difficulty. Calculated risks",         coefficient: 4, directive: "" },
  { no: "A5", letters: "", test: "Music and interpretation of the music",          coefficient: 4, directive: "" },
];

export const config: TestConfig = {
  label: "Young Rider Freestyle",
  appendix: "Appendix 'A'",
  abbr: "YR FS",
  subtitle: "Time: 5.30 min · Minimum age of horse: 4 years",
  movements,
  artisticMovements,
  hasCollective: false,
  otherErrorPenalty: 0.5,
};
