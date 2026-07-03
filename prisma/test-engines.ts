import { normalizeBiomarker, findBiomarkerDefinition } from "../lib/normalizer";
import { calculateHealthScore, analyzeTrend, evaluateCorrelations } from "../lib/scoring";
import { NormalizedBiomarker } from "../lib/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✓ ${message}`);
}

async function runTests() {
  console.log("=== STARTING BIOLYSE CORE ENGINE TESTS ===");

  try {
    // Test 1: Synonym Lookup
    console.log("\nTesting Synonym and Definition Lookup...");
    const defTrig = findBiomarkerDefinition("triglycerides plasmatiques");
    assert(defTrig !== null, "Should find definition for 'triglycerides plasmatiques'");
    assert(defTrig?.canonicalName === "Triglycérides", "Should map to canonical 'Triglycérides'");

    const defLdl = findBiomarkerDefinition("fraction ldl");
    assert(defLdl !== null, "Should find definition for 'fraction ldl'");
    assert(defLdl?.canonicalName === "Cholestérol LDL", "Should map to canonical 'Cholestérol LDL'");

    // Test 2: Unit Normalization & Conversions
    console.log("\nTesting Unit Normalization & Conversions...");
    
    // Triglycerides conversion: 1.50 g/L -> 1.71 mmol/L
    const parsedTrig = { name: "Triglycérides", rawValue: 1.50, rawUnit: "g/L" };
    const normTrig = normalizeBiomarker(parsedTrig, "M");
    assert(normTrig !== null, "Should normalize Triglycérides");
    assert(normTrig?.valMmol_L === 1.71, `Triglycerides 1.50 g/L should normalize to 1.71 mmol/L (got ${normTrig?.valMmol_L})`);
    assert(normTrig?.flag === "yellow", `Triglycerides 1.50 g/L should be yellow/monitor (got ${normTrig?.flag})`);

    // LDL conversion: 1.43 g/L -> 3.70 mmol/L
    const parsedLdl = { name: "Cholestérol LDL", rawValue: 1.43, rawUnit: "g/L" };
    const normLdl = normalizeBiomarker(parsedLdl, "M");
    assert(normLdl !== null, "Should normalize LDL");
    assert(normLdl?.valMmol_L === 3.70, `LDL 1.43 g/L should normalize to 3.70 mmol/L (got ${normLdl?.valMmol_L})`);
    assert(normLdl?.flag === "orange", `LDL 1.43 g/L should be orange/slightly abnormal (got ${normLdl?.flag})`);

    // Test 3: Health Score Calculation
    console.log("\nTesting Health Score Calculation...");
    
    // Test a perfect set of biomarkers (all green/blue)
    const perfectMarkers: NormalizedBiomarker[] = [
      { name: "Triglycérides", rawValue: 1.0, rawUnit: "g/L", valG_L: 1.0, valMmol_L: 1.14, refMin: 0.35, refMax: 1.50, flag: "green", category: "lipid", explanation: "" },
      { name: "Cholestérol HDL", rawValue: 0.65, rawUnit: "g/L", valG_L: 0.65, valMmol_L: 1.68, refMin: 0.40, refMax: 0.90, flag: "blue", category: "lipid", explanation: "" },
      { name: "Cholestérol LDL", rawValue: 1.0, rawUnit: "g/L", valG_L: 1.0, valMmol_L: 2.59, refMin: 0.00, refMax: 1.16, flag: "green", category: "lipid", explanation: "" },
    ];
    const scorePerfect = calculateHealthScore(perfectMarkers);
    assert(scorePerfect.score === 100, `Perfect indicators should yield a score of 100 (got ${scorePerfect.score})`);
    assert(scorePerfect.classification === "Excellent", "Should classify as Excellent");

    // Test an at-risk set of biomarkers
    const atRiskMarkers: NormalizedBiomarker[] = [
      { name: "Triglycérides", rawValue: 3.37, rawUnit: "g/L", valG_L: 3.37, valMmol_L: 3.84, refMin: 0.35, refMax: 1.50, flag: "red", category: "lipid", explanation: "" },
      { name: "Cholestérol LDL", rawValue: 1.45, rawUnit: "g/L", valG_L: 1.45, valMmol_L: 3.75, refMin: 0.00, refMax: 1.16, flag: "red", category: "lipid", explanation: "" },
      { name: "Glucose à jeun", rawValue: 1.18, rawUnit: "g/L", valG_L: 1.18, valMmol_L: 6.55, refMin: 0.70, refMax: 1.10, flag: "yellow", category: "metabolic", explanation: "" },
    ];
    const scoreAtRisk = calculateHealthScore(atRiskMarkers);
    assert(scoreAtRisk.score < 60, `Abnormal indicators should yield a lower score (got ${scoreAtRisk.score})`);
    assert(scoreAtRisk.classification === "Moderate" || scoreAtRisk.classification === "At risk", "Classification should degrade");

    // Test 4: Trend Slope Analysis
    console.log("\nTesting Trend Analysis...");
    // Triglycerides descending (improving)
    const trigTrend = analyzeTrend([3.37, 2.10, 1.50], [new Date(), new Date(), new Date()], "Triglycérides");
    assert(trigTrend === "improving", `Triglycerides descending should be detected as 'improving' (got ${trigTrend})`);

    // HDL ascending (improving)
    const hdlTrend = analyzeTrend([0.49, 0.58, 0.65], [new Date(), new Date(), new Date()], "Cholestérol HDL");
    assert(hdlTrend === "improving", `HDL ascending should be detected as 'improving' (got ${hdlTrend})`);

    // Test 5: Lipid Profile Correlation
    console.log("\nTesting Lipid Profile Correlations...");
    const correlationMarkers: NormalizedBiomarker[] = [
      { name: "Triglycérides", rawValue: 1.95, rawUnit: "g/L", valG_L: 1.95, valMmol_L: 2.22, refMin: 0.35, refMax: 1.50, flag: "yellow", category: "lipid", explanation: "" },
      { name: "Cholestérol HDL", rawValue: 0.35, rawUnit: "g/L", valG_L: 0.35, valMmol_L: 0.90, refMin: 0.40, refMax: 0.88, flag: "red", category: "lipid", explanation: "" },
      { name: "Cholestérol LDL", rawValue: 1.38, rawUnit: "g/L", valG_L: 1.38, valMmol_L: 3.57, refMin: 0.00, refMax: 1.16, flag: "red", category: "lipid", explanation: "" },
    ];
    const correlations = evaluateCorrelations(correlationMarkers);
    assert(correlations.length > 0, "Should detect at least one lipid correlation");
    assert(correlations[0].category === "lipid", "Correlation should be categorized as lipid");
    assert(correlations[0].status === "warning", "Status should be warning due to low HDL and high triglycerides");

    console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
  } catch (err: any) {
    console.error("\n❌ TESTS FAILED:", err.message);
    process.exit(1);
  }
}

runTests();
