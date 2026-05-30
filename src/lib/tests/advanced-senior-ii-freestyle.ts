import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "", test: "The entrance and halts at the beginning and the end of the test",  coefficient: 1, directive: "" },
  { no: "2",  letters: "", test: "Collected walk (minimum 10m)",                                      coefficient: 2, directive: "" },
  { no: "3",  letters: "", test: "Extended walk (minimum 20m)",                                       coefficient: 2, directive: "" },
  { no: "4",  letters: "", test: "Collected Walk Half Pirouette to Left or Right",                    coefficient: 1, directive: "" },
  { no: "5",  letters: "", test: "Extended trot",                                                     coefficient: 1, directive: "" },
  { no: "6",  letters: "", test: "Collected trot – shoulder-in right",                               coefficient: 1, directive: "" },
  { no: "7",  letters: "", test: "Collected trot – shoulder-in left",                                coefficient: 1, directive: "" },
  { no: "8",  letters: "", test: "Collected trot – half pass right",                                 coefficient: 2, directive: "" },
  { no: "9",  letters: "", test: "Collected trot – half pass left",                                  coefficient: 2, directive: "" },
  { no: "10", letters: "", test: "Extended canter",                                                   coefficient: 1, directive: "" },
  { no: "11", letters: "", test: "Collected canter – half pass right",                               coefficient: 1, directive: "" },
  { no: "12", letters: "", test: "Collected canter – half pass left",                                coefficient: 1, directive: "" },
  { no: "13", letters: "", test: "Flying changes of leg from right to left",                         coefficient: 2, directive: "" },
  { no: "14", letters: "", test: "Flying changes of leg from left to right",                         coefficient: 2, directive: "" },
];

export const artisticMovements: Movement[] = [
  { no: "A1", letters: "", test: "Rhythm, energy and elasticity",                  coefficient: 4, directive: "" },
  { no: "A2", letters: "", test: "Harmony between rider and horse",                coefficient: 4, directive: "" },
  { no: "A3", letters: "", test: "Choreography. Use of arena. Inventiveness",      coefficient: 4, directive: "" },
  { no: "A4", letters: "", test: "Degree of difficulty. Calculated risks",         coefficient: 4, directive: "" },
  { no: "A5", letters: "", test: "Music and interpretation of the music",          coefficient: 4, directive: "" },
];

export const config: TestConfig = {
  label: "Advanced / Senior II Freestyle",
  appendix: "Appendix 'C'",
  abbr: "AS2 FS",
  subtitle: "Time: 4:30–5:00 min · Minimum age of horse: 6 years",
  movements,
  artisticMovements,
  hasCollective: false,
  otherErrorPenalty: 0.5,
};
