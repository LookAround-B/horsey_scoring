import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",          test: "Enter in working trot\nHalt-immobility-Salute\nProceed in working trot",                                                                                           coefficient: 1, directive: "The entry, straightness, halt and transitions." },
  { no: "2",  letters: "C\nEKAF",       test: "Track to the left\nCircle trot to the left 15m diameter\nWorking trot",                                                                                           coefficient: 1, directive: "The quality of trot, bend and regularity of the circle." },
  { no: "3",  letters: "FXH\nHCMB",    test: "Change rein in working trot (Rising)\nWorking trot",                                                                                                               coefficient: 1, directive: "The regularity of the trot and straightness on the diagonal." },
  { no: "4",  letters: "B\nBFA",        test: "Circle to the right 15m diameter\nWorking trot",                                                                                                                   coefficient: 1, directive: "The bend, quality and regularity of the circle." },
  { no: "5",  letters: "A",             test: "Transition to medium walk",                                                                                                                                        coefficient: 1, directive: "The clarity and fluency of the transition." },
  { no: "6",  letters: "KB",            test: "Medium walk with lengthening of the frame",                                                                                                                        coefficient: 1, directive: "The regularity, groundcover and lengthening of the frame." },
  { no: "7",  letters: "BR\nRMC",       test: "Medium walk\nWorking trot",                                                                                                                                        coefficient: 1, directive: "The quality of the walk and fluency of the transition." },
  { no: "8",  letters: "C",             test: "Proceed in the working canter left",                                                                                                                               coefficient: 1, directive: "The fluency and balance of the transition." },
  { no: "9",  letters: "E",             test: "Circle to the left 20m diameter",                                                                                                                                  coefficient: 1, directive: "The regularity, bend and balance of the canter circle." },
  { no: "10", letters: "EKAF",          test: "Working canter",                                                                                                                                                   coefficient: 1, directive: "The quality and regularity of the canter." },
  { no: "11", letters: "FB",            test: "Working trot",                                                                                                                                                     coefficient: 1, directive: "The fluency of the downward transition and quality of the trot." },
  { no: "12", letters: "BE\nEB\nBE\nEHC", test: "Half circle to the left 20m diameter\nChange of hand through an \"S\" inside the 20m circle\nHalf circle to the right 20m diameter\nWorking trot",             coefficient: 1, directive: "The regularity, balance and fluency of the changes of direction." },
  { no: "13", letters: "C\nCMB",        test: "Proceed in working canter right\nWorking canter",                                                                                                                  coefficient: 1, directive: "The fluency and balance of the transition and canter." },
  { no: "14", letters: "B\nBFA",        test: "Circle to the right 20m diameter\nWorking canter",                                                                                                                 coefficient: 1, directive: "The regularity, bend and balance of the canter circle." },
  { no: "15", letters: "F",             test: "Working trot",                                                                                                                                                     coefficient: 1, directive: "The fluency of the downward transition." },
  { no: "16", letters: "A\nI",          test: "Down centre line\nHalt-immobility-salute\nLeave the arena in walk on a long rein",                                                                                 coefficient: 1, directive: "The straightness, transitions and quality of the halt." },
];

export const config: TestConfig = {
  label: "Preliminary",
  appendix: "Appendix H",
  abbr: "PL",
  subtitle: "Preliminary Dressage Test",
  movements,
  hasCollective: false,
  nfLabel: "EFI Reg No",
};
