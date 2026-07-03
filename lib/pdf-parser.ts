// pdf-parse is required dynamically inside the parser function
import { IngestionResult, ParsedBiomarker } from "./types";
import { BIOMARKER_DEFINITIONS, standardizeString } from "./normalizer";

// Detects the name of the laboratory from the raw text
export function detectLaboratory(text: string): string {
  const lowercaseText = text.toLowerCase();
  if (lowercaseText.includes("biofutur")) return "Biofutur";
  if (lowercaseText.includes("cerballiance")) return "Cerballiance";
  if (lowercaseText.includes("eurofins")) return "Eurofins";
  if (lowercaseText.includes("inovie")) return "Inovie";
  if (lowercaseText.includes("biogroup")) return "Biogroup";
  if (lowercaseText.includes("ch ") || lowercaseText.includes("hopital") || lowercaseText.includes("chu ")) return "Centre Hospitalier";
  return "Laboratoire d'analyses";
}

// Detects the date of analysis from the raw text
export function detectDate(text: string): Date {
  // Matches common French date formats: DD/MM/YYYY or DD.MM.YYYY or DD-MM-YYYY
  const dateRegex = /\b(\d{1,2})[\/\.\-](\d{1,2})[\/\.\-](\d{2,4})\b/;
  const match = text.match(dateRegex);
  
  if (match) {
    let day = parseInt(match[1], 10);
    let month = parseInt(match[2], 10) - 1; // JS months are 0-11
    let year = parseInt(match[3], 10);
    if (year < 100) {
      year += year > 50 ? 1900 : 2000;
    }
    const parsedDate = new Date(Date.UTC(year, month, day, 12, 0, 0));
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }
  }

  // Fallback: look for written months like "12 juin 2026"
  const frenchMonths = [
    "janvier", "fevrier", "mars", "avril", "mai", "juin",
    "juillet", "aout", "septembre", "octobre", "novembre", "decembre"
  ];
  const textClean = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  for (let m = 0; m < frenchMonths.length; m++) {
    const monthName = frenchMonths[m];
    const writtenDateRegex = new RegExp(`(\\d{1,2})\\s+${monthName}\\s+(\\d{4})`, "i");
    const mMatch = textClean.match(writtenDateRegex);
    if (mMatch) {
      const day = parseInt(mMatch[1], 10);
      const year = parseInt(mMatch[2], 10);
      const parsedDate = new Date(Date.UTC(year, m, day, 12, 0, 0));
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
  }

  return new Date(); // fallback to today
}

