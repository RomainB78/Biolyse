import { NormalizedBiomarker } from "./types";

export interface ScoreBreakdown {
  score: number;
  classification: "Excellent" | "Good" | "Moderate" | "At risk";
  changeDirection?: "improving" | "stable" | "worsening" | "fluctuating";
  changeValue?: number; // delta since baseline
}

// Compute the composite metabolic health score
export function calculateHealthScore(biomarkers: NormalizedBiomarker[]): ScoreBreakdown {
  let score = 100;
  
  if (biomarkers.length === 0) {
    return { score: 100, classification: "Excellent" };
  }

  // Define weight for each category to scale penalties
  const weights: { [name: string]: number } = {
    "Triglycérides": 1.5,
    "Cholestérol LDL": 1.5,
    "Cholestérol HDL": 1.2,
    "Glucose à jeun": 1.5,
    "HbA1c (Hémoglobine glyquée)": 1.5,
    "CRP (Protéine C-Réactive)": 1.0,
    "Ferritine": 0.8,
    "Hémoglobine": 1.0,
    "Leucocytes": 0.8,
  };

  let totalPenalties = 0;

  for (const marker of biomarkers) {
    const w = weights[marker.name] ?? 1.0;
    let penalty = 0;

    switch (marker.flag) {
      case "blue":
        penalty = 0; // Very good, no penalty
        break;
      case "green":
        penalty = 0; // Normal
        break;
      case "yellow":
        penalty = 3; // Borderline/Monitor
        break;
      case "orange":
        penalty = 8; // Slightly abnormal
        break;
      case "red":
        penalty = 15; // Abnormal
        break;
    }

    totalPenalties += penalty * w;
  }

  // Deduct penalties and clamp score between 10 and 100
  score = Math.max(10, Math.min(100, Math.round(100 - totalPenalties)));

  let classification: "Excellent" | "Good" | "Moderate" | "At risk" = "Excellent";
  if (score >= 90) classification = "Excellent";
  else if (score >= 70) classification = "Good";
  else if (score >= 50) classification = "Moderate";
  else classification = "At risk";

  return {
    score,
    classification,
  };
}

// Detect trends for a specific biomarker across multiple chronological records
export function analyzeTrend(values: number[], dates: Date[], name: string): "improving" | "stable" | "worsening" | "fluctuating" {
  if (values.length < 2) return "stable";

  const firstVal = values[0];
  const lastVal = values[values.length - 1];
  const prevVal = values[values.length - 2];
  
  const totalChangePct = ((lastVal - firstVal) / firstVal) * 100;
  const recentChangePct = ((lastVal - prevVal) / prevVal) * 100;

  // For biomarkers where LOWER is better (Triglycérides, LDL, Glucose, CRP, Cholestérol total)
  const lowerIsBetter = ["Triglycérides", "Cholestérol LDL", "Cholestérol total", "Glucose à jeun", "HbA1c (Hémoglobine glyquée)", "CRP (Protéine C-Réactive)"].includes(name);

  if (lowerIsBetter) {
    if (recentChangePct < -5) {
      return "improving";
    } else if (recentChangePct > 5) {
      return "worsening";
    } else {
      // Check longer-term trend since baseline if recent is stable
      if (totalChangePct < -10) return "improving";
      if (totalChangePct > 10) return "worsening";
      return "stable";
    }
  } else {
    // For biomarkers where HIGHER is better (HDL, Hémoglobine)
    if (recentChangePct > 5) {
      return "improving";
    } else if (recentChangePct < -5) {
      return "worsening";
    } else {
      if (totalChangePct > 10) return "improving";
      if (totalChangePct < -10) return "worsening";
      return "stable";
    }
  }
}

export interface CorrelationResult {
  title: string;
  category: "lipid" | "metabolic" | "inflammation" | "general";
  status: "optimal" | "monitor" | "warning";
  description: string;
}

