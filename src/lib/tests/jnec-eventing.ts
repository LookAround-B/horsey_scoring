import { type Movement, type TestConfig } from "./types";

export const movements: Movement[] = [
  { no: "1",  letters: "A\nC",       test: "Enter working trot\nTrack left",                                                                                                 coefficient: 1, directive: "Straightness on centerline, Quality of turn and trot" },
  { no: "2",  letters: "S\nE",       test: "Circle left 10 meters\nTurn left",                                                                                               coefficient: 1, directive: "Size and shape of circle. Quality of trot and turn" },
  { no: "3",  letters: "B\nP",       test: "Turn right\nCircle right 10 meters",                                                                                             coefficient: 1, directive: "Quality of turn and trot. Size and shape of circle" },
  { no: "4",  letters: "A\nD-S",     test: "Turn down center line\nLeg yield left",                                                                                          coefficient: 1, directive: "Balance on turn. Straightness on center line, alignment. Balance, position and flow" },
  { no: "5",  letters: "H",          test: "Working canter right lead",                                                                                                      coefficient: 1, directive: "Calmness and smoothness of depart" },
  { no: "6",  letters: "R",          test: "Circle right 15 meters",                                                                                                         coefficient: 1, directive: "Size and shape of circle. Steady tempo and balance" },
  { no: "7",  letters: "P\n\nP-F",   test: "Circle right 20 meters, lengthen stride in canter\n\nDevelop working canter",                                                   coefficient: 1, directive: "Lengthening of frame and stride, regularity of canter. Balance and definition of transition" },
  { no: "8",  letters: "A",          test: "Working trot",                                                                                                                   coefficient: 1, directive: "Obedience and balance in transition" },
  { no: "9",  letters: "V-M\nM",     test: "Lengthen stride in trot sitting or rising\nWorking trot",                                                                       coefficient: 1, directive: "Lengthening of frame and stride, regularity of trot, transitions" },
  { no: "10", letters: "C",          test: "Halt 5 seconds. Proceed medium walk",                                                                                            coefficient: 1, directive: "Willing transition, immobility" },
  { no: "11", letters: "H-B\nB-K",   test: "Free walk\nMedium walk",                                                                                                        coefficient: 1, directive: "Quality of free walk, straightness. Clarity of transition and quality of walk" },
  { no: "12", letters: "K",          test: "Working trot",                                                                                                                   coefficient: 1, directive: "Willing balance, obedient transition" },
  { no: "13", letters: "A\nD-R",     test: "Turn down center line\nLeg yield right",                                                                                         coefficient: 1, directive: "Balance on turn. Straightness on center line, alignment. Balance, position and flow" },
  { no: "14", letters: "M",          test: "Working canter left lead",                                                                                                       coefficient: 1, directive: "Calmness and smoothness of depart" },
  { no: "15", letters: "S",          test: "Circle left 15 meters",                                                                                                          coefficient: 1, directive: "Size and shape of circle. Steady tempo and balance" },
  { no: "16", letters: "V\n\nV-K",   test: "Circle left 20 meters, lengthen stride in canter\n\nDevelop working canter",                                                    coefficient: 1, directive: "Lengthening of frame and stride, regularity of canter. Balance and definition of transition" },
  { no: "17", letters: "A",          test: "Working trot",                                                                                                                   coefficient: 1, directive: "Willing, balance. transition. Quality of trot" },
  { no: "18", letters: "P-H\nH",     test: "Lengthen stride in trot, sitting or rising\nWorking trot",                                                                      coefficient: 1, directive: "Lengthening of frame and stride, regularity of trot, transitions" },
  { no: "19", letters: "C",          test: "Circle right 20 meters, rising trot, letting the horse stretch forward and down\nBefore C: Shorten the reins",                  coefficient: 1, directive: "Quality of stretch over back, forward and downward into a light contact while maintaining balance and quality of transition to working trot" },
  { no: "20", letters: "B\nB-I",     test: "Half circle right 10 meters\nWorking trot",                                                                                     coefficient: 1, directive: "Balance and bend in turn. Straightness on center line" },
  { no: "21", letters: "I",          test: "Halt, salute",                                                                                                                  coefficient: 1, directive: "Willing, balance. transition, immobility" },
];

export const config: TestConfig = {
  label: "JNEC Eventing",
  appendix: "Appendix 'E'",
  abbr: "JNEC",
  subtitle: "Time: 4 min 30 sec · Dressage Test for JNEC Eventing",
  movements,
  collectives: [
    { no: "1", label: "Overall Impression of Athlete and Horse", coefficient: 2 },
  ],
  courseErrors: [
    { label: "No error",          value: 0 },
    { label: "1st error · −2 pts", value: 2 },
    { label: "2nd error · −4 pts", value: 4 },
    { label: "3rd error · Elim.", value: -1 },
  ],
};
