import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX\nXC",    test: "Enter in working trot\nHalt (allowed through 2-4 walk steps), salute\nContinue working trot (allowed through 2-4 walk steps)", coefficient: 1, directive: "Fluency, immobility and balance in halt, transitions. Contact." },
  { no: "2",  letters: "C\nCHE",      test: "Track left\nWorking trot",                                                                                                      coefficient: 1, directive: "Energy of trot, correct flexion in the corner." },
  { no: "3",  letters: "E\nEKA",      test: "Circle left 20m in working trot\nContinue working trot",                                                                        coefficient: 1, directive: "Correct shape and size of the circle, rhythm and energy of the trot." },
  { no: "4",  letters: "AF\nFXH\nHC", test: "Working trot\nChange rein in working trot on a diagonal\nWorking trot",                                                         coefficient: 1, directive: "Rhythm and energy of trot, correct riding of corners." },
  { no: "5",  letters: "CMB",         test: "Working trot",                                                                                                                  coefficient: 1, directive: "Energy of trot, correct flexion in the corner." },
  { no: "6",  letters: "B\nBFA",      test: "Circle right 20m in working trot\nContinue working trot",                                                                       coefficient: 1, directive: "Correct shape and size of the circle, rhythm and energy of the trot." },
  { no: "7",  letters: "AK\nK\nKV",   test: "Working trot\nTransition to medium walk\nMedium walk",                                                                          coefficient: 2, directive: "Fluency of transition, correct rhythm and relaxation in walk." },
  { no: "8",  letters: "VXS",         test: "Medium walk",                                                                                                                   coefficient: 1, directive: "Correct line through X." },
  { no: "9",  letters: "SH\nH\nHC",   test: "Medium walk\nTransition to working trot\nWorking trot",                                                                         coefficient: 2, directive: "Fluency of transition, correct rhythm and relaxation in walk." },
  { no: "10", letters: "CM\nMXK\nKA", test: "Working trot\nChange rein in working trot on a diagonal\nWorking trot",                                                         coefficient: 1, directive: "Rhythm and energy of trot, correct riding of corners." },
  { no: "11", letters: "A\nX",        test: "Down centre line\nHalt (allowed through 2-4 walk steps), salute",                                                               coefficient: 1, directive: "Fluency, immobility and balance in halt, transitions. Contact." },
];

export const config: TestConfig = {
  label: "Introductory",
  appendix: "KSEC Show",
  abbr: "IN",
  subtitle: "Time 3:30 · Max 190 · Arena 20×60 · Snaffle bridle, rising trot allowed",
  movements,
  nfLabel: "Nat",
  showHno: true,
  collectives: [
    { no: "1", label: "Harmony and co-operation of horse and rider",   coefficient: 3 },
    { no: "2", label: "Rider's position, correctness and effect of the aids", coefficient: 2 },
    { no: "3", label: "Accuracy of figures and corners",               coefficient: 1 },
  ],
};
