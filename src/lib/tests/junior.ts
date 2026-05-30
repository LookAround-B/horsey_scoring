import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX",      test: "Enter in working trot\nHalt – immobility – salute",                                                                       coefficient: 1, directive: "Correctness of trot and transitions. Precision of centre line and halt. Preparation of halt. Immobility, straightness. Contact and poll." },
  { no: "2",  letters: "X\nC",      test: "Proceed in working trot\nWorking trot",                                                                                   coefficient: 1, directive: "Promptness of depart, quality of trot. Straightness. Contact and poll." },
  { no: "3",  letters: "C\nM V",    test: "Track to the right\nMedium trot\nWorking trot",                                                                           coefficient: 1, directive: "Regularity, balance, engagement, groundcover. Lengthening of frame. Straightness." },
  { no: "4",  letters: "V K",       test: "Transitions at M and V\nWorking trot",                                                                                    coefficient: 1, directive: "Fluency and balance of both transitions. Regularity." },
  { no: "5",  letters: "K D\nE S",  test: "Half volte (10 m)\nLeg-yielding\nWorking trot",                                                                           coefficient: 2, directive: "Regularity, balance, energy. Correct bend in volte. Correct flexion, positioning and bend in leg-yielding." },
  { no: "6",  letters: "S R\nP B E", test: "Half circle (20 m), give and retake the reins for 3–4 steps\nWorking trot",                                              coefficient: 2, directive: "Regularity, balance, energy. Maintenance of self-carriage. Accuracy of the circle line." },
  { no: "7",  letters: "E D\nR B",  test: "Half volte (10 m)\nLeg-yielding\nWorking trot",                                                                           coefficient: 2, directive: "Regularity, balance, energy. Correct bend in volte. Correct flexion, positioning and bend in leg-yielding." },
  { no: "8",  letters: "R\nS",      test: "Medium walk\nHalf circle (20 m)",                                                                                         coefficient: 1, directive: "Regularity, suppleness of back, activity, relaxation. Accuracy of the circle line." },
  { no: "9",  letters: "S (E)\nM E S (I)", test: "Turn on the haunches\nProceed in medium walk",                                                                     coefficient: 2, directive: "Regularity, activity, energy. Size, flexion, bend. Forward tendency, maintenance of four-beat." },
  { no: "10", letters: "S H",       test: "Medium walk",                                                                                                             coefficient: 1, directive: "Regularity, suppleness of back, activity, groundcover, relaxation. Straightness." },
  { no: "11", letters: "H\nC M",    test: "Proceed in working canter\nWorking canter",                                                                               coefficient: 1, directive: "Fluency and balance of transition. Quality of canter." },
  { no: "12", letters: "M B\nF",    test: "Medium canter\nCollected canter",                                                                                         coefficient: 1, directive: "Lengthening of strides and frame, balance, uphill tendency, straightness." },
  { no: "13", letters: "F A K",     test: "Transitions at M and F\nCollected canter",                                                                                coefficient: 1, directive: "Fluency and balance of both transitions. Quality of canter." },
  { no: "14", letters: "K X H",     test: "One loop of 10 m\nCollected canter",                                                                                      coefficient: 1, directive: "Quality of (counter) canter. Balance, self-carriage. Bending of the loop." },
  { no: "15", letters: "R X V / X\nX K A F", test: "Short diagonal\nLeg-yielding\nCollected canter",                                                                coefficient: 2, directive: "Promptness, fluency and straightness of 3–5 clear walk steps. Quality of canter." },
  { no: "16", letters: "F X M",     test: "One loop of 10 m\nCollected canter",                                                                                      coefficient: 1, directive: "Quality of (counter) canter. Balance, self-carriage. Bending of the loop." },
  { no: "17", letters: "H S\nE K X S", test: "Collected canter\nSimple change of leg\nCollected canter",                                                             coefficient: 2, directive: "Promptness, fluency and change of transitions. Straightness, 3–5 clear walk steps. Quality of canter." },
  { no: "18", letters: "P F\nA",    test: "Working trot\nWorking trot",                                                                                              coefficient: 1, directive: "Fluency and balance of transition. Regularity of trot." },
  { no: "19", letters: "A\nX",      test: "Down the centre line\nHalt – immobility – salute",                                                                        coefficient: 1, directive: "Quality of trot, straightness, balance into halt. Contact and poll." },
];

export const config: TestConfig = {
  label: "Junior",
  appendix: "Appendix C",
  abbr: "JR",
  subtitle: "Time 3′55″ · Minimum age of horse: 6 years",
  movements,
};
