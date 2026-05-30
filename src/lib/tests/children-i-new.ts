import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",           test: "Enter in working trot\nHalt - immobility - salute\nProceed in collected trot",                                           coefficient: 1, directive: "The quality of trot, straightness, halt and transitions." },
  { no: "2",  letters: "C\nE",           test: "Track to the left\nTurn left",                                                                                           coefficient: 1, directive: "The regularity, bend and balance" },
  { no: "3",  letters: "X\n\nX",         test: "Circle Left 10m\n\nCircle Right 10m",                                                                                    coefficient: 1, directive: "The regularity, bend and balance including the fluency of the change of bend and direction." },
  { no: "4",  letters: "XBFA",          test: "Working Trot",                                                                                                            coefficient: 1, directive: "The regularity, balance and energy." },
  { no: "5",  letters: "AC",            test: "Serpentine four equal loops touching each side of the arena",                                                              coefficient: 1, directive: "The regularity, balance and energy including the fluency of the changes of direction." },
  { no: "6",  letters: "Between C&H",   test: "Working Canter left",                                                                                                    coefficient: 1, directive: "The fluency and balance of the transition and canter." },
  { no: "7",  letters: "E\nEKAF",       test: "Circle left 15m diameter\nWorking Canter",                                                                               coefficient: 1, directive: "The quality of the canter, shape and size of the circle." },
  { no: "8",  letters: "FXHC",         test: "On the diagonal at X working trot, between H&C working canter right",                                                     coefficient: 1, directive: "The balance, fluency of this transition and straightness." },
  { no: "9",  letters: "CB",           test: "Working canter",                                                                                                           coefficient: 1, directive: "The quality of the canter and straightness." },
  { no: "10", letters: "B",            test: "Circle right 15m diameter",                                                                                               coefficient: 1, directive: "The quality of the canter, shape and size of the circle." },
  { no: "11", letters: "BFA",          test: "Working canter",                                                                                                           coefficient: 1, directive: "The quality of the canter." },
  { no: "12", letters: "A\nK",         test: "Working trot\nMedium walk",                                                                                               coefficient: 1, directive: "The balance, fluency of transitions." },
  { no: "13", letters: "KE",           test: "Medium walk",                                                                                                             coefficient: 1, directive: "The regularity and groundcover." },
  { no: "14", letters: "EB",           test: "Half circle 20 meters diameter free walk on a long rein",                                                                coefficient: 2, directive: "The regularity and groundcover. The lengthening of the frame." },
  { no: "15", letters: "BF\nF",        test: "Medium Walk\nWorking Trot",                                                                                               coefficient: 1, directive: "The quality of the walk, transition and trot." },
  { no: "16", letters: "A\nG",         test: "Down the centre line\nHalt - immobility - salute",                                                                        coefficient: 1, directive: "The quality of the trot, straightness and balance into the halt." },
];

export const config: TestConfig = {
  label: "Children I",
  appendix: "Appendix 'C'",
  abbr: "Ch I",
  subtitle: "Time: 5.30 min · Minimum age of horse: 4 years",
  movements,
  hasCollective: false,
};
