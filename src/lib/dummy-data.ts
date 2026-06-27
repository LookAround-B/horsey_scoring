import { type UserRole, ROLE_LABELS, ROLE_DASHBOARD } from "@/lib/roles";

export { ROLE_LABELS, ROLE_DASHBOARD };
export type { UserRole };

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type Rider = {
  id: string;
  name: string;
  /** Start (SR) number within the rider's class. */
  competitorNo: string;
  horse: string;
  club: string;
  category: string;
  /** FEI National Federation + horse number — used by the dressage score sheet; blank for EPL start-list riders. */
  nf?: string;
  horseNo?: string;
  userId?: string;
};

export type EventClass = {
  id: string;
  name: string;
  testId: string;
  type: "dressage" | "showjumping";
  judgeId?: string;
  writerId?: string;
  startTime: string;
};

export type ShowEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  classes: EventClass[];
  status: "upcoming" | "active" | "completed";
  secretaryId: string;
};

export type ScoringSession = {
  id: string;
  eventId: string;
  classId: string;
  riderId: string;
  testId: string;
  judgeId: string;
  writerId?: string;
  scores: Record<string, string>;
  corrections: Record<string, string>;
  collectiveScores: Record<string, string>;
  percentage: number;
  status: "draft" | "submitted" | "verified";
  createdAt: string;
  verifiedBy?: string;
};

export const TEST_NAMES: Record<string, string> = {
  "young-rider": "Young Rider",
  "junior": "Junior",
  "children-i":         "Children I",
  "children-i-quality": "Children I – Quality",
  "children-ii":         "Children II",
  "children-ii-quality": "Children II – Quality",
  "pre-novice": "Pre Novice",
  "preliminary": "Preliminary",
  "introductory": "Introductory",
  "novice": "Novice",
  "lead-rein":          "Lead Rein",
  "follow-the-leader":  "Follow the Leader",
  "novice-quality":     "Novice – Quality",
  "intermediate-i":             "Intermediate I",
  "intermediate-i-freestyle":   "Intermediate I Freestyle",
  "prix-st-georges":            "Prix St. Georges",
  "prix-st-georges-freestyle":  "Prix St. Georges Freestyle",
  "advanced-senior-ii":         "Advanced / Senior II",
  "advanced-senior-ii-freestyle": "Advanced / Senior II Freestyle",
  "advanced-medium":            "Advanced Medium",
  "advanced-medium-freestyle":  "Advanced Medium Freestyle",
  "medium-senior-i":            "Medium / Senior I",
  "medium-senior-i-freestyle":  "Medium / Senior I Freestyle",
  "elementary":                 "Elementary",
  "elementary-freestyle":       "Elementary Freestyle",
  "preliminary-g":              "Preliminary (App. G)",
  "preliminary-g-quality":      "Preliminary – Quality",
  "young-riders":               "Young Riders",
  "young-riders-quality":       "Young Riders – Quality",
  "young-rider-freestyle":      "Young Rider Freestyle",
  "junior-riders":              "Junior Riders",
  "junior-riders-quality":      "Junior Riders – Quality",
  "junior-rider-freestyle":     "Junior Rider Freestyle",
  "children-i-new":             "Children I (New)",
  "children-i-new-quality":     "Children I (New) – Quality",
  "children-ii-new":            "Children II (New)",
  "children-ii-new-quality":    "Children II (New) – Quality",
  "jnec-eventing":              "JNEC Eventing",
  "prix-st-georges-fei":        "Prix St. Georges (FEI)",
  "wdc-advanced":               "FEI WDC Advanced",
  "epl-junior-riders":          "EPL Junior Riders",
  "epl-children-i":             "EPL Children I",
  "epl-children-ii":            "EPL Children II",
};

