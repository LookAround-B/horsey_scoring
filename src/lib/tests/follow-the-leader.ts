import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",                    test: "Enter medium walk\nHalt, salute. Transition to trot through walk",  coefficient: 1, directive: "Straightness on centreline. Clarity of halt and salute. Smoothness of transitions." },
  { no: "2",  letters: "C\nCHEKA",                test: "Track left\nWorking trot on the track",                             coefficient: 1, directive: "Balance on turn. Regularity and energy of working trot." },
  { no: "3",  letters: "A\nAF(B)",                test: "Circle left 20 m\nContinue in working trot",                        coefficient: 1, directive: "Shape and size of circle. Bend, balance and regularity throughout." },
  { no: "4",  letters: "Before B",                test: "Transition to medium walk",                                         coefficient: 1, directive: "Smoothness and balance of downward transition. Rhythm of walk." },
  { no: "5",  letters: "BX\nXE",                  test: "Half circle left 10 m\nHalf circle right 10 m",                     coefficient: 1, directive: "Shape and accuracy of half circles. Fluency of change of bend and direction." },
  { no: "6",  letters: "After E",                 test: "Transition to working trot",                                        coefficient: 1, directive: "Promptness and balance of upward transition." },
  { no: "7",  letters: "(E)HCMBFA",               test: "Continue in working trot on the track",                             coefficient: 1, directive: "Regularity, energy and straightness on the track." },
  { no: "8",  letters: "A\nAKE",                  test: "Circle right 20 m\nContinue working trot",                          coefficient: 1, directive: "Shape and size of circle. Bend, balance and regularity throughout." },
  { no: "9",  letters: "Before E\nE\nB\nAfter B", test: "Medium walk\nTurn right\nTurn left\nMedium walk",                   coefficient: 1, directive: "Quality of medium walk. Accuracy and balance of turns. Straightness between turns." },
  { no: "10", letters: "(B)MCHKA",                test: "Working trot on the track",                                         coefficient: 1, directive: "Regularity, energy and straightness on the track." },
  { no: "11", letters: "A\nBefore X",             test: "Down centre line\nTransition to medium walk",                       coefficient: 1, directive: "Straightness on centreline. Smoothness of downward transition." },
  { no: "12", letters: "X",                       test: "Halt, immobility, salute",                                          coefficient: 1, directive: "Straightness and squareness of halt. Immobility. Clarity of salute." },
];

export const config: TestConfig = {
  label: "Follow the Leader",
  appendix: "KSEC Show",
  abbr: "FL",
  subtitle: "Follow the Leader Dressage · KSEC Show",
  movements,
  collectives: [
    { no: "1", label: "Harmony and co-operation of horse and rider",          coefficient: 2 },
    { no: "2", label: "Rider's position, correctness and effect of the aids", coefficient: 2 },
    { no: "3", label: "Quality of Paces",                                     coefficient: 2 },
    { no: "4", label: "Accuracy of figures",                                  coefficient: 1 },
  ],
};
