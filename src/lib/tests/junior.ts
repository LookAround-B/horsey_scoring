import { type Movement, type TestConfig } from "./types";

// Transcribed verbatim from the FEI Junior Dressage Test (EPL 2026 Prospectus, pp. 19–20).
// Total 250 — no collective marks on this sheet.
export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",          test: "Enter in working trot\nHalt - immobility - salute",                                        coefficient: 1, directive: "Correctness of trot and transition. Precision of centre line and halt. Preparation of halt. Immobility, straightness. Contact and poll." },
  { no: "2",  letters: "X\nXC",         test: "Proceed in working trot\nWorking trot",                                                     coefficient: 1, directive: "Promptness of depart, quality of trot. Straightness. Contact and poll." },
  { no: "3",  letters: "C\nMV\nV",      test: "Track to the right\nMedium trot\nWorking trot",                                             coefficient: 1, directive: "Regularity, balance, engagement, groundcover. Lengthening of frame. Straightness." },
  { no: "4",  letters: "VK",            test: "Transitions at M and V\nWorking trot",                                                      coefficient: 1, directive: "Fluency and balance of both transitions. Regularity of trot." },
  { no: "5",  letters: "KD\nDE\nES",    test: "Half volte (10m Ø)\nLeg-yielding\nWorking trot",                                            coefficient: 2, directive: "Regularity, balance, energy. Correct bend in ½ volte. Correct flexion, positioning and control in leg-yielding." },
  { no: "6",  letters: "SR\nRBPF",      test: "Half circle (20 m Ø), give and retake the reins for 3-4 steps\nWorking trot",              coefficient: 2, directive: "Regularity, balance, energy. Maintenance of self-carriage. Accuracy of the circle line." },
  { no: "7",  letters: "FD\nDB\nBR",    test: "Half volte (10m Ø)\nLeg-yielding\nWorking trot",                                            coefficient: 2, directive: "Regularity, balance, energy. Correct bend in ½ volte. Correct flexion, positioning and control in leg-yielding." },
  { no: "8",  letters: "R\nRS",         test: "Medium walk\nHalf circle (20 m Ø)",                                                         coefficient: 1, directive: "Regularity, suppleness of back, activity, groundcover, freedom in shoulders. Accuracy of the circle line." },
  { no: "9",  letters: "S (E)\nbetween S & E", test: "[Medium walk]\nTurn on the haunches\nProceed in medium walk",                        coefficient: 2, directive: "Regularity, activity, fluency, size, flexion, and bend. Forward tendency, maintenance of fourbeat." },
  { no: "10", letters: "SH",            test: "Medium walk",                                                                               coefficient: 1, directive: "Regularity, suppleness of back, activity, groundcover, freedom in shoulders. Straightness." },
  { no: "11", letters: "H\nHCM",        test: "Proceed in working canter\nWorking canter",                                                 coefficient: 1, directive: "Fluency and balance of transition. Quality of canter." },
  { no: "12", letters: "MRBPF\nF",      test: "Medium canter\nCollected canter",                                                           coefficient: 1, directive: "Lengthening of strides and frame. Balance, uphill tendency, straightness." },
  { no: "13", letters: "FAK",           test: "Transitions at M and F\nCollected canter",                                                  coefficient: 1, directive: "Fluency and balance of both transitions. Quality of canter." },
  { no: "14", letters: "KXH\nHCMR",     test: "One loop of 10 m\nCollected canter",                                                        coefficient: 1, directive: "Quality of (counter) canter. Balance, self-carriage, fluency. Design of the loop." },
  { no: "15", letters: "RX[V]\nX\nXVKAF", test: "On the short diagonal\nSimple change of leg\nCollected canter",                          coefficient: 2, directive: "Promptness, fluency and balance of transitions. Straightness. 3-5 clear walk steps. Quality of canter." },
  { no: "16", letters: "FXM\nMCH",      test: "One loop of 10 m\nCollected canter",                                                        coefficient: 1, directive: "Quality of (counter) canter. Balance, self-carriage. fluency. Design of the loop." },
  { no: "17", letters: "HSEX\nX\nXBP",  test: "Collected canter\nSimple change of leg\nCollected canter",                                  coefficient: 2, directive: "Promptness, fluency and balance of transitions. Straightness. 3-5 clear walk steps. Quality of canter." },
  { no: "18", letters: "P\nPFA",        test: "Working trot\nWorking trot",                                                                coefficient: 1, directive: "Fluency and balance of transition. Regularity of trot." },
  { no: "19", letters: "A\nX",          test: "Down the centre line\nHalt - immobility - salute",                                          coefficient: 1, directive: "Quality of trot, straightness and balance into the halt. Contact and poll." },
  // Non-scored final instruction on the official sheet (maxMarks 0 → no marks, excluded from the 250 total).
  { no: "",   letters: "",              test: "Leave arena at A in walk on a long rein",                                                   coefficient: 1, directive: "", maxMarks: 0 },
];

export const config: TestConfig = {
  label: "Junior",
  appendix: "Appendix C",
  abbr: "JR",
  subtitle: "Time 3′55″ (for information only) · Minimum age of horse: 6 years",
  movements,
  hasCollective: false,
};
