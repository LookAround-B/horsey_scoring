import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",        test: "Enter in working trot\nHalt - immobility - salute\nProceed in collected trot",                                                                coefficient: 1, directive: "The quality of trot, straightness, halt and transitions." },
  { no: "2",  letters: "C\nHSE",      test: "Track to the left\nShoulder-in left",                                                                                                        coefficient: 1, directive: "The angle, uniform bend and regularity." },
  { no: "3",  letters: "EX\nXB",      test: "Half circle left 10 m\nHalf circle right 10 m",                                                                                              coefficient: 1, directive: "The regularity, balance and correct bend. The fluency of the changes of bend and direction." },
  { no: "4",  letters: "BPF\nFAK",   test: "Shoulder-in right\nCollected trot",                                                                                                           coefficient: 1, directive: "The angle, uniform bend and regularity." },
  { no: "5",  letters: "KR\nRMC",    test: "Change rein in medium trot\nCollected trot",                                                                                                  coefficient: 1, directive: "The regularity, groundcover, lengthening of the frame and transitions." },
  { no: "6",  letters: "C",          test: "Halt – immobility 4 seconds\nProceed in collected trot",                                                                                     coefficient: 1, directive: "The balance, squareness, straightness and transition." },
  { no: "7",  letters: "CH\nHP\nPFA", test: "Collected trot\nChange rein in medium trot\nCollected trot",                                                                                 coefficient: 1, directive: "The regularity, groundcover, lengthening of the frame and transitions. The clear definition and fluency of transition." },
  { no: "8",  letters: "AKV\nVXR\nRM", test: "Medium walk\nChange rein at free walk on a long rein\nMedium walk",                                                                        coefficient: 2, directive: "The regularity, energy in medium walk, relaxation and groundcover in free walk." },
  { no: "9",  letters: "M\nMC",      test: "Collected canter left\nCollected canter",                                                                                                    coefficient: 1, directive: "The balance, fluency and quality of the canter." },
  { no: "10", letters: "C\nCH",      test: "Circle left 10 m diameter\nCollected canter",                                                                                               coefficient: 1, directive: "The balance, fluency and quality of the canter. The shape and size of the circle." },
  { no: "11", letters: "HXK\nKAF",   test: "One loop of 10 m\nCollected canter",                                                                                                        coefficient: 1, directive: "The balance, fluency and quality of the canter. The design of the loop." },
  { no: "12", letters: "FPBR\nRMC",  test: "Medium Canter\nCollected Canter",                                                                                                           coefficient: 1, directive: "The straightness, balance and groundcover" },
  { no: "13", letters: "",           test: "Transitions from collected canter to medium canter at F\nAnd from medium canter to collected canter at R",                                  coefficient: 1, directive: "The clear definition and fluency of transitions." },
  { no: "14", letters: "C\nJust before X\nJust after X\nA", test: "Down the centre line\nCollected trot\nCollected canter right\nTrack right",                                         coefficient: 1, directive: "The clear definition and fluency of transitions. The straightness." },
  { no: "15", letters: "AK\nKXH\nHCM", test: "Collected canter\nOne loop of 10 m\nCollected canter",                                                                                   coefficient: 1, directive: "The balance, fluency and quality of the canter. The design of the loop." },
  { no: "16", letters: "MRBP\nPFA",  test: "Medium canter\nCollected canter",                                                                                                           coefficient: 1, directive: "The straightness, balance and groundcover" },
  { no: "17", letters: "",          test: "Transitions from collected canter to medium canter\nAnd from medium canter to collected canter",                                             coefficient: 1, directive: "The clear definition and fluency of transition." },
  { no: "18", letters: "A",         test: "Circle right 10 m diameter",                                                                                                                 coefficient: 1, directive: "The balance, fluency and quality of the canter. The shape & size of the circle." },
  { no: "19", letters: "AKVEX\nX\nXBRMC", test: "Collected canter\nSimple change of leg (through walk)\nCollected canter",                                                             coefficient: 1, directive: "The clear definition and fluency of transition. The straightness" },
  { no: "20", letters: "C\nCHSE\nE\nX", test: "Working trot\nWorking trot\nTurn left\nTurn left",                                                                                    coefficient: 1, directive: "The balance, fluency of transitions and the turns." },
  { no: "21", letters: "G",         test: "Halt - immobility - salute",                                                                                                                 coefficient: 1, directive: "The straightness and obedience." },
];

export const config: TestConfig = {
  label: "Young Riders",
  appendix: "Appendix 'A'",
  abbr: "YR",
  subtitle: "Time: 5.30 min · Minimum age of horse: 4 years",
  movements,
  hasCollective: false,
};
