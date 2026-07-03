export interface UserProfileData {
  age: number;
  sex: "M" | "F";
  height: number; // cm
  weight: number; // kg
  activityLevel: "sedentary" | "moderate" | "active" | "very_active";
  lifestyle: {
    smoker: boolean;
    alcohol: string; // "none", "occasional", "regular"
    sleep: string;
    diet?: string;
  };
  healthGoals: string[];
  medicalHistory?: string;
}

export interface BiomarkerDefinition {
  canonicalName: string;
  frenchSynonyms: string[];
  category: "lipid" | "metabolic" | "inflammatory" | "hematology" | "iron" | "liver" | "kidney";
  defaultUnit: string;
  refRangeM?: { min: number; max: number };
  refRangeF?: { min: number; max: number };
  unitConversions: {
    [targetUnit: string]: (val: number) => number;
  };
  explanation: string;
  detailedExplanation?: string;
  lowMeaning?: string;
  highMeaning?: string;
  image?: string;
}

export interface ParsedBiomarker {
  name: string; // extracted or canonical
  rawValue: number;
  rawUnit: string;
  refMin?: number;
  refMax?: number;
}

export interface IngestionResult {
  date?: Date;
  labName?: string;
  biomarkers: ParsedBiomarker[];
  rawText: string;
  ocrNecessity: boolean;
}

export interface NormalizedBiomarker {
  name: string;
  rawValue: number;
  rawUnit: string;
  valG_L: number | null;
  valMmol_L: number | null;
  refMin: number | null;
  refMax: number | null;
  flag: "green" | "blue" | "yellow" | "orange" | "red";
  category: string;
  explanation: string;
}

export interface AnalysisInsights {
  healthScore: number;
  scoreClass: "Excellent" | "Good" | "Moderate" | "At risk";
  insightSummary: string; // Markdown text
  biomarkers: NormalizedBiomarker[];
}