export const DUMMY_USERS: User[] = [
  { id: "u1", name: "Alex Morgan",     email: "admin@horsey.app",          role: "super_admin" },
  { id: "u2", name: "Dr. Sarah Chen",  email: "judge.dressage@horsey.app", role: "dressage_judge" },
  { id: "u3", name: "Mark Johnson",    email: "judge.sj@horsey.app",       role: "showjumping_judge" },
  { id: "u4", name: "Priya Sharma",    email: "writer.dressage@horsey.app",role: "dressage_writer" },
  { id: "u5", name: "Tom Wilson",      email: "writer.sj@horsey.app",      role: "showjumping_writer" },
  { id: "u6", name: "Emma Davis",      email: "club@horsey.app",           role: "club" },
  { id: "u7", name: "Sophia Patel",    email: "rider@horsey.app",          role: "rider" },
  { id: "u8", name: "James O'Brien",   email: "secretary@horsey.app",      role: "show_secretary" },
];

// Seeded from "Epl Final Start list 28th June 2026" (EPL 2026, Sunday 28th June).
// Each row is one start-list entry (a rider repeats per horse / class).
const JR = "JUNIOR (Age 15 to 18)";
const SJR = "SUB-JUNIOR (Age 14 and Below)";
const OPEN = "OPEN (Age 19 and Above)";
const SJ = "Open to All"; // show-jumping classes are open category

