import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "", test: "The entrance and halts at the beginning and the end of the test",  coefficient: 1, directive: "" },
  { no: "2",  letters: "", test: "Free walk on a long rein (minimum 20m)",                           coefficient: 2, directive: "" },
  { no: "3",  letters: "", test: "Medium walk (minimum 10m)",                                        coefficient: 2, directive: "" },
  { no: "4",  letters: "", test: "Working trot including 10m circle Right",                         coefficient: 1, directive: "" },
  { no: "5",  letters: "", test: "Working trot including 10m circle Left",                          coefficient: 1, directive: "" },
  { no: "6",  letters: "", test: "Leg yielding Right in trot",                                      coefficient: 2, directive: "" },
  { no: "7",  letters: "", test: "Leg yielding Left in trot",                                       coefficient: 2, directive: "" },
  { no: "8",  letters: "", test: "Medium trot sitting/Rising",                                      coefficient: 1, directive: "" },
  { no: "9",  letters: "", test: "Working canter including 20m circle Right",                       coefficient: 1, directive: "" },
  { no: "10", letters: "", test: "Working canter including 20m circle Left",                        coefficient: 1, directive: "" },
  { no: "11", letters: "", test: "Medium Canter",                                                    coefficient: 2, directive: "" },
  { no: "12", letters: "", test: "Simple change of lead from left to right",                        coefficient: 2, directive: "" },
  { no: "13", letters: "", test: "Simple change of lead from right to left",                        coefficient: 2, directive: "" },
];

export const artisticMovements: Movement[] = [
  { no: "A1", letters: "", test: "Rhythm, energy and elasticity",                  coefficient: 4, directive: "" },
  { no: "A2", letters: "", test: "Harmony between rider and horse",                coefficient: 4, directive: "" },
  { no: "A3", letters: "", test: "Choreography. Use of arena. Inventiveness",      coefficient: 4, directive: "" },
  { no: "A4", letters: "", test: "Degree of difficulty. Calculated risks",         coefficient: 4, directive: "" },
  { no: "A5", letters: "", test: "Music and interpretation of the music",          coefficient: 4, directive: "" },
];

export const config: TestConfig = {
  label: "Junior Rider Freestyle",
  appendix: "Appendix 'B'",
  abbr: "JR FS",
  subtitle: "Time: 4.45 min · Minimum age of horse: 4 years",
  movements,
  artisticMovements,
  hasCollective: false,
  otherErrorPenalty: 0.5,
};
