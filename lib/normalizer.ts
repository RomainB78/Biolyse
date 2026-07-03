import { BiomarkerDefinition, NormalizedBiomarker, ParsedBiomarker } from "./types";

export const BIOMARKER_DEFINITIONS: { [canonicalName: string]: BiomarkerDefinition } = {
  "Triglycérides": {
    canonicalName: "Triglycérides",
    frenchSynonyms: ["triglycerides", "triglycerides plasmatiques", "triacylglycerols", "triglycerides a jeun"],
    category: "lipid",
    defaultUnit: "g/L",
    refRangeM: { min: 0.35, max: 1.50 },
    refRangeF: { min: 0.35, max: 1.40 },
    unitConversions: {
      "mmol/L": (val) => val * 1.14,
      "g/L": (val) => val,
      "mg/dL": (val) => val * 100,
    },
    explanation: "Les triglycérides sont des graisses stockées par l'organisme provenant de l'alimentation. Un taux élevé augmente le risque de maladies cardiovasculaires.",
    detailedExplanation: "Les triglycérides représentent la forme principale de stockage des graisses dans notre corps, issues principalement de la transformation des sucres et de l'alcool par le foie, ainsi que des graisses alimentaires. Lorsqu'on mange, l'organisme convertit les calories dont il n'a pas immédiatement besoin en triglycérides, stockés dans les cellules graisseuses. Entre les repas, les hormones libèrent ces triglycérides pour fournir de l'énergie. Un taux élevé est souvent lié au surpoids, à la sédentarité ou à une alimentation trop riche en sucres raffinés et en alcool.",
  },
  "Cholestérol HDL": {
    canonicalName: "Cholestérol HDL",
    frenchSynonyms: ["cholesterol hdl", "hdl-cholesterol", "hdl cholesterol", "chol. hdl", "fraction hdl", "bon cholesterol"],
    category: "lipid",
    defaultUnit: "g/L",
    refRangeM: { min: 0.40, max: 0.90 },
    refRangeF: { min: 0.50, max: 1.00 },
    unitConversions: {
      "mmol/L": (val) => val * 2.586,
      "g/L": (val) => val,
      "mg/dL": (val) => val * 100,
    },
    explanation: "Le cholestérol HDL (bon cholestérol) nettoie les artères en ramenant l'excès de cholestérol vers le foie pour y être éliminé.",
    detailedExplanation: "Le cholestérol HDL (High Density Lipoprotein) est couramment appelé « bon cholestérol » car il a pour mission d'agir comme un véritable service de nettoyage de vos vaisseaux sanguins. Ces lipoprotéines de haute densité circulent dans le sang, capturent le cholestérol en excès déposé sur la paroi des artères et le transportent jusqu'au foie, où il sera dégradé puis éliminé par la bile. Plus votre taux de HDL est élevé, plus vos artères sont protégées contre la formation de plaques d'athérome, réduisant ainsi drastiquement les risques d'infarctus ou d'AVC.",
  },
  "Cholestérol LDL": {
    canonicalName: "Cholestérol LDL",
    frenchSynonyms: ["cholesterol ldl", "ldl-cholesterol", "ldl cholesterol", "chol. ldl", "fraction ldl", "mauvais cholesterol", "calcul ldl"],
    category: "lipid",
    defaultUnit: "g/L",
    refRangeM: { min: 0.00, max: 1.16 },
    refRangeF: { min: 0.00, max: 1.16 },
    unitConversions: {
      "mmol/L": (val) => val * 2.586,
      "g/L": (val) => val,
      "mg/dL": (val) => val * 100,
    },
    explanation: "Le cholestérol LDL (mauvais cholestérol) transporte le cholestérol vers les cellules. En excès, il s'accumule sur la paroi des artères sous forme de plaques.",
    detailedExplanation: "Le cholestérol LDL (Low Density Lipoprotein) est souvent qualifié de « mauvais cholestérol ». Son rôle normal est de distribuer le cholestérol du foie vers toutes les cellules du corps, car elles en ont besoin pour fabriquer leurs membranes et certaines hormones. Toutefois, si le LDL est présent en trop grande quantité, ou s'il est oxydé par de mauvaises habitudes de vie (tabac, malbouffe), il a tendance à s'oxyder et à se déposer sur la paroi interne des artères. Avec le temps, ces dépôts forment des plaques (athérosclérose) qui durcissent, rétrécissent le passage du sang et peuvent provoquer des caillots, entraînant des maladies cardiovasculaires.",
  },
  "Cholestérol total": {
    canonicalName: "Cholestérol total",
    frenchSynonyms: ["cholesterol total", "cholesterol", "cholesterol plasmatique"],
    category: "lipid",
    defaultUnit: "g/L",
    refRangeM: { min: 1.40, max: 2.00 },
    refRangeF: { min: 1.40, max: 2.00 },
    unitConversions: {
      "mmol/L": (val) => val * 2.586,
      "g/L": (val) => val,
      "mg/dL": (val) => val * 100,
    },
    explanation: "Représente la quantité totale de cholestérol dans le sang (LDL + HDL + fraction des triglycérides).",
  },
  "Glucose à jeun": {
    canonicalName: "Glucose à jeun",
    frenchSynonyms: ["glycemie a jeun", "glycemie", "glucose", "glucose plasmatique", "sucre a jeun", "glycémie"],
    category: "metabolic",
    defaultUnit: "g/L",
    refRangeM: { min: 0.70, max: 1.10 },
    refRangeF: { min: 0.70, max: 1.10 },
    unitConversions: {
      "mmol/L": (val) => val * 5.55,
      "g/L": (val) => val,
      "mg/dL": (val) => val * 100,
    },
    explanation: "Mesure du taux de sucre dans le sang à jeun. Permet d'évaluer la régulation du glucose par l'insuline.",
  },
  "HbA1c (Hémoglobine glyquée)": {
    canonicalName: "HbA1c (Hémoglobine glyquée)",
    frenchSynonyms: ["hba1c", "hemoglobine glyquee", "glycohemoglobine", "fraction hba1c"],
    category: "metabolic",
    defaultUnit: "%",
    refRangeM: { min: 4.0, max: 5.7 },
    refRangeF: { min: 4.0, max: 5.7 },
    unitConversions: {
      "%": (val) => val,
    },
    explanation: "Reflète le taux de sucre moyen dans le sang sur les 3 derniers mois en mesurant le sucre fixé sur les globules rouges.",
  },
  "CRP (Protéine C-Réactive)": {
    canonicalName: "CRP (Protéine C-Réactive)",
    frenchSynonyms: ["crp", "proteine c reactive", "proteine c-reactive", "c-reactive protein"],
    category: "inflammatory",
    defaultUnit: "mg/L",
    refRangeM: { min: 0.0, max: 5.0 },
    refRangeF: { min: 0.0, max: 5.0 },
    unitConversions: {
      "mg/L": (val) => val,
    },
    explanation: "Protéine produite par le foie lors d'une réaction inflammatoire. Un taux élevé indique une inflammation aiguë ou chronique.",
    detailedExplanation: "La protéine C-réactive (CRP) est dosée dans le sang pour vérifier si un processus infectieux ou inflammatoire est en cours ou non. Le foie la libère très rapidement dans la circulation sanguine en réponse à une inflammation (suite à une infection bactérienne, une lésion tissulaire, une maladie auto-immune, etc.). Le ou la médecin peut prescrire une prise de sang afin d'évaluer le processus en cours ou de surveiller une pathologie ou son traitement. Si la CRP présente un taux anormal, il faudra d'autres examens cliniques et biologiques pour en déterminer la raison exacte.",
  },
  "Ferritine": {
    canonicalName: "Ferritine",
    frenchSynonyms: ["ferritine", "ferritine plasmatique"],
    category: "iron",
    defaultUnit: "µg/L",
    refRangeM: { min: 30.0, max: 300.0 },
    refRangeF: { min: 15.0, max: 150.0 },
    unitConversions: {
      "µg/L": (val) => val,
      "ng/mL": (val) => val,
    },
    explanation: "Reflète les réserves de fer de l'organisme. Un taux bas indique une carence en fer, un taux très élevé peut traduire une inflammation ou une surcharge.",
  },
  "Hémoglobine": {
    canonicalName: "Hémoglobine",
    frenchSynonyms: ["hemoglobine", "hb", "hemoglobines"],
    category: "hematology",
    defaultUnit: "g/dL",
    refRangeM: { min: 13.0, max: 17.0 },
    refRangeF: { min: 12.0, max: 16.0 },
    unitConversions: {
      "g/dL": (val) => val,
      "g/L": (val) => val / 10,
    },
    explanation: "Protéine des globules rouges assurant le transport de l'oxygène des poumons vers le reste du corps.",
    detailedExplanation: "L'hémoglobine est une métalloprotéine contenant du fer, présente à l'intérieur des globules rouges (hématies). Son rôle principal est de capter l'oxygène dans les poumons, de le transporter à travers la circulation sanguine, et de le libérer dans les tissus et organes pour assurer leur bon fonctionnement. Elle sert également à transporter une partie du dioxyde de carbone des tissus vers les poumons pour y être expiré. Le taux d'hémoglobine est l'indicateur principal pour diagnostiquer une anémie (taux trop bas) ou une polyglobulie (taux trop élevé).",
    lowMeaning: "Un taux anormalement bas (anémie) peut entraîner fatigue, essoufflement et pâleur. Elle est souvent due à une carence en fer, en vitamines ou à des saignements.",
    highMeaning: "Un taux élevé (polyglobulie) peut rendre le sang plus visqueux, augmentant le risque de caillots. Cela peut être lié au tabagisme, à l'altitude ou à des maladies respiratoires.",
    image: "/images/hematies.jpg",
  },
  "Leucocytes": {
    canonicalName: "Leucocytes",
    frenchSynonyms: ["leucocytes", "globules blancs", "gb", "numeration leucocytaire"],
    category: "hematology",
    defaultUnit: "G/L",
    refRangeM: { min: 4.0, max: 10.0 },
    refRangeF: { min: 4.0, max: 10.0 },
    unitConversions: {
      "G/L": (val) => val,
      "g/l": (val) => val,
      "/mm3": (val) => val / 1000,
      "mm3": (val) => val / 1000,
    },
    explanation: "Globules blancs chargés de défendre l'organisme contre les infections et les corps étrangers.",
    detailedExplanation: "Les leucocytes, communément appelés globules blancs, sont les cellules immunitaires de notre sang. Ils constituent l'armée de défense de l'organisme contre les agressions extérieures telles que les bactéries, les virus, les parasites ou encore les cellules tumorales. Il en existe plusieurs types (neutrophiles, lymphocytes, monocytes, éosinophiles, basophiles), chacun ayant une spécialité (par exemple, les lymphocytes orchestrent la réponse immunitaire et produisent les anticorps, tandis que les neutrophiles sont les premiers sur les lieux d'une infection bactérienne).",
    lowMeaning: "Un taux bas (leucopénie) diminue vos défenses immunitaires, vous rendant plus vulnérable aux infections. Cela peut résulter d'une infection virale sévère ou de certains médicaments.",
    highMeaning: "Un taux élevé (hyperleucocytose) est souvent le signe d'une réponse de l'organisme face à une infection bactérienne, une inflammation ou un stress physique important.",
    image: "/images/leucocytes.jpg",
  },
  "Plaquettes": {
    canonicalName: "Plaquettes",
    frenchSynonyms: ["plaquettes", "numeration plaquettaire", "plaquettes sanguines"],
    category: "hematology",
    defaultUnit: "G/L",
    refRangeM: { min: 150.0, max: 400.0 },
    refRangeF: { min: 150.0, max: 400.0 },
    unitConversions: {
      "G/L": (val) => val,
      "g/l": (val) => val,
      "giga/L": (val) => val,
      "/mm3": (val) => val / 1000,
    },
    explanation: "Fragments cellulaires (thrombocytes) jouant un rôle fondamental dans la coagulation du sang pour colmater les plaies.",
    detailedExplanation: "Les plaquettes (ou thrombocytes) sont de tout petits fragments de cellules fabriqués par la moelle osseuse. Elles sont les premières à intervenir en cas de lésion d'un vaisseau sanguin. Dès qu'un saignement se produit, elles s'agglutinent (s'agrègent) pour former un premier « clou plaquettaire » qui va colmater la brèche, puis elles libèrent des facteurs de coagulation pour consolider ce caillot. Un bon taux de plaquettes garantit un arrêt efficace des saignements sans pour autant risquer la formation de caillots dangereux (thrombose).",
    lowMeaning: "Un taux bas (thrombopénie) ralentit la coagulation et augmente le risque de saignements prolongés ou d'ecchymoses. Il faut éviter les traumatismes.",
    highMeaning: "Un taux élevé (thrombocytose) augmente le risque de formation de caillots sanguins (thrombose) dans les vaisseaux sanguins. C'est souvent réactionnel (carence en fer, inflammation).",
    image: "/images/plaquettes.jpg",
  },
};