export const DUMMY_RIDERS: Rider[] = [
  // ── Junior Dressage · Class D3 ──
  { id: "r1",  name: "ARYA CHANNAGIRI",      competitorNo: "1", horse: "CLOUD 9",          category: OPEN, club: "FSS",   userId: "u7" },
  { id: "r2",  name: "Nikshita Pandey",      competitorNo: "2", horse: "Abra",             category: JR,   club: "EIRS" },
  { id: "r3",  name: "Arnav",                competitorNo: "3", horse: "Power",            category: JR,   club: "Zippy" },
  { id: "r4",  name: "Kripa Jain",           competitorNo: "4", horse: "Christy",          category: JR,   club: "EIRS" },
  { id: "r5",  name: "Eshaan Sundaram",      competitorNo: "5", horse: "Eotina",           category: JR,   club: "EIRS" },
  { id: "r6",  name: "Kiara Rupesh",         competitorNo: "6", horse: "Rio",              category: JR,   club: "EIRS" },
  { id: "r7",  name: "Hem Kilaru",           competitorNo: "7", horse: "Abra",             category: SJR,  club: "EIRS" },
  { id: "r8",  name: "Bhargav Babu Velkur",  competitorNo: "8", horse: "Vadim De Savigny", category: SJR,  club: "EIRS" },
  { id: "r9",  name: "ARYA CHANNAGIRI",      competitorNo: "9", horse: "SULTAN",           category: OPEN, club: "FSS" },

  // ── EPL 90-100CM Show Jumping · Class SJ3 ──
  { id: "r10", name: "Nikolay",                  competitorNo: "1",  horse: "Claudia",        category: SJ, club: "EIRS" },
  { id: "r11", name: "Swapnil Sane",             competitorNo: "2",  horse: "Ocean",          category: SJ, club: "EIRS" },
  { id: "r12", name: "Sonica sunil",             competitorNo: "3",  horse: "MABEL",          category: SJ, club: "Covai Stables" },
  { id: "r13", name: "Bhargav Babu Velkur",      competitorNo: "4",  horse: "GUCCI DO AXE",   category: SJ, club: "EIRS" },
  { id: "r14", name: "DHANVI CHERUVU",           competitorNo: "5",  horse: "BLACK BIRD",     category: SJ, club: "FSS" },
  { id: "r15", name: "Kiran Akhade",             competitorNo: "6",  horse: "Cyber Boom",     category: SJ, club: "URB" },
  { id: "r16", name: "Adrash s",                 competitorNo: "7",  horse: "janne galaxie",  category: SJ, club: "Covai Stables" },
  { id: "r17", name: "Ishanvi Pranav Bathija",   competitorNo: "8",  horse: "ZARA",           category: SJ, club: "Covai Stables" },
  { id: "r18", name: "Ishta Iusta",              competitorNo: "9",  horse: "klaver",         category: SJ, club: "EIRS" },
  { id: "r19", name: "Kabir Dutta",              competitorNo: "10", horse: "Mallorca HDH",   category: SJ, club: "Covai Stables" },
  { id: "r20", name: "Avanti Apte",              competitorNo: "11", horse: "William Wallace",category: SJ, club: "Goodwill" },
  { id: "r21", name: "Pranjal raturi",           competitorNo: "12", horse: "T9",             category: SJ, club: "Covai Stables" },
  { id: "r22", name: "SRIRAM SHANMUGAM",         competitorNo: "13", horse: "miruthan",       category: SJ, club: "Covai Stables" },
  { id: "r23", name: "ARYA CHANNAGIRI",          competitorNo: "14", horse: "BHIMA",          category: SJ, club: "FSS" },
  { id: "r24", name: "Kripa",                    competitorNo: "15", horse: "PAT",            category: SJ, club: "EIRS" },
  { id: "r25", name: "Annika Iyer",              competitorNo: "16", horse: "Velocity",       category: SJ, club: "Goodwill" },
  { id: "r26", name: "KAPILESH G",               competitorNo: "17", horse: "klaver",         category: SJ, club: "Covai Stables" },
  { id: "r27", name: "TANISHKA G",               competitorNo: "18", horse: "ZARA",           category: SJ, club: "Covai Stables" },
  { id: "r28", name: "Prathik Raj",              competitorNo: "19", horse: "MABEL",          category: SJ, club: "Covai Stables" },
  { id: "r29", name: "Faleh Khan",               competitorNo: "20", horse: "Bonaparte",      category: SJ, club: "MGDPRA" },
  { id: "r30", name: "Maithili Deshmukh",        competitorNo: "21", horse: "William Wallace",category: SJ, club: "Goodwill" },
  { id: "r31", name: "Moksh Patel",              competitorNo: "22", horse: "Legend",         category: SJ, club: "EIRS" },
  { id: "r32", name: "Aaliya Lakdawala",         competitorNo: "23", horse: "Icon",           category: SJ, club: "RTLA" },
  { id: "r33", name: "Maliha Lakdawala",         competitorNo: "24", horse: "Verdinus",       category: SJ, club: "RTLA" },
  { id: "r34", name: "Samrat Shreeharsha",       competitorNo: "25", horse: "Kingston",       category: SJ, club: "URB" },
  { id: "r35", name: "Omkar Akhade",             competitorNo: "26", horse: "Austin",         category: SJ, club: "Goodwill" },
  { id: "r36", name: "ARYA CHANNAGIRI",          competitorNo: "27", horse: "CLOUD 9",        category: SJ, club: "FSS" },
  { id: "r37", name: "Moksh Patel",              competitorNo: "28", horse: "Bella",          category: SJ, club: "EIRS" },
  { id: "r38", name: "Saravanan",                competitorNo: "29", horse: "Kara",           category: SJ, club: "EIRS" },
  { id: "r39", name: "Hem Kilaru",               competitorNo: "30", horse: "Dream Boy",      category: SJ, club: "EIRS" },
  { id: "r40", name: "M Rama Tanush Reddy",      competitorNo: "31", horse: "Legend",         category: SJ, club: "EIRS" },
  { id: "r41", name: "Samarth Shreeharsha",      competitorNo: "32", horse: "Asvah",          category: SJ, club: "URB" },
  { id: "r42", name: "Manil Rao",                competitorNo: "33", horse: "Rajkumar",       category: SJ, club: "ARPA" },
  { id: "r43", name: "Ahana Jena",               competitorNo: "34", horse: "Something Big",  category: SJ, club: "Goodwill" },
  { id: "r44", name: "Aaliya Lakdawala",         competitorNo: "35", horse: "Pharoah",        category: SJ, club: "Goodwill" },
  { id: "r45", name: "Arnav",                    competitorNo: "36", horse: "Long Range",     category: SJ, club: "Zippy" },
  { id: "r46", name: "Yuvan",                    competitorNo: "37", horse: "Roxette",        category: SJ, club: "Zippy" },
  { id: "r47", name: "Agathyan",                 competitorNo: "38", horse: "Lotus",          category: SJ, club: "ECE" },
  { id: "r48", name: "Diego Marren",             competitorNo: "39", horse: "Theo",           category: SJ, club: "EIRS" },
  { id: "r49", name: "Adrash s",                 competitorNo: "40", horse: "Mallorca HDH",   category: SJ, club: "Covai Stables" },
  { id: "r50", name: "Manya",                    competitorNo: "41", horse: "Barnaby",        category: SJ, club: "EIRS" },
  { id: "r51", name: "DHANVI CHERUVU",           competitorNo: "42", horse: "BHIMA",          category: SJ, club: "FSS" },
  { id: "r52", name: "Nikshitha Pandey",         competitorNo: "43", horse: "Roxette",        category: SJ, club: "Zippy" },
  { id: "r53", name: "SENTHILNATHAN KUMARAVEL",  competitorNo: "44", horse: "Mallorca HDH",   category: SJ, club: "Covai Stables" },
  { id: "r54", name: "sonica sunil",             competitorNo: "45", horse: "isma boy",       category: SJ, club: "Covai Stables" },
  { id: "r55", name: "Samarth Nayak",            competitorNo: "46", horse: "Night Hunt",     category: SJ, club: "REA" },
  { id: "r56", name: "Faiz Rizwan",              competitorNo: "47", horse: "SRS Newgrange",  category: SJ, club: "URB" },

  // ── EPL 110-115CM Show Jumping · Class SJ5 ──
  { id: "r57", name: "SENTHILNATHAN KUMARAVEL",  competitorNo: "1",  horse: "Isma boy",          category: SJ, club: "CS" },
  { id: "r58", name: "Nikolay",                  competitorNo: "2",  horse: "Catherina",         category: SJ, club: "Eirs" },
  { id: "r59", name: "SRIRAM SHANMUGAM",         competitorNo: "3",  horse: "Tara",              category: SJ, club: "CS" },
  { id: "r60", name: "SARAVANAN KANDHANSAMY",    competitorNo: "4",  horse: "Luka",              category: SJ, club: "CS" },
  { id: "r61", name: "Neil Kendall",             competitorNo: "5",  horse: "Hach Du Faubourg",  category: SJ, club: "Surge" },
  { id: "r62", name: "Barath Manoharan",         competitorNo: "6",  horse: "Jashmir",           category: SJ, club: "ECE" },
  { id: "r63", name: "ADAM OBEROI",              competitorNo: "7",  horse: "FREEZING RAIN",     category: SJ, club: "FSS" },
  { id: "r64", name: "Kiran Akhade",             competitorNo: "8",  horse: "Cyber Boom",        category: SJ, club: "URB" },
  { id: "r65", name: "Samarth Shreeharsha",      competitorNo: "9",  horse: "Clarintino Z",      category: SJ, club: "URB" },
  { id: "r66", name: "SENTHILNATHAN KUMARAVEL",  competitorNo: "10", horse: "Dilano",            category: SJ, club: "CS" },
  { id: "r67", name: "SRIRAM SHANMUGAM",         competitorNo: "11", horse: "big dream",         category: SJ, club: "CS" },
  { id: "r68", name: "Nikolay",                  competitorNo: "12", horse: "Caraida",           category: SJ, club: "Eirs" },
  { id: "r69", name: "Barath Manoharan",         competitorNo: "13", horse: "Helico",            category: SJ, club: "ECE" },
  { id: "r70", name: "SENTHILNATHAN KUMARAVEL",  competitorNo: "14", horse: "T9",                category: SJ, club: "CS" },
  { id: "r71", name: "Moksh Patel",              competitorNo: "15", horse: "Apphira",           category: SJ, club: "EIRS" },

  // ── EPL 130CM Show Jumping · Class SJ7 ──
  { id: "r72", name: "ARADHANA ANAND",           competitorNo: "1",  horse: "centuri",            category: SJ, club: "CS" },
  { id: "r73", name: "Eera Shreeharsha",         competitorNo: "2",  horse: "Carrido",            category: SJ, club: "URB" },
  { id: "r74", name: "Nikolay",                  competitorNo: "3",  horse: "Campari",            category: SJ, club: "EIRS" },
  { id: "r75", name: "PRITHIV KRISHNA",          competitorNo: "4",  horse: "Pharrell",           category: SJ, club: "CS" },
  { id: "r76", name: "Prathik Raj",              competitorNo: "5",  horse: "major",              category: SJ, club: "CS" },
  { id: "r77", name: "Kiran Akhade",             competitorNo: "6",  horse: "Geronimo",           category: SJ, club: "URB" },
  { id: "r78", name: "Nitin gupta",              competitorNo: "7",  horse: "Leonardo Van Holli", category: SJ, club: "URB" },
  { id: "r79", name: "Barath Manoharan",         competitorNo: "8",  horse: "Crikey Oraley",      category: SJ, club: "ZIPPY" },
  { id: "r80", name: "ARADHANA ANAND",           competitorNo: "9",  horse: "charlie's angel",    category: SJ, club: "CS" },
  { id: "r81", name: "Eera Shreeharsha",         competitorNo: "10", horse: "Holly TH",           category: SJ, club: "URB" },
];

