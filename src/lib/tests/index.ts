export type { Movement, CollectiveCriteria, TestConfig, CourseError } from "./types";

import { config as youngRider }  from "./young-rider";
import { config as junior }      from "./junior";
import { config as childrenI }        from "./children-i";
import { config as childrenIQuality } from "./children-i-quality";
import { config as childrenII }        from "./children-ii";
import { config as childrenIIQuality } from "./children-ii-quality";
import { config as preNovice }   from "./pre-novice";
import { config as preliminary } from "./preliminary";
import { config as leadRein }         from "./lead-rein";
import { config as followTheLeader } from "./follow-the-leader";
import { config as novice }          from "./novice";
import { config as noviceQuality }  from "./novice-quality";
import { config as introductory } from "./introductory";

import { config as intermediateI }              from "./intermediate-i";
import { config as intermediateIFreestyle }     from "./intermediate-i-freestyle";
import { config as prixStGeorges }              from "./prix-st-georges";
import { config as prixStGeorgesFreestyle }     from "./prix-st-georges-freestyle";
import { config as advancedSeniorII }           from "./advanced-senior-ii";
import { config as advancedSeniorIIFreestyle }  from "./advanced-senior-ii-freestyle";
import { config as advancedMedium }             from "./advanced-medium";
import { config as advancedMediumFreestyle }    from "./advanced-medium-freestyle";
import { config as mediumSeniorI }              from "./medium-senior-i";
import { config as mediumSeniorIFreestyle }     from "./medium-senior-i-freestyle";
import { config as elementaryNew }              from "./elementary-new";
import { config as elementaryFreestyle }        from "./elementary-freestyle";
import { config as preliminaryG }               from "./preliminary-g";
import { config as preliminaryGQuality }        from "./preliminary-g-quality";
import { config as youngRiders }                from "./young-riders";
import { config as youngRidersQuality }         from "./young-riders-quality";
import { config as youngRiderFreestyle }        from "./young-rider-freestyle";
import { config as juniorRiders }               from "./junior-riders";
import { config as juniorRidersQuality }        from "./junior-riders-quality";
import { config as juniorRiderFreestyle }       from "./junior-rider-freestyle";
import { config as childrenINew }               from "./children-i-new";
import { config as childrenINewQuality }        from "./children-i-new-quality";
import { config as childrenIINew }              from "./children-ii-new";
import { config as childrenIINewQuality }       from "./children-ii-new-quality";
import { config as jnecEventing }               from "./jnec-eventing";
import { config as prixStGeorgesFei }          from "./prix-st-georges-fei";
import { config as wdcAdvanced }               from "./wdc-advanced";
import { config as eplJuniorRiders }           from "./epl-junior-riders";
import { config as eplChildrenI }              from "./epl-children-i";
import { config as eplChildrenII }             from "./epl-children-ii";

import { type TestConfig } from "./types";

export const TEST_CONFIGS: Record<string, TestConfig> = {
  "young-rider":  youngRider,
  "junior":       junior,
  "children-i":         childrenI,
  "children-i-quality": childrenIQuality,
  "children-ii":         childrenII,
  "children-ii-quality": childrenIIQuality,
  "pre-novice":  preNovice,
  "preliminary": preliminary,
  "lead-rein":         leadRein,
  "follow-the-leader": followTheLeader,
  "novice":         novice,
  "novice-quality": noviceQuality,
  "introductory": introductory,

  "intermediate-i":             intermediateI,
  "intermediate-i-freestyle":   intermediateIFreestyle,
  "prix-st-georges":            prixStGeorges,
  "prix-st-georges-freestyle":  prixStGeorgesFreestyle,
  "advanced-senior-ii":         advancedSeniorII,
  "advanced-senior-ii-freestyle": advancedSeniorIIFreestyle,
  "advanced-medium":            advancedMedium,
  "advanced-medium-freestyle":  advancedMediumFreestyle,
  "medium-senior-i":            mediumSeniorI,
  "medium-senior-i-freestyle":  mediumSeniorIFreestyle,
  "elementary":                 elementaryNew,
  "elementary-freestyle":       elementaryFreestyle,
  "preliminary-g":              preliminaryG,
  "preliminary-g-quality":      preliminaryGQuality,
  "young-riders":               youngRiders,
  "young-riders-quality":       youngRidersQuality,
  "young-rider-freestyle":      youngRiderFreestyle,
  "junior-riders":              juniorRiders,
  "junior-riders-quality":      juniorRidersQuality,
  "junior-rider-freestyle":     juniorRiderFreestyle,
  "children-i-new":             childrenINew,
  "children-i-new-quality":     childrenINewQuality,
  "children-ii-new":            childrenIINew,
  "children-ii-new-quality":    childrenIINewQuality,
  "jnec-eventing":              jnecEventing,
  "prix-st-georges-fei":        prixStGeorgesFei,
  "wdc-advanced":               wdcAdvanced,
  "epl-junior-riders":          eplJuniorRiders,
  "epl-children-i":             eplChildrenI,
  "epl-children-ii":            eplChildrenII,
};

export const COURSE_ERRORS = [
  { label: "No error",              value: 0 },
  { label: "1st error · −0.5%",    value: 0.5 },
  { label: "2nd error · −1%",      value: 1 },
  { label: "3rd error · Elimination", value: -1 },
] as const;
