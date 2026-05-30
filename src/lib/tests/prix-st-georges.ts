import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nX\n\nXC",            test: "Enter in collected canter\nHalt - immobility - salute\nProceed in collected trot\nCollected trot",                     coefficient: 1, directive: "Quality of paces, halt, and transitions. Straightness. Contact and poll." },
  { no: "2",  letters: "C\nMXK\nK\nKAF",         test: "Track to the right\nMedium trot\nCollected trot\nCollected trot",                                                     coefficient: 1, directive: "Regularity, elasticity, balance, engagement of hindquarters, lengthening of steps and frame. Both transitions. Collection." },
  { no: "3",  letters: "FB",                     test: "Shoulder-in left",                                                                                                    coefficient: 1, directive: "Regularity and quality of trot; bend and constant angle. Collection, balance, and fluency." },
  { no: "4",  letters: "B",                      test: "Volte left (8 m Ø)",                                                                                                  coefficient: 1, directive: "Regularity and quality of trot, collection, and balance. Bend; size and shape of volte." },
  { no: "5",  letters: "BG\nG\nC",               test: "Half-pass to the left\nOn centre line\nTrack to the left",                                                            coefficient: 2, directive: "Regularity and quality of trot, uniform bend, collection, balance, fluency, crossing of legs." },
  { no: "6",  letters: "HXF\nF",                 test: "Extended trot\nCollected trot",                                                                                        coefficient: 1, directive: "Regularity, elasticity, balance, energy of hindquarters, overtrack. Lengthening of frame. Differentiation from medium trot." },
  { no: "7",  letters: "\nFAK",                  test: "Transitions at H and F\nThe collected trot",                                                                          coefficient: 1, directive: "Maintenance of rhythm, fluency, precise and smooth execution of transitions. Change of frame. Collection." },
  { no: "8",  letters: "KE",                     test: "Shoulder-in right",                                                                                                   coefficient: 1, directive: "Regularity and quality of trot; bend and constant angle. Collection, balance, and fluency." },
  { no: "9",  letters: "E",                      test: "Volte right (8 m Ø)",                                                                                                 coefficient: 1, directive: "Regularity and quality of trot, collection, and balance. Bend; size and shape of volte." },
  { no: "10", letters: "EG\nG",                  test: "Half-pass to the right\nOn centre line",                                                                              coefficient: 2, directive: "Regularity and quality of trot, uniform bend, collection, balance, fluency, crossing of legs." },
  { no: "11", letters: "Before C\nC\nH\nBetween G&M", test: "[Collected walk]\n[Track to the left]\n[Turn left]\nHalf pirouette to the left",                                coefficient: 1, directive: "Regularity, activity, collection, size, flexion, and bend of half pirouette. Forward tendency, maintenance of fourbeat." },
  { no: "12", letters: "Between G&H\nGM",        test: "Half pirouette to the right\n[Collected walk]",                                                                      coefficient: 1, directive: "Regularity, activity, collection, size, flexion, and bend of half pirouette. Forward tendency, maintenance of fourbeat." },
  { no: "13", letters: "",                        test: "The collected walk C–H–G–(M)–G–M",                                                                                   coefficient: 2, directive: "Regularity, suppleness of back, activity, shortening and heightening of steps, self-carriage. Transition into walk." },
  { no: "14", letters: "MRXV(K)",                test: "Extended walk",                                                                                                       coefficient: 2, directive: "Regularity, suppleness of back, activity, overtrack, freedom of shoulder, stretching to the bit." },
  { no: "15", letters: "Before K\nK\nKAF",       test: "Collected walk\nProceed in collected canter left\nCollected canter",                                                  coefficient: 1, directive: "Precise execution and fluency of transition. Quality of canter." },
  { no: "16", letters: "FX\nX",                  test: "Half-pass to the left\nFlying change of leg",                                                                         coefficient: 1, directive: "Quality of canter. Collection, balance, uniform bend, fluency. Quality of flying change." },
  { no: "17", letters: "XM\nM\nMCH",             test: "Half-pass to the right\nFlying change of leg\nCollected canter",                                                      coefficient: 1, directive: "Quality of canter. Collection, balance, uniform bend, fluency. Quality of flying change." },
  { no: "18", letters: "H\nBetween H&X",         test: "Proceed towards X in collected canter\nHalf pirouette to the left",                                                   coefficient: 2, directive: "Collection, self-carriage, balance, size, flexion, and bend. Correct number of strides (3–4). Quality of canter before and after." },
  { no: "19", letters: "HC\nC",                  test: "Counter canter\nFlying change of leg",                                                                                coefficient: 1, directive: "Quality and collection of counter canter. Correctness, balance, fluency, uphill tendency, straightness of change." },
  { no: "20", letters: "M\nBetween M&X",         test: "Proceed towards X in collected canter\nHalf pirouette to the right",                                                  coefficient: 2, directive: "Collection, self-carriage, balance, size, flexion, and bend. Correct number of strides (3–4). Quality of canter before and after." },
  { no: "21", letters: "MC\nC",                  test: "Counter canter\nFlying change of leg",                                                                                coefficient: 1, directive: "Quality and collection of counter canter. Correctness, balance, fluency, uphill tendency, straightness of change." },
  { no: "22", letters: "HXF\nFAK",               test: "On the diagonal 5 flying changes of leg every 4th stride\nCollected canter",                                         coefficient: 1, directive: "Correctness, balance, fluency, uphill tendency, straightness. Quality of canter before and after." },
  { no: "23", letters: "KXM\nMCH",               test: "On the diagonal 5 flying changes of leg every 3rd stride\nCollected canter",                                         coefficient: 1, directive: "Correctness, balance, fluency, uphill tendency, straightness. Quality of canter before and after." },
  { no: "24", letters: "HXF",                    test: "Extended canter",                                                                                                     coefficient: 1, directive: "Quality of canter, impulsion, lengthening of strides and frame. Balance, uphill tendency, straightness." },
  { no: "25", letters: "F\nFA",                  test: "Collected canter and flying change of leg\nCollected canter",                                                         coefficient: 1, directive: "Quality of flying change on diagonal. Precise, smooth execution of transition. Collection." },
  { no: "26", letters: "A\nX",                   test: "Down the centre line\nHalt - immobility - salute",                                                                   coefficient: 1, directive: "Quality of pace, halt, and transition. Straightness. Contact and poll." },
];

export const config: TestConfig = {
  label: "Prix St. Georges",
  appendix: "Appendix 'B'",
  abbr: "PSG",
  subtitle: "Time 5′50″ · Minimum age of horse: 7 years",
  movements,
  otherErrorPenalty: 0.5,
  courseErrors: [
    { label: "No error",          value: 0 },
    { label: "1st error · −2%",   value: 2 },
    { label: "2nd error · Elim.", value: -1 },
  ],
};
