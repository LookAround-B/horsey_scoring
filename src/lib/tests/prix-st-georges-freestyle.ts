import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "", test: "Collected walk (minimum 20 m)",                                                    coefficient: 1, directive: "" },
  { no: "2",  letters: "", test: "Extended walk (minimum 20 m)",                                                     coefficient: 2, directive: "" },
  { no: "3",  letters: "", test: "Shoulder-in right (collected trot) (minimum 12 m)",                                coefficient: 1, directive: "" },
  { no: "4",  letters: "", test: "Shoulder-in left (collected trot) (minimum 12 m)",                                 coefficient: 1, directive: "" },
  { no: "5",  letters: "", test: "Half-pass right (collected trot)",                                                  coefficient: 2, directive: "" },
  { no: "6",  letters: "", test: "Half-pass left (collected trot)",                                                   coefficient: 2, directive: "" },
  { no: "7",  letters: "", test: "Extended trot",                                                                    coefficient: 1, directive: "" },
  { no: "8",  letters: "", test: "Half-pass right (collected canter)",                                               coefficient: 1, directive: "" },
  { no: "9",  letters: "", test: "Half-pass left (collected canter)",                                                coefficient: 1, directive: "" },
  { no: "10", letters: "", test: "Extended canter",                                                                   coefficient: 1, directive: "" },
  { no: "11", letters: "", test: "Flying changes every fourth stride (minimum 5 times consecutively)",               coefficient: 1, directive: "" },
  { no: "12", letters: "", test: "Flying changes every third stride (minimum 5 times consecutively)",                coefficient: 1, directive: "" },
  { no: "13", letters: "", test: "Half pirouette in canter right",                                                   coefficient: 2, directive: "" },
  { no: "14", letters: "", test: "Half pirouette in canter left",                                                    coefficient: 2, directive: "" },
  { no: "15", letters: "", test: "The entrance and halts at the beginning and the end of the test",                  coefficient: 1, directive: "" },
];

export const artisticMovements: Movement[] = [
  { no: "A1", letters: "", test: "Rhythm, energy and elasticity",                  coefficient: 4, directive: "" },
  { no: "A2", letters: "", test: "Harmony between rider and horse",                coefficient: 4, directive: "" },
  { no: "A3", letters: "", test: "Choreography. Use of arena. Inventiveness",      coefficient: 4, directive: "" },
  { no: "A4", letters: "", test: "Degree of difficulty. Calculated risks",         coefficient: 4, directive: "" },
  { no: "A5", letters: "", test: "Music and interpretation of the music",          coefficient: 4, directive: "" },
];

export const config: TestConfig = {
  label: "Prix St. Georges Freestyle",
  appendix: "Appendix 'B'",
  abbr: "PSG FS",
  subtitle: "Performance: 4′30″–5′00″ · Minimum age of horse: 7 years",
  movements,
  artisticMovements,
  hasCollective: false,
  otherErrorPenalty: 0.5,
};
