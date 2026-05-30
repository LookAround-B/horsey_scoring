import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "", test: "The entrance and halts at the beginning and the end of the test",  coefficient: 1, directive: "" },
  { no: "2",  letters: "", test: "Free walk on a long rein (minimum 20m)",                           coefficient: 1, directive: "" },
  { no: "3",  letters: "", test: "Medium walk (minimum 10m)",                                        coefficient: 1, directive: "" },
  { no: "4",  letters: "", test: "Working trot – including 10m circle right",                       coefficient: 1, directive: "" },
  { no: "5",  letters: "", test: "Working trot – including 10m circle left",                        coefficient: 1, directive: "" },
  { no: "6",  letters: "", test: "Trot moderate lengthened steps (left and right)",                 coefficient: 1, directive: "" },
  { no: "7",  letters: "", test: "Leg yield – right",                                               coefficient: 1, directive: "" },
  { no: "8",  letters: "", test: "Leg yield – left",                                                coefficient: 1, directive: "" },
  { no: "9",  letters: "", test: "Working canter – moderately lengthened strides",                  coefficient: 1, directive: "" },
  { no: "10", letters: "", test: "Working canter – 15m circle - right",                             coefficient: 1, directive: "" },
  { no: "11", letters: "", test: "Working canter – 15m circle - left",                              coefficient: 1, directive: "" },
  { no: "12", letters: "", test: "Change of lead through trot left to right",                       coefficient: 1, directive: "" },
  { no: "13", letters: "", test: "Change of lead through trot right to left",                       coefficient: 1, directive: "" },
];

export const artisticMovements: Movement[] = [
  { no: "A1", letters: "", test: "Rhythm, energy and elasticity",                  coefficient: 3, directive: "" },
  { no: "A2", letters: "", test: "Harmony between rider and horse",                coefficient: 3, directive: "" },
  { no: "A3", letters: "", test: "Choreography. Use of arena. Inventiveness",      coefficient: 4, directive: "" },
  { no: "A4", letters: "", test: "Choice of music and interpretation of the music", coefficient: 3, directive: "" },
];

export const config: TestConfig = {
  label: "Elementary Freestyle",
  appendix: "Appendix 'F'",
  abbr: "Elem FS",
  subtitle: "Time Allowed: 4:00–4:30 min · Minimum age of horse: 5 years",
  movements,
  artisticMovements,
  hasCollective: false,
  otherErrorPenalty: 0.5,
};
