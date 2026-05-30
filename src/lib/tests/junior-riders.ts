import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",           test: "Enter in working trot\nHalt - immobility - salute\nProceed in working trot",                                                           coefficient: 1, directive: "The quality of trot, straightness, halt and transitions." },
  { no: "2",  letters: "C\nMR\nRBP\nPF", test: "Track to the right\nWorking trot\nMedium trot\nWorking trot",                                                                         coefficient: 1, directive: "The regularity, straightness, groundcover and clear difference between working and medium trot." },
  { no: "3",  letters: "",               test: "Transitions from working trot to medium trot at R\nAnd from medium trot to working trot at P",                                       coefficient: 1, directive: "The clear definition and fluency of transitions." },
  { no: "4",  letters: "F\nD to B\nBRMCH", test: "Half circle 10m to D\nLeg - yielding\nWorking trot",                                                                               coefficient: 1, directive: "The regularity, Energy and correct positioning and control." },
  { no: "5",  letters: "HS\nSEV\nVK",    test: "Working trot\nMedium trot\nWorking trot",                                                                                             coefficient: 1, directive: "The regularity, straightness, groundcover and clear difference between working and medium trot." },
  { no: "6",  letters: "",              test: "Transitions from working trot to medium trot at S\nAnd from medium trot to working trot at V",                                        coefficient: 1, directive: "The clear definition and fluency of transitions." },
  { no: "7",  letters: "K\nD to E\nESHC", test: "Half circle 10m to D\nLeg - yielding\nWorking trot",                                                                                coefficient: 1, directive: "The regularity, Energy and correct positioning and control." },
  { no: "8",  letters: "C\n\nCM",        test: "Working canter right, and circle right 20m diameter\n\nWorking Canter",                                                              coefficient: 1, directive: "The fluency, balance of the transition and canter, shape and size of the circle." },
  { no: "9",  letters: "MR\nRBP\nPF",   test: "Working canter\nMedium canter\nWorking canter",                                                                                       coefficient: 1, directive: "The regularity, straightness, groundcover and clear difference between working and medium canter." },
  { no: "10", letters: "",             test: "Transitions from working canter to medium canter at R\nAnd from medium canter to working canter at P",                                 coefficient: 1, directive: "The clear definition and fluency of transitions" },
  { no: "11", letters: "F\n\nBRM",      test: "Half circle 10m to D, returning to the track at B\n\nCounter Canter",                                                                 coefficient: 1, directive: "The quality, regularity of the canter, balance and correct positioning of the counter canter." },
  { no: "12", letters: "M",            test: "Simple change of leg (through walk)",                                                                                                   coefficient: 1, directive: "The clear definition and fluency of transitions. The straightness." },
  { no: "13", letters: "MC\nC\nCH",    test: "Working canter\nCircle left 20m diameter\nWorking canter",                                                                             coefficient: 1, directive: "The fluency, balance of the transition and canter, shape and size of the circle." },
  { no: "14", letters: "CHS\nSEV\nVK", test: "Working canter\nMedium canter\nWorking canter",                                                                                        coefficient: 1, directive: "The regularity, straightness, groundcover and clear difference between working and medium canter." },
  { no: "15", letters: "",            test: "Transitions from working canter to medium canter at S\nAnd from medium canter to working canter at V",                                  coefficient: 1, directive: "The clear definition and fluency of transitions." },
  { no: "16", letters: "K\n\nESH",    test: "Half circle 10m to D, returning to the track at E\n\nCounter Canter",                                                                   coefficient: 1, directive: "The quality, regularity of the canter, balance and correct positioning of the counter canter." },
  { no: "17", letters: "H\nC",        test: "Working trot\nMedium walk",                                                                                                             coefficient: 1, directive: "The clear definition and fluency of transitions." },
  { no: "18", letters: "CM",         test: "Medium walk",                                                                                                                             coefficient: 1, directive: "The regularity and energy" },
  { no: "19", letters: "ME",         test: "Change the rein at free walk on a long rein",                                                                                            coefficient: 2, directive: "The regularity, relaxation and ground cover." },
  { no: "20", letters: "EV",         test: "Medium walk",                                                                                                                             coefficient: 1, directive: "The regularity and energy." },
  { no: "21", letters: "V\nVKA",     test: "Working trot\nWorking trot",                                                                                                             coefficient: 1, directive: "Transition and quality of the trot." },
  { no: "22", letters: "A\nG",       test: "Down the centre line\nHalt - immobility - salute",                                                                                       coefficient: 1, directive: "The straightness, balance and obedience." },
];

export const config: TestConfig = {
  label: "Junior Riders",
  appendix: "Appendix 'B'",
  abbr: "JR",
  subtitle: "Time: 4.45 min · Minimum age of horse: 4 years",
  movements,
  hasCollective: false,
};