// Attempts to extract biomarkers using regex heuristics
export function extractBiomarkersHeuristic(text: string): ParsedBiomarker[] {
  const lines = text.split("\n");
  const parsedBiomarkers: ParsedBiomarker[] = [];
  
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    
    // Look for definitions
    for (const def of Object.values(BIOMARKER_DEFINITIONS)) {
      let matchedSynonym: string | null = null;
      
      // Match canonical name or synonyms
      const namesToTry = [def.canonicalName, ...def.frenchSynonyms];
      for (const name of namesToTry) {
        const stdName = standardizeString(name);
        const stdLine = standardizeString(line);
        // Look for exact word match of synonym in line
        if (stdLine.includes(stdName)) {
          matchedSynonym = name;
          break;
        }
      }
      
      if (matchedSynonym) {
        // We found a line referencing this biomarker! Let's extract values.
        // We look for numbers, units, and optional reference ranges.
        // Typical structure: [Name] ... [Value] [Unit] ... [RefRange]
        // Numbers can be integer or decimal, often written with commas like 1,50 or 0,65.
        // Let's capture numbers, units like g/L, mmol/L, mg/dL, %, mg/L, G/L, /mm3, mm3, pg, fl, g/dL
        const lineWithDots = line.replace(/,/g, ".");
        
        // Match numbers following the biomarker:
        // We want to extract:
        // 1. The main value (e.g. 1.50)
        // 2. The unit (e.g. g/L)
        // 3. Reference range min/max (e.g. 0.35 - 1.50 or < 1.16 or inf à 1.50)
        
        // Regex to search for a value and a unit (including giga/L and Tera/L for French labs)
        const valueRegex = /(\d+(?:\.\d+)?)\s*(g\/L|mmol\/L|mg\/dL|%|mg\/L|G\/L|giga\/L|Tera\/L|\/mm3|mm3|g\/dL|µg\/L|ng\/mL|pg|fl)\b/i;
        const vMatch = lineWithDots.match(valueRegex);
        
        if (vMatch) {
          const rawValue = parseFloat(vMatch[1]);
          const rawUnit = vMatch[2];
          
          // Try to extract ref range from this same line
          let refMin: number | undefined;
          let refMax: number | undefined;
          
          // Look for ranges like "0.35 - 1.50" or "0.35 a 1.50" or "0.35 à 1.50"
          const rangeRegex = /(\d+(?:\.\d+)?)\s*(?:-|a|à)\s*(\d+(?:\.\d+)?)/;
          const rMatch = lineWithDots.match(rangeRegex);
          if (rMatch) {
            // Ensure we don't accidentally match the main value as refMin
            const val1 = parseFloat(rMatch[1]);
            const val2 = parseFloat(rMatch[2]);
            if (val1 !== rawValue) {
              refMin = val1;
              refMax = val2;
            } else {
              // The main value matched the range, see if there is another range matching
              const remainingLine = lineWithDots.replace(rMatch[0], "");
              const rMatch2 = remainingLine.match(rangeRegex);
              if (rMatch2) {
                refMin = parseFloat(rMatch2[1]);
                refMax = parseFloat(rMatch2[2]);
              }
            }
          }
          
          // If no range but a limit like "< 1.16" or "inf. à 1.16"
          if (refMin === undefined && refMax === undefined) {
            const lessThanRegex = /(?:<|inf|inferieur|inférieur)\s*(\d+(?:\.\d+)?)/i;
            const ltMatch = lineWithDots.match(lessThanRegex);
            if (ltMatch) {
              refMin = 0;
              refMax = parseFloat(ltMatch[1]);
            }
            
            const greaterThanRegex = /(?:>|sup|superieur|supérieur)\s*(\d+(?:\.\d+)?)/i;
            const gtMatch = lineWithDots.match(greaterThanRegex);
            if (gtMatch) {
              refMin = parseFloat(gtMatch[1]);
              refMax = 99999;
            }
          }
          
          // Avoid duplicates in the same report
          const isDuplicate = parsedBiomarkers.some(b => b.name === def.canonicalName);
          if (!isDuplicate) {
            parsedBiomarkers.push({
              name: def.canonicalName,
              rawValue,
              rawUnit,
              refMin,
              refMax,
            });
          }
          break; // move to next line
        }
      }
    }
  }
  
  return parsedBiomarkers;
}

// Main PDF ingestion entry point
export async function parseBloodReportPDF(pdfBuffer: Buffer): Promise<IngestionResult> {
  let rawText = "";
  let ocrNecessity = false;

  try {
    const pdfParser = require("pdf-parse");
    const data = await pdfParser(pdfBuffer);
    rawText = data.text;
    
    // If pdf-parse returns almost empty or empty text, OCR is required
    if (!rawText || rawText.trim().length < 50) {
      ocrNecessity = true;
      rawText = "";
    }
  } catch (err) {
    console.error("PDF-parse failed, fallback to OCR simulation", err);
    ocrNecessity = true;
  }

  // If OCR is necessary, we simulate text extraction (returns typical OCR'd text or we will mock it in controllers)
  if (ocrNecessity) {
    return {
      rawText: "",
      biomarkers: [],
      ocrNecessity: true,
    };
  }

  const labName = detectLaboratory(rawText);
  const date = detectDate(rawText);
  const biomarkers = extractBiomarkersHeuristic(rawText);

  return {
    date,
    labName,
    biomarkers,
    rawText,
    ocrNecessity: false,
  };
}

// Validates if text contains typical French blood test keywords
export function isBloodReportText(text: string): boolean {
  const cleanText = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const keywords = [
    "laboratoire",
    "analyse",
    "biologie",
    "hematologie",
    "biochimie",
    "serologie",
    "leucocytes",
    "valeurs de reference",
    "globules",
    "plaquettes",
    "prelevement",
    "compte-rendu",
    "diagnostic"
  ];
  
  let matchCount = 0;
  for (const keyword of keywords) {
    if (cleanText.includes(keyword)) {
      matchCount++;
    }
  }
  
  return matchCount >= 2;
}