// Standardizes French text for matching: lower case, remove spaces, accents, and punctuation
export function standardizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9]/g, ""); // keep alpha-numeric characters only
}

// Find canonical definition for a given biomarker name
export function findBiomarkerDefinition(name: string): BiomarkerDefinition | null {
  const stdName = standardizeString(name);
  for (const def of Object.values(BIOMARKER_DEFINITIONS)) {
    if (standardizeString(def.canonicalName) === stdName) {
      return def;
    }
    for (const syn of def.frenchSynonyms) {
      if (standardizeString(syn) === stdName) {
        return def;
      }
    }
  }
  return null;
}

// Normalizes a parsed biomarker against rules and reference ranges
export function normalizeBiomarker(
  parsed: ParsedBiomarker,
  sex: "M" | "F"
): NormalizedBiomarker | null {
  const def = findBiomarkerDefinition(parsed.name);
  if (!def) return null;

  const refRange = sex === "F" ? def.refRangeF : def.refRangeM;
  const canonicalName = def.canonicalName;
  const category = def.category;

  // Convert raw value to default unit
  let valNormalized = parsed.rawValue;
  // If the parsed unit is different from the default unit, try to convert or guess
  const parsedUnit = parsed.rawUnit.trim();
  const defUnit = def.defaultUnit;

  // If we can convert from the parsed unit to the default unit
  // The definition holds conversions from default to target. Let's do the inverse if possible.
  if (parsedUnit !== defUnit) {
    if (def.canonicalName === "Triglycérides" && parsedUnit === "mmol/L") {
      valNormalized = parsed.rawValue / 1.14;
    } else if (
      ["Cholestérol HDL", "Cholestérol LDL", "Cholestérol total"].includes(def.canonicalName) &&
      parsedUnit === "mmol/L"
    ) {
      valNormalized = parsed.rawValue / 2.586;
    } else if (def.canonicalName === "Glucose à jeun" && parsedUnit === "mmol/L") {
      valNormalized = parsed.rawValue / 5.55;
    } else if (def.canonicalName === "Hémoglobine" && parsedUnit === "g/L") {
      valNormalized = parsed.rawValue / 10;
    } else if (
      (def.canonicalName === "Leucocytes" || def.canonicalName === "Plaquettes") &&
      (parsedUnit === "/mm3" || parsedUnit === "mm3")
    ) {
      valNormalized = parsed.rawValue / 1000;
    }
  }

  // Pre-calculate alternative normalized values (g/L and mmol/L)
  let valG_L: number | null = null;
  let valMmol_L: number | null = null;

  if (def.canonicalName === "Triglycérides") {
    valG_L = valNormalized;
    valMmol_L = valNormalized * 1.14;
  } else if (["Cholestérol HDL", "Cholestérol LDL", "Cholestérol total"].includes(def.canonicalName)) {
    valG_L = valNormalized;
    valMmol_L = valNormalized * 2.586;
  } else if (def.canonicalName === "Glucose à jeun") {
    valG_L = valNormalized;
    valMmol_L = valNormalized * 5.55;
  } else if (def.canonicalName === "Hémoglobine") {
    valG_L = valNormalized * 10; // in g/L
    valMmol_L = null;
  }

  // Determine flags
  // green = normal, blue = very good, yellow = monitor, orange = slightly abnormal, red = abnormal
  let flag: "green" | "blue" | "yellow" | "orange" | "red" = "green";
  const refMin = parsed.refMin ?? (refRange ? refRange.min : 0);
  const refMax = parsed.refMax ?? (refRange ? refRange.max : Infinity);

  if (canonicalName === "Cholestérol HDL") {
    // For HDL, higher is generally protective (very good)
    if (valNormalized >= 0.60) {
      flag = "blue"; // very good
    } else if (valNormalized < refMin) {
      flag = "red"; // abnormal (too low)
    } else if (valNormalized < refMin + 0.10) {
      flag = "yellow"; // monitor (borderline low)
    }
  } else {
    if (valNormalized < refMin) {
      const deviation = (refMin - valNormalized) / refMin;
      if (deviation > 0.15) {
        flag = "red";
      } else {
        flag = "orange";
      }
    } else if (valNormalized > refMax) {
      const deviation = (valNormalized - refMax) / refMax;
      if (deviation > 0.25) {
        flag = "red";
      } else if (deviation > 0.10) {
        flag = "orange";
      } else {
        flag = "yellow";
      }
    } else {
      // In range, but check if close to the border
      const range = refMax - refMin;
      const margin = range * 0.10;
      if (valNormalized > refMax - margin && canonicalName !== "Hémoglobine") {
        flag = "yellow"; // close to upper limit, watch out
      }
    }
  }

  return {
    name: canonicalName,
    rawValue: Number(parsed.rawValue.toFixed(2)),
    rawUnit: parsed.rawUnit,
    valG_L: valG_L ? Number(valG_L.toFixed(2)) : null,
    valMmol_L: valMmol_L ? Number(valMmol_L.toFixed(2)) : null,
    refMin,
    refMax,
    flag,
    category,
    explanation: def.explanation,
  };
}
