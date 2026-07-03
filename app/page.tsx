"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Upload, 
  Calendar, 
  Brain, 
  Activity, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  User,
  ArrowRight,
  Info,
  Check
} from "lucide-react";
import HealthScoreRadial from "@/components/HealthScoreRadial";
import BiomarkerCard from "@/components/BiomarkerCard";
import Base100Chart from "@/components/Base100Chart";
import { evaluateCorrelations, generateRecommendations } from "@/lib/scoring";

export default function DashboardPage() {
  const router = useRouter();
  
  // Dashboard states
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [trends, setTrends] = useState<any>({});

  // Onboarding workflow states (0: Profile, 1: Upload)
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileConfirmed, setProfileConfirmed] = useState(false);

  // Profile form states
  const [age, setAge] = useState<number | "">("");
  const [sex, setSex] = useState<"M" | "F">("M");
  const [height, setHeight] = useState<number | "">("");
  const [weight, setWeight] = useState<number | "">("");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [smoker, setSmoker] = useState(false);
  const [alcohol, setAlcohol] = useState("occasional");
  const [sleepHours, setSleepHours] = useState(8);
  const [healthGoals, setHealthGoals] = useState<string[]>(["fitness"]);

  // Upload states
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const steps = [
    "Analyse de la structure du PDF & Détection OCR...",
    "Extraction des tables de biomarqueurs...",
    "Normalisation des unités et des synonymes...",
    "Calcul du score métabolique & Analyse préventive...",
  ];

  const availableGoals = [
    { id: "lipid_control", label: "Contrôle du cholestérol" },
    { id: "metabolic_health", label: "Santé métabolique" },
    { id: "cardiovascular_prevention", label: "Prévention" },
    { id: "fitness", label: "Forme & Vitalité" },
  ];

  const loadDashboardData = async () => {
    try {
      const [profileRes, reportsRes, trendsRes] = await Promise.all([
        fetch("/api/profile"),
        fetch("/api/reports"),
        fetch("/api/trends"),
      ]);

      const profileData = await profileRes.json();
      const reportsData = await reportsRes.json();
      const trendsData = await trendsRes.json();

      setProfile(profileData);
      setReports(reportsData);
      setTrends(trendsData.trends || {});

      // Load form details from fetched profile
      if (profileData && !profileData.isNew && profileData.age) {
        setAge(profileData.age);
        setHeight(profileData.height);
        setWeight(profileData.weight);
        setSex(profileData.sex || "M");
        setActivityLevel(profileData.activityLevel || "moderate");
        if (profileData.lifestyle) {
          setSmoker(!!profileData.lifestyle.smoker);
          setAlcohol(profileData.lifestyle.alcohol || "occasional");
          const sleepNum = parseInt(profileData.lifestyle.sleep, 10);
          if (!isNaN(sleepNum)) {
            setSleepHours(sleepNum);
          }
        }
        if (Array.isArray(profileData.healthGoals) && profileData.healthGoals.length > 0) {
          setHealthGoals(profileData.healthGoals);
        }
        
        if (reportsData.length === 0) {
          setOnboardingStep(1);
        }
      } else {
        setAge("");
        setHeight("");
        setWeight("");
        if (reportsData.length === 0) {
          setOnboardingStep(0);
        }
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleGoalToggle = (goalId: string) => {
    if (healthGoals.includes(goalId)) {
      setHealthGoals(healthGoals.filter((g) => g !== goalId));
    } else {
      setHealthGoals([...healthGoals, goalId]);
    }
  };

  // Submit profile to go to Step 2
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          age,
          sex,
          height,
          weight,
          activityLevel,
          lifestyle: {
            smoker,
            alcohol,
            sleep: `${sleepHours}h`,
          },
          healthGoals,
        }),
      });

      if (res.ok) {
        // Go to PDF upload step
        setOnboardingStep(1);
      } else {
        alert("Erreur lors de la sauvegarde du profil.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau.");
    } finally {
      setProfileSaving(false);
    }
  };

  // Upload drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setUploadError(null);
      } else {
        setUploadError("Seuls les fichiers PDF sont acceptés.");
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setUploadError(null);
      } else {
        setUploadError("Seuls les fichiers PDF sont acceptés.");
      }
    }
  };

  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    setUploadError(null);
    setProcessStep(0);

    const interval = setInterval(() => {
      setProcessStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        clearInterval(interval);
        return prev;
      });
    }, 1500);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(interval);

      if (res.ok && data.success) {
        setProcessStep(steps.length);
        setTimeout(async () => {
          setFile(null);
          setProcessing(false);
          setLoading(true);
          await loadDashboardData();
        }, 1200);
      } else {
        setUploadError(data.error || "Une erreur est survenue lors de l'extraction.");
        setProcessing(false);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setUploadError("Impossible d'envoyer le fichier. Vérifiez votre connexion.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-12 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="h-4 w-28 bg-[#EAE6E1] rounded" />
            <div className="h-8 w-3/4 bg-[#EAE6E1] rounded" />
            <div className="h-20 w-full bg-[#EAE6E1] rounded" />
          </div>
          <div className="h-44 bg-[#EAE6E1] rounded-2xl" />
        </div>

        <div className="space-y-6">
          <div className="h-6 w-48 bg-[#EAE6E1] rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-48 bg-[#EAE6E1] rounded-2xl" />
            <div className="h-48 bg-[#EAE6E1] rounded-2xl" />
            <div className="h-48 bg-[#EAE6E1] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // EMPTY STATE WITH STEP-BY-STEP ONBOARDING
  if (reports.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="serif-heading text-4xl font-bold tracking-tight text-[#2B2520]">
            Biolyse AI
          </h1>
          <p className="text-xs text-[#857d77]">
            Votre espace d'analyse biologique préventive intelligent.
          </p>
        </div>

        {/* Custom Stepper Navigation */}
        <div className="flex justify-center items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#857d77] pb-2 border-b border-[#EAE6E1]">
          <span className={`px-2 py-0.5 rounded-md ${onboardingStep === 0 ? "text-[#b57c1e] bg-[#FFF8E1]" : "text-[#1b5e20]"}`}>
            1. Profil de Santé
          </span>
          <span className="text-[#EAE6E1]">/</span>
          <span className={`px-2 py-0.5 rounded-md ${onboardingStep === 1 ? "text-[#b57c1e] bg-[#FFF8E1]" : ""}`}>
            2. Import du Bilan
          </span>
        </div>

        {/* STEP 1: CONFIGURE HEALTH PROFILE */}
        {onboardingStep === 0 && (
          <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl border border-[#EAE6E1] p-6 space-y-6">
            <div className="space-y-1">
              <h2 className="font-bold text-lg text-[#2B2520] flex items-center gap-2">
                <User size={18} className="text-[#b57c1e]" />
                Étape 1 : Renseignez votre profil
              </h2>
              <p className="text-[11px] text-[#857d77]">
                Ces données physiologiques permettent de calibrer les seuils d'analyse.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#2B2520]">Âge</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ex. 23"
                  className="w-full h-9 px-3 rounded-lg border border-[#EAE6E1] bg-[#FBFAF8] text-xs focus:outline-none focus:border-[#b57c1e] mono-text"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#2B2520]">Sexe Biologique</label>
                <div className="flex gap-3">
                  <label className="flex-1 inline-flex items-center justify-center h-9 rounded-lg border border-[#EAE6E1] cursor-pointer hover:bg-[#FBFAF8] transition-colors relative">
                    <input type="radio" name="sex" checked={sex === "M"} onChange={() => setSex("M")} className="sr-only" />
                    <span className={`text-xs ${sex === "M" ? "font-bold text-[#b57c1e]" : "text-[#857d77]"}`}>Homme</span>
                  </label>
                  <label className="flex-1 inline-flex items-center justify-center h-9 rounded-lg border border-[#EAE6E1] cursor-pointer hover:bg-[#FBFAF8] transition-colors relative">
                    <input type="radio" name="sex" checked={sex === "F"} onChange={() => setSex("F")} className="sr-only" />
                    <span className={`text-xs ${sex === "F" ? "font-bold text-[#b57c1e]" : "text-[#857d77]"}`}>Femme</span>
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#2B2520]">Taille (cm)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ex. 180"
                  className="w-full h-9 px-3 rounded-lg border border-[#EAE6E1] bg-[#FBFAF8] text-xs focus:outline-none focus:border-[#b57c1e] mono-text"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#2B2520]">Poids (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="Ex. 75"
                  className="w-full h-9 px-3 rounded-lg border border-[#EAE6E1] bg-[#FBFAF8] text-xs focus:outline-none focus:border-[#b57c1e] mono-text"
                  required
                />
              </div>
            </div>

            {/* Sleep Carousel (1 to 12) */}
            <div className="space-y-2 pt-1 border-t border-[#FBFAF8]">
              <label className="text-[11px] font-semibold text-[#2B2520] block">
                Sommeil moyen (heures par nuit)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSleepHours(h)}
                    className={`h-9 w-9 rounded-full border text-[11px] font-semibold flex items-center justify-center shrink-0 transition-all ${
                      sleepHours === h
                        ? "bg-[#2B2520] border-[#2B2520] text-[#FBFAF8] scale-105"
                        : "border-[#EAE6E1] hover:bg-[#FBFAF8] text-[#857d77]"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            {/* Activity & Alcohol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#2B2520]">Activité Physique</label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[#EAE6E1] bg-[#FBFAF8] text-xs focus:outline-none focus:border-[#b57c1e]"
                >
                  <option value="sedentary">Sédentaire (Pas d'activité)</option>
                  <option value="moderate">Activité modérée (1-3x/semaine)</option>
                  <option value="active">Actif (3-5x/semaine)</option>
                  <option value="very_active">Très actif (Quotidien)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-[#2B2520]">Alcool</label>
                <select
                  value={alcohol}
                  onChange={(e) => setAlcohol(e.target.value)}
                  className="w-full h-9 px-2 rounded-lg border border-[#EAE6E1] bg-[#FBFAF8] text-xs focus:outline-none focus:border-[#b57c1e]"
                >
                  <option value="none">Aucune</option>
                  <option value="occasional">Occasionnelle</option>
                  <option value="regular">Régulière</option>
                </select>
              </div>
            </div>

            {/* Smoker Checkbox */}
            <div className="flex items-center gap-2 p-2.5 bg-[#FBFAF8] rounded-lg border border-[#EAE6E1]">
              <input
                type="checkbox"
                id="smoker"
                checked={smoker}
                onChange={(e) => setSmoker(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#EAE6E1] text-[#b57c1e] focus:ring-[#b57c1e]"
              />
              <label htmlFor="smoker" className="text-[10px] font-medium text-[#2B2520] cursor-pointer select-none">
                Je consomme activement du tabac ou de la nicotine.
              </label>
            </div>

            {/* Health Goals selector */}
            <div className="space-y-2 border-t border-[#FBFAF8] pt-4">
              <label className="text-[11px] font-semibold text-[#2B2520]">Objectifs de santé</label>
              <div className="grid grid-cols-2 gap-2">
                {availableGoals.map((goal) => {
                  const isSelected = healthGoals.includes(goal.id);
                  return (
                    <div
                      key={goal.id}
                      onClick={() => handleGoalToggle(goal.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer text-xs transition-colors ${
                        isSelected
                          ? "border-[#b57c1e] bg-[#FFF8E1]/30 text-[#b57c1e] font-semibold"
                          : "border-[#EAE6E1] hover:bg-[#FBFAF8]"
                      }`}
                    >
                      <span>{goal.label}</span>
                      {isSelected && <Check size={12} />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div className="flex items-center gap-2.5 p-3 bg-[#FBFAF8] rounded-xl border border-[#EAE6E1] mt-2">
              <input
                type="checkbox"
                id="profileConfirmed"
                checked={profileConfirmed}
                onChange={(e) => setProfileConfirmed(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#EAE6E1] text-[#b57c1e] focus:ring-[#b57c1e] cursor-pointer"
              />
              <label htmlFor="profileConfirmed" className="text-[10px] font-medium text-[#2B2520] cursor-pointer select-none">
                Je confirme l'exactitude de ces informations physiologiques de départ.
              </label>
            </div>

            {/* Submit Step 1 */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={!profileConfirmed || profileSaving || age === "" || height === "" || weight === ""}
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-5 text-xs font-semibold text-[#FBFAF8] transition-all bg-[#2B2520] hover:bg-[#2B2520]/85 disabled:bg-[#EAE6E1] disabled:text-[#857d77] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Continuer
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: PDF UPLOAD ZONE (Unlocked after profile complete) */}
        {onboardingStep === 1 && (
          <div className="space-y-6">
            {!processing ? (
              <div className="space-y-6">
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className={`flex flex-col items-center justify-center p-14 bg-white rounded-3xl border border-dashed transition-all cursor-pointer ${
                    dragActive 
                      ? "border-[#b57c1e] bg-[#FFF8E1]/10 scale-[1.01]" 
                      : "border-[#EAE6E1] hover:border-[#b57c1e]/60"
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload"
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                  
                  <div className="h-16 w-16 rounded-full bg-[#FBFAF8] border border-[#EAE6E1] flex items-center justify-center text-[#857d77] mb-6">
                    <Upload size={26} />
                  </div>

                  {file ? (
                    <div className="text-center space-y-1">
                      <p className="text-sm font-semibold text-[#2B2520]">{file.name}</p>
                      <p className="text-[10px] text-[#857d77] mono-text">
                        {(file.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs font-semibold text-[#2B2520]">
                        Déposez votre bilan sanguin en PDF ici, ou{" "}
                        <span className="text-[#b57c1e] hover:underline font-bold">
                          parcourez vos dossiers
                        </span>
                      </p>
                      <p className="text-[10px] text-[#857d77] mt-2">
                        Format PDF uniquement (Biofutur, Cerballiance, Eurofins, etc.)
                      </p>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="p-4 bg-[#FFEBEE] border border-red-100 rounded-2xl text-xs text-[#b71c1c] flex items-start gap-2.5">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div className="leading-relaxed">{uploadError}</div>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setOnboardingStep(0)}
                    className="text-xs font-semibold text-[#857d77] hover:underline"
                  >
                    ← Modifier mon profil
                  </button>

                  {file && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => setFile(null)}
                        className="inline-flex h-9 items-center justify-center rounded-full border border-[#EAE6E1] bg-white px-5 text-xs font-semibold text-[#2B2520] hover:bg-[#FBFAF8]"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={processFile}
                        className="inline-flex h-9 items-center justify-center rounded-full bg-[#2B2520] px-5 text-xs font-semibold text-[#FBFAF8] hover:bg-[#2B2520]/85 cursor-pointer"
                      >
                        Lancer l'analyse
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Real-time processing timeline screen */
              <div className="bg-white rounded-3xl border border-[#EAE6E1] p-10 text-center space-y-8">
                <div className="flex items-center justify-center">
                  {processStep < steps.length ? (
                    <RefreshCw size={36} className="text-[#b57c1e] animate-spin" />
                  ) : (
                    <CheckCircle2 size={42} className="text-[#1b5e20] animate-bounce" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="serif-heading text-xl font-bold text-[#2B2520]">
                    {processStep < steps.length ? "Analyse en cours..." : "Analyse terminée !"}
                  </h3>
                  <p className="text-[11px] text-[#857d77]">
                    Extraction en direct de vos données biologiques.
                  </p>
                </div>

                <div className="max-w-sm mx-auto text-left space-y-3.5 border-t border-[#FBFAF8] pt-6">
                  {steps.map((stepText, idx) => {
                    const isDone = processStep > idx;
                    const isActive = processStep === idx;

                    return (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="mt-0.5">
                          {isDone ? (
                            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1b5e20] text-[10px] font-bold">
                              ✓
                            </span>
                          ) : isActive ? (
                            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-[#b57c1e] border-t-transparent animate-spin" />
                          ) : (
                            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[#F0EDE9] text-[#857d77] text-[10px] mono-text">
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-xs ${
                            isDone 
                              ? "text-[#1b5e20] font-medium" 
                              : isActive 
                              ? "text-[#2B2520] font-bold" 
                              : "text-[#857d77]"
                          }`}
                        >
                          {stepText}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const latestReport = reports[0];
  const baselineReport = reports[reports.length - 1];

  const correlations = evaluateCorrelations(latestReport.biomarkers);
  const recommendations = generateRecommendations(latestReport.biomarkers);

  const formattedReportDate = new Date(latestReport.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-12">
      {/* 1. TOP SECTION: Daily Insight Narrative & Radial Score */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-4">
          <span className="text-[10px] font-bold tracking-wider text-[#b57c1e] uppercase mono-text">
            L'insight du bilan
          </span>
          <h1 className="serif-heading text-3xl sm:text-4xl font-bold tracking-tight text-[#2B2520] leading-tight">
            {latestReport.insightSummary}
          </h1>
          <div className="flex items-center gap-2 text-xs text-[#857d77] pt-2">
            <Calendar size={14} />
            <span>Dernière analyse effectuée le {formattedReportDate} chez {latestReport.labName}</span>
          </div>
          <p className="text-xs text-[#857d77]">
            {reports.length} analyses de sang importées, de {new Date(baselineReport.date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })} à {new Date(latestReport.date).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}.
          </p>
        </div>

        <div>
          <HealthScoreRadial
            score={latestReport.healthScore}
            classification={latestReport.scoreClass}
            baselineScore={reports.length > 1 ? baselineReport.healthScore : undefined}
            baselineDateText={new Date(baselineReport.date).toLocaleDateString("fr-FR", {
              month: "short",
              year: "numeric",
            })}
          />
        </div>
      </section>

      {/* 2. BASE-100 COMPARATIVE GRAPH */}
      {reports.length >= 2 && (
        <section>
          <Base100Chart trendsData={trends} />
        </section>
      )}

      {/* 3. BIOMARKERS GRID */}
      <section className="space-y-6">
        <div>
          <h2 className="serif-heading text-2xl font-bold text-[#2B2520]">
            Les marqueurs qui comptent
          </h2>
          <p className="text-xs text-[#857d77] mt-1">
            Valeurs de la dernière analyse, tendances et situation par rapport aux plages de référence.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestReport.biomarkers.map((bio: any) => {
            const bioTrend = trends[bio.name];
            const historyVals = bioTrend ? bioTrend.history.map((h: any) => h.rawValue) : [bio.rawValue];

            let changePct: number | undefined;
            if (bioTrend && bioTrend.history.length >= 2) {
              const hist = bioTrend.history;
              const curVal = hist[hist.length - 1].rawValue;
              const prevVal = hist[hist.length - 2].rawValue;
              changePct = prevVal > 0 ? Math.round(((curVal - prevVal) / prevVal) * 100) : undefined;
            }

            return (
              <BiomarkerCard
                key={bio.id}
                name={bio.name}
                category={bio.category}
                rawValue={bio.rawValue}
                rawUnit={bio.rawUnit}
                valG_L={bio.valG_L}
                valMmol_L={bio.valMmol_L}
                refMin={bio.refMin}
                refMax={bio.refMax}
                flag={bio.flag as any}
                explanation={bio.explanation}
                historyValues={historyVals}
                changePct={changePct}
              />
            );
          })}
        </div>
      </section>

      {/* 4. METABOLIC CORRELATIONS & DETECTIONS */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[#EAE6E1]">
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#b57c1e] uppercase mono-text">
              Détection automatique
            </span>
            <h2 className="serif-heading text-2xl font-bold text-[#2B2520] mt-1">
              Ce que l'analyse a repéré
            </h2>
            <p className="text-xs text-[#857d77] mt-1">
              Signaux tirés de vos bilans de santé croisés et traduits en clair.
            </p>
          </div>

          <div className="space-y-4">
            {correlations.length > 0 ? (
              correlations.map((corr, idx) => (
                <div
                  key={idx}
                  className="p-5 bg-white rounded-2xl border border-[#EAE6E1] space-y-2 hover-card-effect"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-[#2B2520] flex items-center gap-2">
                      <Brain size={16} className="text-[#b57c1e]" />
                      {corr.title}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        corr.status === "warning"
                          ? "bg-[#FFEBEE] text-[#b71c1c]"
                          : corr.status === "monitor"
                          ? "bg-[#FFF8E1] text-[#b57c1e]"
                          : "bg-[#E8F5E9] text-[#1b5e20]"
                      }`}
                    >
                      {corr.status === "warning"
                        ? "Vigilance"
                        : corr.status === "monitor"
                        ? "À surveiller"
                        : "Optimal"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#857d77]">{corr.description}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#857d77] italic">
                Aucun signal biologique croisé d'importance détecté sur ces biomarqueurs.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-[#b57c1e] uppercase mono-text">
              Conseils préventifs
            </span>
            <h2 className="serif-heading text-2xl font-bold text-[#2B2520] mt-1">
              Actions bien-être & style de vie
            </h2>
            <p className="text-xs text-[#857d77] mt-1">
              Directives non médicales et ajustements quotidiens recommandés.
            </p>
          </div>

          <div className="space-y-4">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-5 bg-white rounded-2xl border border-[#EAE6E1] space-y-2 hover-card-effect"
              >
                <div className="flex items-center gap-2">
                  <Activity size={16} className="text-[#b57c1e]" />
                  <h3 className="font-semibold text-sm text-[#2B2520]">{rec.title}</h3>
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-[#857d77] mono-text">
                    {rec.category}
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#857d77]">{rec.details}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
