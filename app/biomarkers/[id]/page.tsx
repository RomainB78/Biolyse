"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, Info, ShieldAlert, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";
import { BIOMARKER_DEFINITIONS } from "@/lib/normalizer";

export default function BiomarkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = decodeURIComponent(params.id as string);

  const [loading, setLoading] = useState(true);
  const [trends, setTrends] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [displayUnit, setDisplayUnit] = useState<"default" | "alt">("default");

  useEffect(() => {
    async function loadData() {
      try {
        const [trendsRes, profileRes] = await Promise.all([
          fetch("/api/trends"),
          fetch("/api/profile"),
        ]);
        if (trendsRes.ok && profileRes.ok) {
          const trendsData = await trendsRes.json();
          const profileData = await profileRes.json();
          setTrends(trendsData.trends[id] || null);
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Failed to load details", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#EAE6E1] rounded" />
        <div className="h-96 bg-[#EAE6E1] rounded-2xl" />
      </div>
    );
  }

  if (!trends) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle size={48} className="mx-auto text-[#b57c1e]" />
        <h2 className="serif-heading text-2xl font-bold text-[#2B2520]">Biomarqueur introuvable</h2>
        <p className="text-xs text-[#857d77]">
          Le biomarqueur <strong>"{id}"</strong> n'a pas été trouvé dans vos analyses de sang importées.
        </p>
        <Link href="/" className="inline-flex h-9 items-center justify-center rounded-full bg-[#2B2520] px-4 text-xs font-semibold text-[#FBFAF8] mt-4">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  // Get static definition
  const definition = BIOMARKER_DEFINITIONS[id];
  const history = trends.history || [];
  const latestRecord = history[history.length - 1];

  // Unit calculations
  const rawUnit = latestRecord.rawUnit;
  const isGlucoseOrLipid = ["Triglycérides", "Cholestérol HDL", "Cholestérol LDL", "Cholestérol total", "Glucose à jeun"].includes(id);
  const showAltUnit = displayUnit === "alt" && isGlucoseOrLipid;
  const unitLabel = showAltUnit ? "mmol/L" : rawUnit;

  const getChartValue = (h: any) => {
    return showAltUnit && h.valMmol_L ? h.valMmol_L : h.rawValue;
  };

  const currentVal = showAltUnit && latestRecord.valMmol_L ? latestRecord.valMmol_L : latestRecord.rawValue;

  // Reference lines
  let refMinVal = latestRecord.refMin;
  let refMaxVal = latestRecord.refMax;

  if (showAltUnit) {
    if (id === "Triglycérides") {
      refMinVal = refMinVal ? refMinVal * 1.14 : null;
      refMaxVal = refMaxVal ? refMaxVal * 1.14 : null;
    } else if (["Cholestérol HDL", "Cholestérol LDL", "Cholestérol total"].includes(id)) {
      refMinVal = refMinVal ? refMinVal * 2.586 : null;
      refMaxVal = refMaxVal ? refMaxVal * 2.586 : null;
    } else if (id === "Glucose à jeun") {
      refMinVal = refMinVal ? refMinVal * 5.55 : null;
      refMaxVal = refMaxVal ? refMaxVal * 5.55 : null;
    }
  }

  // Prepare chart data format
  const chartData = history.map((h: any) => {
    const dateObj = new Date(h.date);
    return {
      date: dateObj.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      value: getChartValue(h),
      rawDate: h.date,
    };
  });

  // Calculate percentage delta from baseline (first report)
  const baselineRecord = history[0];
  const baselineVal = showAltUnit && baselineRecord.valMmol_L ? baselineRecord.valMmol_L : baselineRecord.rawValue;
  const deltaFromBaseline = ((currentVal - baselineVal) / baselineVal) * 100;

  // Theme styling based on flag status
  let badgeStyle = "bg-[#E8F5E9] text-[#1b5e20]";
  let flagLabel = "Optimal";
  if (latestRecord.flag === "yellow") {
    badgeStyle = "bg-[#FFF8E1] text-[#b57c1e]";
    flagLabel = "À surveiller";
  } else if (latestRecord.flag === "orange") {
    badgeStyle = "bg-[#FFEBEE] text-[#b71c1c]";
    flagLabel = "Hors plage";
  } else if (latestRecord.flag === "red") {
    badgeStyle = "bg-[#FFEBEE] text-red-900 border border-red-200";
    flagLabel = "Critique";
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-[#857d77] hover:text-[#2B2520]">
        <ArrowLeft size={14} /> Retour au tableau de bord
      </Link>

      {/* Title & main metadata */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#EAE6E1] pb-6">
        <div className="flex gap-6 items-center">
          {definition?.image && (
            <div className="w-24 h-24 sm:w-32 sm:h-32 shrink-0 rounded-2xl overflow-hidden shadow-sm border border-[#EAE6E1]">
              <img src={definition.image} alt={id} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#b57c1e] uppercase mono-text">{trends.category}</span>
            <h1 className="serif-heading text-3xl sm:text-4xl font-bold text-[#2B2520] mt-1">{id}</h1>
            <p className="text-xs text-[#857d77] mt-1 max-w-xl">{definition?.explanation}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#EAE6E1]">
          <div className="text-right">
            <span className="text-[10px] text-[#857d77] uppercase font-semibold">Dernière Valeur</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="mono-text text-3xl font-bold tracking-tighter text-[#2B2520]">{currentVal}</span>
              <span className="text-xs text-[#857d77] mono-text">{unitLabel}</span>
            </div>
          </div>
          <div className="h-8 w-px bg-[#EAE6E1]" />
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
            {flagLabel}
          </span>
        </div>
      </section>

      {/* Main Grid: Chart and Analysis details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Time Series Area Chart */}
        <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-[#EAE6E1]">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm text-[#2B2520] flex items-center gap-1.5">
              <TrendingUp size={16} className="text-[#b57c1e]" />
              Historique d'évolution
            </h3>
            
            {isGlucoseOrLipid && (
              <div className="flex gap-2">
                <button
                  onClick={() => setDisplayUnit("default")}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-semibold transition-colors ${
                    displayUnit === "default"
                      ? "bg-[#2B2520] text-[#FBFAF8]"
                      : "bg-[#FBFAF8] text-[#857d77] border border-[#EAE6E1]"
                  }`}
                >
                  {rawUnit}
                </button>
                <button
                  onClick={() => setDisplayUnit("alt")}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-semibold transition-colors ${
                    displayUnit === "alt"
                      ? "bg-[#2B2520] text-[#FBFAF8]"
                      : "bg-[#FBFAF8] text-[#857d77] border border-[#EAE6E1]"
                  }`}
                >
                  mmol/L
                </button>
              </div>
            )}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b57c1e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#b57c1e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE9" vertical={false} />
                <XAxis dataKey="date" stroke="#857d77" fontSize={10} tickLine={false} axisLine={false} dy={10} className="mono-text" />
                <YAxis stroke="#857d77" fontSize={10} tickLine={false} axisLine={false} domain={["auto", "auto"]} dx={-5} className="mono-text" />
                <Tooltip 
                  contentStyle={{ background: "#ffffff", border: "1px solid #EAE6E1", borderRadius: "8px", fontSize: "12px", fontFamily: "Outfit, sans-serif" }}
                  labelStyle={{ fontFamily: "JetBrains Mono, monospace", color: "#857d77" }}
                />
                
                {/* Min / Max References */}
                {typeof refMinVal === "number" && (
                  <ReferenceLine y={refMinVal} stroke="#857d77" strokeDasharray="3 3" strokeWidth={1} label={{ value: `Min ${refMinVal.toFixed(2)}`, fill: "#857d77", fontSize: 9, position: "right" }} />
                )}
                {typeof refMaxVal === "number" && (
                  <ReferenceLine y={refMaxVal} stroke="#857d77" strokeDasharray="3 3" strokeWidth={1} label={{ value: `Max ${refMaxVal.toFixed(2)}`, fill: "#857d77", fontSize: 9, position: "right" }} />
                )}

                <Area type="monotone" dataKey="value" stroke="#b57c1e" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" dot={{ r: 4, fill: "#b57c1e" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="text-[11px] text-[#857d77] leading-relaxed border-t border-[#FBFAF8] pt-4">
            {history.length >= 2 ? (
              <span>
                Évolution de <strong className="text-[#2B2520]">{deltaFromBaseline > 0 ? "+" : ""}{Math.round(deltaFromBaseline)}%</strong> sur la période (valeur initiale à {baselineVal} {unitLabel} en {new Date(baselineRecord.date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}).
              </span>
            ) : (
              <span>Aucun historique pour comparer, ceci est votre bilan de référence.</span>
            )}
          </div>
        </div>

        {/* Right: Lifestyle Guidelines & Context */}
        <div className="space-y-6">
          
          {/* Biomarker context advice */}
          <div className="bg-white rounded-2xl border border-[#EAE6E1] p-6 space-y-4">
            <h3 className="font-semibold text-sm text-[#2B2520] flex items-center gap-1.5 border-b border-[#FBFAF8] pb-3">
              <Sparkles size={16} className="text-[#b57c1e]" />
              Facteurs d'influence
            </h3>
            
            <ul className="text-xs text-[#857d77] space-y-3 leading-relaxed">
              {id === "Triglycérides" && (
                <>
                  <li><strong>Alimentation :</strong> Les sucres raffinés, féculents blancs et boissons sucrées font monter rapidement les triglycérides.</li>
                  <li><strong>Alcool :</strong> Une consommation régulière perturbe le métabolisme hépatique et augmente considérablement le stockage des triglycérides.</li>
                  <li><strong>Cardio :</strong> 3 à 4 heures de sport d'endurance par semaine augmentent l'utilisation des triglycérides par les muscles.</li>
                </>
              )}
              {id === "Cholestérol LDL" && (
                <>
                  <li><strong>Acides gras saturés :</strong> Le beurre, le fromage et les viandes rouges favorisent la production de LDL par le foie.</li>
                  <li><strong>Fibres :</strong> Les fibres solubles (avoine, pommes, légumineuses) captent le cholestérol intestinal et aident à baisser le LDL.</li>
                  <li><strong>Génétique :</strong> Une part importante du cholestérol LDL est synthétisée de manière endogène par l'organisme.</li>
                </>
              )}
              {id === "Cholestérol HDL" && (
                <>
                  <li><strong>Activité physique :</strong> L'exercice régulier en zone d'endurance modérée à intense est le levier principal pour augmenter le HDL.</li>
                  <li><strong>Oméga-3 :</strong> Les graisses de poisson bleu (saumon, sardines) et l'huile d'olive de qualité aident à augmenter le HDL protecteur.</li>
                  <li><strong>Tabagisme :</strong> Le tabac réduit directement le taux de HDL et sa capacité à nettoyer les artères.</li>
                </>
              )}
              {id === "Glucose à jeun" && (
                <>
                  <li><strong>Activité physique :</strong> La contraction musculaire consomme directement le glucose, diminuant l'insulinorésistance.</li>
                  <li><strong>Stress :</strong> Le cortisol libéré en période de stress chronique favorise la libération de glucose par le foie.</li>
                  <li><strong>Sommeil :</strong> Un manque chronique de sommeil perturbe l'action de l'insuline et élève la glycémie matinale.</li>
                </>
              )}
              {(!["Triglycérides", "Cholestérol LDL", "Cholestérol HDL", "Glucose à jeun"].includes(id)) && (
                <li>Les variations de ce biomarqueur sont influencées par la nutrition globale, l'hydratation, la fatigue et les processus physiologiques régulés par vos organes (foie, reins, moelle osseuse).</li>
              )}
            </ul>
          </div>

          {/* Medical Context (Low / High) */}
          {(definition?.lowMeaning || definition?.highMeaning) && (
            <div className="bg-[#FBFAF8] rounded-2xl border border-[#EAE6E1] p-6 space-y-4">
              <h3 className="font-semibold text-sm text-[#2B2520] flex items-center gap-1.5 border-b border-[#EAE6E1] pb-3">
                <Activity size={16} className="text-[#2B2520]" />
                Interprétation scientifique
              </h3>
              
              <div className="space-y-3">
                {typeof refMinVal === "number" && currentVal < refMinVal && definition.lowMeaning && (
                  <div className="text-xs text-[#b71c1c] bg-[#FFEBEE] p-4 rounded-xl leading-relaxed border border-red-100">
                    <strong className="block mb-1">Analyse détaillée (Taux inférieur) :</strong> {definition.lowMeaning}
                  </div>
                )}
                {typeof refMaxVal === "number" && currentVal > refMaxVal && definition.highMeaning && (
                  <div className="text-xs text-[#b71c1c] bg-[#FFEBEE] p-4 rounded-xl leading-relaxed border border-red-100">
                    <strong className="block mb-1">Analyse détaillée (Taux supérieur) :</strong> {definition.highMeaning}
                  </div>
                )}
                {typeof refMinVal === "number" && typeof refMaxVal === "number" && currentVal >= refMinVal && currentVal <= refMaxVal && (
                  <div className="text-xs text-[#1b5e20] bg-[#E8F5E9] p-4 rounded-xl leading-relaxed border border-green-100">
                    <strong className="block mb-1">Analyse détaillée (Taux optimal) :</strong> Vos valeurs sont parfaitement physiologiques. La fonction associée à ce marqueur s'exécute de manière optimale.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Safe guidelines */}
          <div className="bg-[#FFF8E1]/30 rounded-2xl border border-[#FFF8E1] p-6 space-y-4">
            <h3 className="font-semibold text-sm text-[#b57c1e] flex items-center gap-1.5">
              <Info size={16} />
              Recommandation
            </h3>
            
            <p className="text-xs leading-relaxed text-[#857d77]">
              {id === "Triglycérides" && "Réduisez l'apport de sucres simples (jus de fruits, gâteaux, sucre blanc) et augmentez les apports en oméga-3. Favorisez 150 minutes d'activité aérobie hebdomadaire."}
              {id === "Cholestérol LDL" && "Intégrez des huiles insaturées (olive, colza), mangez plus de fibres végétales (pommes, flocons d'avoine) et diminuez les graisses saturées d'origine animale."}
              {id === "Cholestérol HDL" && "Privilégiez la marche rapide ou le vélo tous les jours. C'est le meilleur moyen naturel de rehausser votre HDL de 10 à 15%."}
              {id === "Glucose à jeun" && "Pratiquez des marches de 10 minutes après les repas majeurs. Privilégiez des nuits régulières de plus de 7 heures pour réguler votre sécrétion de cortisol."}
              {(!["Triglycérides", "Cholestérol LDL", "Cholestérol HDL", "Glucose à jeun"].includes(id)) && "Maintenez une alimentation équilibrée et une hydratation adéquate de 1,5 à 2 litres d'eau par jour pour soutenir le travail des reins et du foie."}
            </p>
          </div>

        </div>

      </div>

      {/* Detailed Scientific Explanation Section */}
      {definition?.detailedExplanation && (
        <section className="bg-white rounded-2xl border border-[#EAE6E1] p-8 space-y-4 shadow-sm">
          <h3 className="font-semibold text-lg text-[#2B2520] flex items-center gap-2 border-b border-[#FBFAF8] pb-4">
            <Info size={20} className="text-[#b57c1e]" />
            C'est quoi, concrètement ?
          </h3>
          <p className="text-sm text-[#4a4541] leading-loose text-justify">
            {definition.detailedExplanation}
          </p>
        </section>
      )}

      {/* Safety warning */}
      <section className="bg-red-50/50 rounded-2xl border border-red-100 p-6 space-y-3">
        <h4 className="font-semibold text-xs text-[#b71c1c] flex items-center gap-2 uppercase tracking-wider">
          <ShieldAlert size={16} /> Note de sécurité & Clause de non-responsabilité
        </h4>
        <p className="text-[11px] leading-relaxed text-red-950">
          Cette fiche descriptive détaille des informations biologiques à vocation pédagogique. Elle n'est en aucun cas qualifiée pour poser un diagnostic, prescrire un traitement, ou recommander une modification de médication. Toute interprétation médicale de ces données doit faire l'objet d'un examen minutieux avec un professionnel de santé diplômé, seul apte à contextualiser ces analyses dans votre dossier clinique global.
        </p>
      </section>
    </div>
  );
}
