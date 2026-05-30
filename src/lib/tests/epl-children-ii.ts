import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",              test: "Enter in working trot\nHalt-immobility-Salute\nProceed in working trot",                                      coefficient: 1, directive: "" },
  { no: "2",  letters: "C\nE\nEKAF",       test: "Track to the left\nCircle trot to the left 15m diameter\nWorking trot",                                       coefficient: 1, directive: "" },
  { no: "3",  letters: "FXH\nHCMB",        test: "Change rein in working trot (Rising)\nWorking trot",                                                           coefficient: 1, directive: "" },
  { no: "4",  letters: "B\nBFA",           test: "Circle to the right 15m diameter\nWorking trot",                                                               coefficient: 1, directive: "" },
  { no: "5",  letters: "A",                test: "Transition to medium walk",                                                                                    coefficient: 1, directive: "" },
  { no: "6",  letters: "KB\n\nBR",         test: "Medium walk with lengthening of the frame\n\nMedium walk",                                                    coefficient: 1, directive: "" },
  { no: "7",  letters: "RMC",             test: "Working trot",                                                                                                  coefficient: 1, directive: "" },
  { no: "8",  letters: "C",               test: "Proceed in the working canter left",                                                                            coefficient: 1, directive: "" },
  { no: "9",  letters: "E",               test: "Circle to the left 20m diameter",                                                                               coefficient: 1, directive: "" },
  { no: "10", letters: "EKAF",            test: "Working canter",                                                                                                coefficient: 1, directive: "" },
  { no: "11", letters: "FB",              test: "Working trot",                                                                                                  coefficient: 1, directive: "" },
  { no: "12", letters: "BE\nEB\n\nBE\nEHC", test: "Half circle to the left 20m diameter\nChange of hand through an 'S' inside the 20m circle\n\nHalf circle to the right 20m diameter\nWorking trot", coefficient: 1, directive: "" },
  { no: "13", letters: "C\nCMB",          test: "Proceed in working canter right\nWorking canter",                                                               coefficient: 1, directive: "" },
  { no: "14", letters: "B\nBF",           test: "Circle to the right 20m diameter\nWorking canter",                                                             coefficient: 1, directive: "" },
  { no: "15", letters: "F",              test: "Working trot",                                                                                                   coefficient: 1, directive: "" },
  { no: "16", letters: "A\nI",           test: "Down center line\nHalt -immobility-salute",                                                                     coefficient: 1, directive: "" },
];

export const config: TestConfig = {
  label: "EPL Children II",
  appendix: "Appendix 'H'",
  abbr: "EPL Ch II",
  subtitle: "Snaffle bridle · Rising trot optional · Minimum age of horse: 4 years",
  movements,
  hasCollective: false,
};
