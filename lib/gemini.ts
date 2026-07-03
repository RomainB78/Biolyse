import { NormalizedBiomarker } from "./types";

// Generates editorial-style French summary analysis
export async function generateInsightSummary(
  biomarkers: NormalizedBiomarker[],
  historyReports: { date: Date; biomarkers: { name: string; rawValue: number }[] }[],
  age: number,
  sex: "M" | "F"
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Gather current values
  const getMarkerVal = (name: string) => biomarkers.find((b) => b.name === name)?.rawValue;
  const ldlCur = getMarkerVal("Cholestérol LDL");
  const hdlCur = getMarkerVal("Cholestérol HDL");
  const trigCur = getMarkerVal("Triglycérides");
  const glucCur = getMarkerVal("Glucose à jeun");
  const crpCur = getMarkerVal("CRP (Protéine C-Réactive)");

  // Gather baseline values if history exists
  let ldlBase = ldlCur;
  let hdlBase = hdlCur;
  let trigBase = trigCur;
  let glucBase = glucCur;
  let crpBase = crpCur;
  let monthsDelta = 0;

  if (historyReports.length > 0) {
    const baseline = historyReports[0]; // chronological order (oldest first)
    const latest = historyReports[historyReports.length - 1];
    
    const getBaseVal = (name: string) => baseline.biomarkers.find((b) => b.name === name)?.rawValue;
    ldlBase = getBaseVal("Cholestérol LDL") ?? ldlCur;
    hdlBase = getBaseVal("Cholestérol HDL") ?? hdlCur;
    trigBase = getBaseVal("Triglycérides") ?? trigCur;
    glucBase = getBaseVal("Glucose à jeun") ?? glucCur;
    crpBase = getBaseVal("CRP (Protéine C-Réactive)") ?? crpCur;

    const diffMs = Math.abs(latest.date.getTime() - baseline.date.getTime());
    monthsDelta = Math.round(diffMs / (1000 * 60 * 60 * 24 * 30.4));
  }

  // Define helper text for months
  const durationText = monthsDelta > 0 
    ? `${Math.floor(monthsDelta / 12) > 0 ? `${Math.floor(monthsDelta / 12)} ans et ` : ""}${monthsDelta % 12} mois`
    : "quelques mois";

  // Build the local deterministic narrative
  let localSummary = "";

  if (historyReports.length >= 2) {
    // We have actual longitudinal history!
    let intro = `En ${durationText}, ton métabolisme a fait des vagues. `;
    let trigNarrative = "";
    let hdlNarrative = "";
    let ldlNarrative = "";
    let glucNarrative = "";

    if (trigCur !== undefined && trigBase !== undefined) {
      const trigChange = ((trigCur - trigBase) / trigBase) * 100;
      if (trigChange < -30) {
        trigNarrative = `Tes triglycérides se sont effondrés (${Math.round(trigChange)}%), `;
      } else if (trigChange < -5) {
        trigNarrative = `Tes triglycérides sont en baisse de ${Math.round(Math.abs(trigChange))}%, `;
      } else if (trigChange > 15) {
        trigNarrative = `Tes triglycérides ont progressé (+${Math.round(trigChange)}%), `;
      }
    }

    if (hdlCur !== undefined && hdlBase !== undefined) {
      const hdlChange = ((hdlCur - hdlBase) / hdlBase) * 100;
      if (hdlChange > 15) {
        hdlNarrative = `ton bon cholestérol n'a jamais été aussi haut (+${Math.round(hdlChange)}%), `;
      } else if (hdlChange < -10) {
        hdlNarrative = `ton bon cholestérol est en retrait (${Math.round(hdlChange)}%), `;
      }
    }

    if (glucCur !== undefined && glucBase !== undefined) {
      if (glucCur <= 1.10 && glucBase > 1.10) {
        glucNarrative = `et ton sucre est redevenu normal. `;
      } else if (glucCur > 1.10) {
        glucNarrative = `et ton taux de sucre reste à surveiller. `;
      } else {
        glucNarrative = `et ta glycémie reste stable. `;
      }
    }

    if (ldlCur !== undefined && ldlCur > 1.16) {
      ldlNarrative = `La seule chose qui traîne encore, c'est ton mauvais cholestérol (${ldlCur} g/L) — à garder à l'oeil.`;
    } else {
      ldlNarrative = `Tous tes indicateurs lipidiques majeurs s'alignent vers le vert.`;
    }

    // Combine them matching the screenshot style:
    // "En trois ans et demi, ton métabolisme a fait volte-face. Tes triglycérides se sont effondrés (-55%), ton bon cholestérol n'a jamais été aussi haut, et ton sucre est redevenu normal. La seule chose qui traîne encore, c'est ton mauvais cholestérol — à garder à l'oeil."
    if (trigNarrative || hdlNarrative || glucNarrative) {
      localSummary = `En ${durationText}, ton métabolisme a fait volte-face. ${trigNarrative}${hdlNarrative}${glucNarrative}${ldlNarrative}`;
    } else {
      localSummary = `Ton métabolisme est globalement équilibré sur la période de ${durationText}. Le cholestérol LDL (${ldlCur ?? "N/A"} g/L) et les triglycérides (${trigCur ?? "N/A"} g/L) restent vos principaux axes d'ajustement.`;
    }
  } else {
    // Single report analysis summary
    let listNotes = [];
    if (trigCur && trigCur > 1.50) listNotes.push(`triglycérides élevés (${trigCur} g/L)`);
    if (ldlCur && ldlCur > 1.16) listNotes.push(`cholestérol LDL hors plage (${ldlCur} g/L)`);
    if (glucCur && glucCur > 1.10) listNotes.push(`glycémie légèrement haute (${glucCur} g/L)`);
    if (crpCur && crpCur > 5.0) listNotes.push(`signe d'inflammation légère (CRP à ${crpCur} mg/L)`);

    if (listNotes.length > 0) {
      localSummary = `Ce premier bilan met en évidence ${listNotes.join(", ")}. Les autres marqueurs analysés se situent dans les plages optimales. La mise en place de mesures d'hygiène de vie ciblées permettra de réguler ces indicateurs.`;
    } else {
      localSummary = "Félicitations, votre profil biologique initial est excellent. L'ensemble des marqueurs clés (lipides, métabolisme du sucre, inflammation) s'inscrivent parfaitement dans les zones de référence recommandées.";
    }
  }

  // If Gemini API Key is available, let's use it to write an even more custom editorial summary
  if (apiKey) {
    try {
      const prompt = `
        Tu es un expert en vulgarisation médicale pour une application de santé haut de gamme appelée Biolyse.
        Tu dois rédiger un résumé d'analyse de bilan sanguin en Français, d'un ton chaleureux, encourageant et éditorial (comme une newsletter ou l'application Apple Health/Notion).
        
        DONNÉES DU PATIENT :
        - Âge : ${age} ans
        - Sexe : ${sex}
        - Nombre de bilans dans l'historique : ${historyReports.length + 1}
        - Durée du suivi : ${durationText}
        
        MARQUEURS ACTUELS :
        - Triglycérides : ${trigCur ?? "Non mesuré"} g/L (Cible : < 1.50)
        - Cholestérol HDL : ${hdlCur ?? "Non mesuré"} g/L (Cible : > 0.40)
        - Cholestérol LDL : ${ldlCur ?? "Non mesuré"} g/L (Cible : < 1.16)
        - Glycémie à jeun : ${glucCur ?? "Non mesuré"} g/L (Cible : 0.70 - 1.10)
        - CRP : ${crpCur ?? "Non mesuré"} mg/L (Cible : < 5.0)
        
        VALEURS DE DÉPART (BASELINE il y a ${durationText}) :
        - Triglycérides départ : ${trigBase ?? "N/A"} g/L
        - HDL départ : ${hdlBase ?? "N/A"} g/L
        - LDL départ : ${ldlBase ?? "N/A"} g/L
        - Glycémie départ : ${glucBase ?? "N/A"} g/L
        
        CONSIGNES TRÈS STRICTES :
        1. NE FAIS AUCUN DIAGNOSTIC MEDICAL. Ne dis pas "vous avez un diabète", "vous souffrez d'hypercholestérolémie". Utilise des termes descriptifs ("taux de sucre élevé", "sensibilité à l'insuline", "profil lipidique à surveiller").
        2. Rédige un court paragraphe (2-4 phrases maximum).
        3. Inspire-toi du style suivant :
           "En trois ans et demi, ton métabolisme a fait volte-face. Tes triglycérides se sont effondrés (-55%), ton bon cholestérol n'a jamais été aussi haut, et ton sucre est redevenu normal. La seule chose qui traîne encore, c'est ton mauvais cholestérol — à garder à l'oeil."
        4. Parle au patient en le tutoyant ("ton métabolisme", "tes triglycérides") ou au vouvoiement si le tutoiement ne s'applique pas, mais privilégie le tutoiement direct comme dans l'exemple ("ton", "tes") pour rester intime et moderne.
        
        Rédige uniquement le paragraphe d'analyse :
      `;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: 250,
              temperature: 0.3,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 10) {
          return text.trim();
        }
      }
    } catch (e) {
      console.error("Gemini API call failed, using high-fidelity local generator", e);
    }
  }

  return localSummary;
}