// Core correlation checks between multiple biomarkers
export function evaluateCorrelations(biomarkers: NormalizedBiomarker[]): CorrelationResult[] {
  const findMarker = (name: string) => biomarkers.find((b) => b.name === name);

  const ldl = findMarker("Cholestérol LDL");
  const hdl = findMarker("Cholestérol HDL");
  const trig = findMarker("Triglycérides");
  const glucose = findMarker("Glucose à jeun");
  const crp = findMarker("CRP (Protéine C-Réactive)");
  const hb = findMarker("Hémoglobine");

  const correlations: CorrelationResult[] = [];

  // 1. Lipid Coherence Check
  if (ldl && hdl && trig) {
    const ldlVal = ldl.valG_L ?? ldl.rawValue;
    const hdlVal = hdl.valG_L ?? hdl.rawValue;
    const trigVal = trig.valG_L ?? trig.rawValue;

    if (trigVal > 1.50 && hdlVal < 0.40) {
      correlations.push({
        title: "Cohérence du profil lipidique",
        category: "lipid",
        status: "warning",
        description: "Le ratio triglycérides/HDL est élevé, ce qui peut indiquer une susceptibilité à l'insulinorésistance ou à un risque cardiovasculaire accru, malgré un taux de LDL parfois stable. Privilégier une activité physique régulière.",
      });
    } else if (trigVal <= 1.50 && hdlVal >= 0.60 && ldlVal > 1.16) {
      correlations.push({
        title: "Profil lipidique croisé",
        category: "lipid",
        status: "monitor",
        description: "Bien que le cholestérol LDL soit supérieur à la cible, le taux de cholestérol HDL élevé (protecteur) et les triglycérides bas atténuent significativement le risque cardiovasculaire global.",
      });
    } else if (trigVal <= 1.50 && hdlVal >= 0.50 && ldlVal <= 1.16) {
      correlations.push({
        title: "Équilibre lipidique optimal",
        category: "lipid",
        status: "optimal",
        description: "Excellente synergie des lipides sanguins. Les triglycérides bas associés à un bon cholestérol HDL et un mauvais cholestérol LDL maîtrisé sont des indicateurs de protection artérielle idéale.",
      });
    }
  }

  // 2. Inflammation and Metabolic Risk Check
  if (crp && glucose) {
    const crpVal = crp.rawValue;
    const glucVal = glucose.valG_L ?? glucose.rawValue;

    if (crpVal > 3.0 && glucVal > 1.00) {
      correlations.push({
        title: "Axe métabolique & inflammation",
        category: "metabolic",
        status: "warning",
        description: "La combinaison d'une glycémie à jeun élevée et d'une CRP sensible suggère une possible inflammation de bas grade liée au métabolisme. Une réduction des glucides raffinés et une bonne hygiène de sommeil sont recommandées.",
      });
    }
  }

  // 3. Oxygen Carrying & Iron Check
  if (hb) {
    const hbVal = hb.rawValue;
    if (hbVal < (hb.refMin ?? 12.0)) {
      correlations.push({
        title: "Capacité d'oxygénation",
        category: "general",
        status: "warning",
        description: "Taux d'hémoglobine bas sous la limite de référence. Cela peut traduire une anémie ou une carence sous-jacente. À corréler avec vos réserves de fer (ferritine).",
      });
    }
  }

  return correlations;
}

export interface Recommendation {
  category: string;
  icon: string;
  title: string;
  details: string;
}

// Generate wellness and lifestyle recommendations
export function generateRecommendations(biomarkers: NormalizedBiomarker[]): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const findMarker = (name: string) => biomarkers.find((b) => b.name === name);

  const trig = findMarker("Triglycérides");
  const ldl = findMarker("Cholestérol LDL");
  const hdl = findMarker("Cholestérol HDL");
  const glucose = findMarker("Glucose à jeun");
  const crp = findMarker("CRP (Protéine C-Réactive)");

  // 1. Triglyceride advice
  if (trig && (trig.flag === "yellow" || trig.flag === "orange" || trig.flag === "red")) {
    recommendations.push({
      category: "Nutrition",
      icon: "Apple",
      title: "Réduire les sucres simples et l'alcool",
      details: "Les triglycérides réagissent fortement à la consommation de glucides rapides, de produits sucrés et d'alcool. Favorisez les céréales complètes, les légumes et les acides gras oméga-3 (poissons gras, noix).",
    });
  }

  // 2. LDL Advice
  if (ldl && (ldl.flag === "orange" || ldl.flag === "red")) {
    recommendations.push({
      category: "Nutrition",
      icon: "Beef",
      title: "Limiter les graisses saturées",
      details: "Réduisez la consommation de viandes grasses, de charcuteries, de beurre et de produits industriels contenant de l'huile de palme. Remplacez-les par des huiles végétales riches en acides gras mono-insaturés (olive, colza).",
    });
  }

  // 3. HDL Advice
  if (hdl && hdl.rawValue < (hdl.refMin ?? 0.40)) {
    recommendations.push({
      category: "Activité Physique",
      icon: "Activity",
      title: "Augmenter le cholestérol protecteur (HDL)",
      details: "L'activité physique aérobie (30 min de marche rapide, vélo ou natation 3 à 4 fois par semaine) est le moyen le plus efficace pour augmenter le taux de cholestérol HDL.",
    });
  }

  // 4. Glucose / Diabetes Advice
  if (glucose && (glucose.flag === "yellow" || glucose.flag === "orange" || glucose.flag === "red")) {
    recommendations.push({
      category: "Mode de vie",
      icon: "Flame",
      title: "Améliorer la sensibilité à l'insuline",
      details: "Marchez 10 à 15 minutes immédiatement après les repas principaux. Cela aide à capter le glucose par les muscles sans nécessiter une forte sécrétion d'insuline.",
    });
  }

  // 5. Inflammation advice
  if (crp && crp.rawValue > 3.0) {
    recommendations.push({
      category: "Récupération",
      icon: "Moon",
      title: "Favoriser un sommeil réparateur",
      details: "Le manque chronique de sommeil augmente le niveau global d'inflammation CRP. Essayez de dormir entre 7 et 8 heures par nuit et intégrez des techniques de respiration ou relaxation en fin de journée.",
    });
  }

  // Default recommendations if everything is optimal
  if (recommendations.length === 0) {
    recommendations.push({
      category: "Prévention",
      icon: "Sparkles",
      title: "Maintenir vos excellentes habitudes",
      details: "Tous vos indicateurs clés sont au vert ! Continuez votre alimentation équilibrée de type méditerranéen et votre activité physique régulière pour préserver ce capital santé.",
    });
  }

  return recommendations;
}
