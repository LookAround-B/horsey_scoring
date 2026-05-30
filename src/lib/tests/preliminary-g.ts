import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",      test: "Enter in working trot *\nHalt - immobility - salute\nProceed in working trot",                                                            coefficient: 1, directive: "The quality of the trot. The entry, the straightness, the halt and the transitions." },
  { no: "2",  letters: "C\nE\nEKAF", test: "Track to the left\nCircle to the left 12 m diameter\nWorking trot",                                                                     coefficient: 1, directive: "The regularity and the balance. The bend and the quality of the circle." },
  { no: "3",  letters: "FXH\n\nHCMB", test: "Change rein. Before X medium walk, 7 to 10 steps, after X working trot.\n\nWorking trot",                                             coefficient: 1, directive: "The transitions, the fluency and the quality of the walk." },
  { no: "4",  letters: "B\nBFA",    test: "Circle to the right 12 m diameter\nWorking trot",                                                                                         coefficient: 1, directive: "The regularity and the balance. The bend and the quality of the circle." },
  { no: "5",  letters: "A",         test: "Halt 4 seconds - immobility.\nProceed in medium walk",                                                                                   coefficient: 1, directive: "The transition, the halt." },
  { no: "6",  letters: "KB\n\nBR",  test: "Change rein in medium walk, lengthen the reins and allow the horse to stretch on a long rein\n\nShorten the reins",                     coefficient: 1, directive: "The rhythm and activity of the steps, the lengthening of the frame. The fluency of the shortening of the reins and the maintenance of the activity and the quality of the walk." },
  { no: "7",  letters: "RMC",       test: "Working trot",                                                                                                                            coefficient: 1, directive: "The transitions. The quality of the trot" },
  { no: "8",  letters: "C",         test: "Proceed in working canter left",                                                                                                          coefficient: 1, directive: "The transitions and the balance." },
  { no: "9",  letters: "E",         test: "Circle to the left 15 m diameter",                                                                                                       coefficient: 1, directive: "The bend, the regularity of the circle and the quality of the canter." },
  { no: "10", letters: "EKAFB",    test: "Working canter",                                                                                                                            coefficient: 1, directive: "The quality of the canter." },
  { no: "11", letters: "B",        test: "Working trot",                                                                                                                             coefficient: 1, directive: "The transition. The quality of the trot" },
  { no: "12", letters: "CA",       test: "Serpentine 4 loops",                                                                                                                       coefficient: 2, directive: "The bend, the correctness of the loops and the straightness of the lines between the loops." },
  { no: "13", letters: "A",        test: "Proceed in working canter right",                                                                                                          coefficient: 1, directive: "The transition and the quality of the canter." },
  { no: "14", letters: "E",        test: "Circle to the right 15 m diameter",                                                                                                       coefficient: 1, directive: "The bend, the regularity of the circle and the quality of the canter." },
  { no: "15", letters: "EHCM\nB",  test: "Working canter",                                                                                                                           coefficient: 1, directive: "The quality of the canter." },
  { no: "16", letters: "B",        test: "Working Trot",                                                                                                                             coefficient: 1, directive: "The transition. The quality of the trot." },
  { no: "17", letters: "A",        test: "Down centre line",                                                                                                                         coefficient: 1, directive: "The bend at A and the straightness from A–I" },
  { no: "18", letters: "I",        test: "Halt – Immobility - salute",                                                                                                              coefficient: 1, directive: "The halt and the transition" },
];

export const config: TestConfig = {
  label: "Preliminary",
  appendix: "Appendix 'G'",
  abbr: "Prelim",
  subtitle: "Time 4 min · Min age of horse: 6 yrs (children) / 5 yrs (adults)",
  movements,
  hasCollective: false,
};