export const DUMMY_EVENTS: ShowEvent[] = [
  {
    id: "e1",
    name: "KSEC Spring Classic 2025",
    date: "2025-06-15",
    location: "KSEC Main Arena, Bangalore",
    status: "active",
    secretaryId: "u8",
    classes: [
      { id: "c1",  name: "Young Rider Dressage",     testId: "young-rider",  type: "dressage", judgeId: "u2", writerId: "u4", startTime: "09:00" },
      { id: "c2",  name: "Junior Dressage",          testId: "junior",       type: "dressage", judgeId: "u2", writerId: "u4", startTime: "10:30" },
      { id: "c3",  name: "Pre Novice Dressage",      testId: "pre-novice",   type: "dressage", judgeId: "u2", writerId: "u4", startTime: "13:00" },
      { id: "c4",  name: "Lead Rein Dressage",       testId: "lead-rein",    type: "dressage", judgeId: "u2", writerId: "u4", startTime: "15:00" },
      { id: "c10", name: "Children I Dressage",      testId: "children-i",   type: "dressage", judgeId: "u2", writerId: "u4", startTime: "11:30" },
      { id: "c11", name: "Children II Dressage",     testId: "children-ii",  type: "dressage", judgeId: "u2", writerId: "u4", startTime: "14:30" },
      { id: "c12", name: "Follow the Leader",        testId: "follow-the-leader", type: "dressage", judgeId: "u2", writerId: "u4", startTime: "16:00" },
    ],
  },
  {
    id: "e2",
    name: "KSEC Summer Series 2025",
    date: "2025-08-20",
    location: "KSEC Cross Country Course",
    status: "upcoming",
    secretaryId: "u8",
    classes: [
      { id: "c5", name: "Novice Dressage",       testId: "novice",       type: "dressage", startTime: "08:00" },
      { id: "c6", name: "Introductory Dressage", testId: "introductory", type: "dressage", startTime: "11:00" },
      { id: "c7", name: "Preliminary Dressage",  testId: "preliminary",  type: "dressage", startTime: "14:00" },
    ],
  },
  {
    id: "e3",
    name: "KSEC Winter Invitational 2024",
    date: "2024-12-10",
    location: "KSEC Indoor Arena",
    status: "completed",
    secretaryId: "u8",
    classes: [
      { id: "c8",  name: "Children I Dressage",  testId: "children-i",  type: "dressage", judgeId: "u2", writerId: "u4", startTime: "09:00" },
      { id: "c9",  name: "Children II Dressage", testId: "children-ii", type: "dressage", judgeId: "u2", writerId: "u4", startTime: "11:00" },
    ],
  },
];

