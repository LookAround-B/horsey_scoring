import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",              test: "Enter in working trot\nHalt – immobility – salute\nProceed in working trot",                                    coefficient: 1, directive: "The quality of trot, straightness, halt and transitions." },
  { no: "2",  letters: "C\nE",              test: "Track to the left\nTurn left",                                                                                   coefficient: 1, directive: "The regularity, bend and balance." },
  { no: "3",  letters: "X\nX",              test: "Circle left 10 m\nCircle right 10 m",                                                                            coefficient: 1, directive: "The regularity, bend and balance including the fluency of the change of bend and direction." },
  { no: "4",  letters: "X B F A",           test: "Working trot",                                                                                                   coefficient: 1, directive: "The regularity, balance and energy." },
  { no: "5",  letters: "A C",               test: "Serpentine four equal loops touching each side of the arena",                                                    coefficient: 1, directive: "The regularity, balance and energy including the fluency of the changes of direction." },
  { no: "6",  letters: "Between C&H\nH E",  test: "Working canter left\nWorking canter",                                                                            coefficient: 1, directive: "The fluency and balance of the transition and canter." },
  { no: "7",  letters: "E\nE K A F",        test: "Circle left 15 m diameter\nWorking canter",                                                                      coefficient: 1, directive: "The quality of the canter, shape and size of the circle." },
  { no: "8",  letters: "F X H C",           test: "On the diagonal at X working trot, between H&C working canter right",                                           coefficient: 1, directive: "The balance, fluency of this transition and straightness." },
  { no: "9",  letters: "C B",               test: "Working canter",                                                                                                 coefficient: 1, directive: "The quality of the canter and straightness." },
  { no: "10", letters: "B",                 test: "Circle right 15 m diameter",                                                                                     coefficient: 1, directive: "The quality of the canter, shape and size of the circle." },
  { no: "11", letters: "B F A",             test: "Working canter",                                                                                                 coefficient: 1, directive: "The quality of the canter." },
  { no: "12", letters: "A\nK",              test: "Working trot\nMedium walk",                                                                                      coefficient: 1, directive: "The balance, fluency of transitions." },
  { no: "13", letters: "K E",               test: "Medium walk",                                                                                                    coefficient: 1, directive: "The regularity and groundcover." },
  { no: "14", letters: "E B",               test: "Half circle 20 m diameter free walk on a long rein",                                                             coefficient: 1, directive: "The regularity and groundcover. The lengthening of the frame." },
  { no: "15", letters: "B F\nF",            test: "Medium walk\nWorking trot",                                                                                      coefficient: 1, directive: "The quality of the walk, transition and trot." },
];

export const config: TestConfig = {
  label: "Pre Novice",
  appendix: "Appendix G",
  abbr: "PN",
  subtitle: "Time 4 min · Minimum age of horse: 4 years",
  movements,
};