export const DUMMY_ENTRIES: Record<string, string[]> = {
  c1: ["r1", "r3", "r5"],
  c2: ["r2", "r4"],
  c3: ["r1", "r2", "r3", "r6"],
  c4: ["r7", "r8"],
  c5: ["r3", "r4", "r5"],
  c6: ["r1", "r6"],
  c7: ["r2", "r7"],
  c8: ["r1", "r2", "r3", "r4", "r5"],
  c9: ["r2", "r4", "r6", "r8"],
};

export type TestCard = {
  slug: string;
  category: string;
  appendix: string;
  description: string;
  maxScore: number;
  /** Discipline this sheet belongs to. Defaults to "dressage" when omitted. */
  discipline?: "dressage" | "showjumping";
};

export const TEST_CARDS: TestCard[] = [
  { slug: "young-rider",  category: "Young Rider",  appendix: "Appendix A", description: "Time 6′30″ · Min age of horse: 6 years", maxScore: 280 },
  { slug: "junior",       category: "Junior",       appendix: "Appendix C", description: "Time 3′55″ · Min age of horse: 6 years", maxScore: 220 },
  { slug: "children-i",         category: "Children I",          appendix: "Appendix D", description: "Time 5 min · Min age horse: 8 yrs (ch) / 5 (adults)", maxScore: 280 },
  { slug: "children-i-quality", category: "Children I – Quality", appendix: "Appendix D", description: "Quality Marking Sheet · Combined with Technical score", maxScore: 40 },
  { slug: "children-ii",         category: "Children II",          appendix: "Appendix E", description: "Time 4 min · Min age horse: 6 yrs (ch) / 5 (adults)", maxScore: 210 },
  { slug: "children-ii-quality", category: "Children II – Quality", appendix: "Appendix E", description: "Quality Marking Sheet · Combined with Technical score", maxScore: 40 },
  { slug: "pre-novice",   category: "Pre Novice",   appendix: "Appendix G", description: "Time 4 min · Min age of horse: 4 years", maxScore: 150 },
  { slug: "preliminary",  category: "Preliminary",  appendix: "Appendix H", description: "Preliminary Dressage Test · EFI", maxScore: 160 },
  { slug: "novice",         category: "Novice",          appendix: "KSEC Show", description: "Time 3′55″ · Min age of horse: 6 years", maxScore: 250 },
  { slug: "novice-quality", category: "Novice – Quality", appendix: "KSEC Show", description: "Quality Marking Sheet · Combined with Technical score · −0.5% per technical fault", maxScore: 40 },
  { slug: "introductory", category: "Introductory", appendix: "KSEC Show",  description: "Time 3:30 · Arena 20×60 · Snaffle bridle", maxScore: 190 },
  { slug: "lead-rein",        category: "Lead Rein",         appendix: "KSEC Show",  description: "Lead Rein Dressage Test", maxScore: 130 },
  { slug: "follow-the-leader", category: "Follow the Leader", appendix: "KSEC Show",  description: "Follow the Leader Dressage · KSEC Show", maxScore: 190 },
  { slug: "intermediate-i",           category: "Intermediate I",           appendix: "Appendix 'A'", description: "Time 5′30″ · Min age of horse: 7 years", maxScore: 340 },
  { slug: "intermediate-i-freestyle", category: "Intermediate I Freestyle", appendix: "Appendix 'A'", description: "Performance: 4′30″–5′00″ · Technical + Artistic marks", maxScore: 400 },
  { slug: "prix-st-georges",           category: "Prix St. Georges",          appendix: "Appendix 'B'", description: "Time 5′50″ · Min age of horse: 7 years", maxScore: 340 },
  { slug: "prix-st-georges-freestyle", category: "Prix St. Georges Freestyle", appendix: "Appendix 'B'", description: "Performance: 4′30″–5′00″ · Technical + Artistic marks", maxScore: 400 },
  { slug: "advanced-senior-ii",           category: "Advanced / Senior II",           appendix: "Appendix 'C'", description: "Time 5.40 min · Min age of horse: 6 years", maxScore: 330 },
  { slug: "advanced-senior-ii-freestyle", category: "Advanced / Senior II Freestyle", appendix: "Appendix 'C'", description: "Time: 4:30–5:00 min · Technical + Artistic marks", maxScore: 400 },
  { slug: "advanced-medium",           category: "Advanced Medium",           appendix: "Appendix 'D'", description: "Time 6.30 min · Min age of horse: 6 years", maxScore: 290 },
  { slug: "advanced-medium-freestyle", category: "Advanced Medium Freestyle", appendix: "Appendix 'D'", description: "Time Allowed: 4:30–5:00 min · Technical + Artistic marks", maxScore: 400 },
  { slug: "medium-senior-i",           category: "Medium / Senior I",           appendix: "Appendix 'E'", description: "Time 6.30 min · Min age of horse: 6 years", maxScore: 290 },
  { slug: "medium-senior-i-freestyle", category: "Medium / Senior I Freestyle", appendix: "Appendix 'E'", description: "Time Allowed: 4:30–5:00 min · Technical + Artistic marks", maxScore: 400 },
  { slug: "elementary",           category: "Elementary",           appendix: "Appendix 'F'", description: "Time 5 min · Min age: 6 yrs (ch) / 5 yrs (adults)", maxScore: 290 },
  { slug: "elementary-freestyle", category: "Elementary Freestyle", appendix: "Appendix 'F'", description: "Time Allowed: 4:00–4:30 min · Technical + Artistic marks", maxScore: 260 },
  { slug: "preliminary-g",         category: "Preliminary (App. G)", appendix: "Appendix 'G'", description: "Time 4 min · Min age: 6 yrs (ch) / 5 yrs (adults)", maxScore: 190 },
  { slug: "preliminary-g-quality", category: "Preliminary – Quality", appendix: "Appendix 'G'", description: "Quality Marking Sheet · Combined with Technical score", maxScore: 40 },
  { slug: "young-riders",         category: "Young Riders",          appendix: "Appendix 'A'", description: "Time: 5.30 min · Min age of horse: 4 years", maxScore: 220 },
  { slug: "young-riders-quality", category: "Young Riders – Quality", appendix: "Appendix 'A'", description: "Quality Marking Sheet · Combined with Technical score", maxScore: 40 },
  { slug: "young-rider-freestyle", category: "Young Rider Freestyle", appendix: "Appendix 'A'", description: "Time: 5.30 min · Technical + Artistic marks", maxScore: 400 },
  { slug: "junior-riders",         category: "Junior Riders",          appendix: "Appendix 'B'", description: "Time: 4.45 min · Min age of horse: 4 years", maxScore: 230 },
  { slug: "junior-riders-quality", category: "Junior Riders – Quality", appendix: "Appendix 'B'", description: "Quality Marking Sheet · Combined with Technical score", maxScore: 40 },
  { slug: "junior-rider-freestyle", category: "Junior Rider Freestyle", appendix: "Appendix 'B'", description: "Time: 4.45 min · Technical + Artistic marks", maxScore: 400 },
  { slug: "children-i-new",         category: "Children I (New)",          appendix: "Appendix 'C'", description: "Time: 5.30 min · Min age of horse: 4 years", maxScore: 170 },
  { slug: "children-i-new-quality", category: "Children I (New) – Quality", appendix: "Appendix 'C'", description: "Quality Marking Sheet · Combined with Technical score", maxScore: 40 },
  { slug: "children-ii-new",         category: "Children II (New)",          appendix: "Appendix 'D'", description: "Time: 4 min · Min age of horse: 4 years", maxScore: 160 },
  { slug: "children-ii-new-quality", category: "Children II (New) – Quality", appendix: "Appendix 'D'", description: "Quality Marking Sheet · Combined with Technical score", maxScore: 40 },
  { slug: "jnec-eventing",       category: "JNEC Eventing",              appendix: "Appendix 'E'",          description: "Time: 4 min 30 sec · Dressage for JNEC Eventing", maxScore: 230 },
  { slug: "prix-st-georges-fei", category: "Prix St. Georges (FEI)",     appendix: "D-PSG09-2009/2022",     description: "Time 5′50″ · Official FEI test · Min age: 7 years", maxScore: 340 },
  { slug: "wdc-advanced",        category: "FEI WDC Advanced",           appendix: "WCHA-D-ADVANCED-2011",  description: "Time: 5.10 min · FEI World Dressage Challenge", maxScore: 370 },
  { slug: "epl-junior-riders",   category: "EPL Junior Riders",          appendix: "Appendix 'F'",          description: "Time: 4.45 min · EPL test · Min age: 4 years", maxScore: 230 },
  { slug: "epl-children-i",      category: "EPL Children I",             appendix: "Appendix 'G'",          description: "Time: 4 min · EPL test · Min age: 4 years", maxScore: 170 },
  { slug: "epl-children-ii",     category: "EPL Children II",            appendix: "Appendix 'H'",          description: "Snaffle bridle · Rising trot optional · Min age: 4 years", maxScore: 160 },
];

export const DUMMY_SESSIONS: ScoringSession[] = [
  {
    id: "s1", eventId: "e3", classId: "c8", riderId: "r1", testId: "children-i",
    judgeId: "u2", writerId: "u4",
    scores: { "1": "7", "2": "6.5", "3": "7", "4": "6.5", "5": "14", "6": "7", "7": "7", "8": "6.5", "9": "14", "10": "7", "11": "6.5", "12": "7", "13": "7", "14": "6.5", "15": "14", "16": "7", "17": "7", "18": "6.5", "19": "7", "20": "14", "21": "7", "22": "7" },
    corrections: {}, collectiveScores: { "1": "7" },
    percentage: 66.67, status: "verified", createdAt: "2024-12-10T10:30:00Z", verifiedBy: "u6",
  },
  {
    id: "s2", eventId: "e3", classId: "c8", riderId: "r2", testId: "children-i",
    judgeId: "u2", writerId: "u4",
    scores: { "1": "7.5", "2": "7", "3": "7.5", "4": "7", "5": "15", "6": "7", "7": "7.5", "8": "7", "9": "14", "10": "7", "11": "7", "12": "7.5", "13": "7.5", "14": "7", "15": "14", "16": "7", "17": "7.5", "18": "7", "19": "7.5", "20": "15", "21": "7", "22": "7.5" },
    corrections: {}, collectiveScores: { "1": "7.5" },
    percentage: 70.83, status: "submitted", createdAt: "2024-12-10T11:30:00Z",
  },
  {
    id: "s3", eventId: "e3", classId: "c9", riderId: "r4", testId: "children-ii",
    judgeId: "u2", writerId: "u4",
    scores: { "1": "6.5", "2": "7", "3": "6.5", "4": "7", "5": "6.5", "6": "7", "7": "7", "8": "6.5", "9": "6.5", "10": "7", "11": "6.5", "12": "14", "13": "6.5", "14": "7", "15": "7", "16": "6.5", "17": "6.5", "18": "7" },
    corrections: {}, collectiveScores: { "1": "7" },
    percentage: 67.5, status: "verified", createdAt: "2024-12-10T12:00:00Z", verifiedBy: "u6",
  },
  {
    id: "s4", eventId: "e1", classId: "c1", riderId: "r1", testId: "young-rider",
    judgeId: "u2", writerId: "u4",
    scores: {}, corrections: {}, collectiveScores: {},
    percentage: 0, status: "draft", createdAt: "2025-06-15T08:00:00Z",
  },
  {
    id: "s5", eventId: "e1", classId: "c3", riderId: "r3", testId: "pre-novice",
    judgeId: "u2", writerId: "u4",
    scores: {}, corrections: {}, collectiveScores: {},
    percentage: 0, status: "draft", createdAt: "2025-06-15T13:00:00Z",
  },
];
