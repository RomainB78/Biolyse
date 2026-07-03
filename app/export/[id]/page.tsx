"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer, Activity, ShieldAlert, Award, FileText } from "lucide-react";

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [reportsRes, profileRes] = await Promise.all([
          fetch("/api/reports"),
          fetch("/api/profile"),
        ]);
        if (reportsRes.ok && profileRes.ok) {
          const reports = await reportsRes.json();
          const foundReport = reports.find((r: any) => r.id === id);
          setReport(foundReport || null);
          setProfile(await profileRes.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#EAE6E1] rounded" />
        <div className="h-96 bg-[#EAE6E1] rounded-2xl" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
        <h2 className="serif-heading text-2xl font-bold text-[#2B2520]">Bilan introuvable</h2>
        <Link href="/" className="inline-flex h-9 items-center justify-center rounded-full bg-[#2B2520] px-4 text-xs font-semibold text-[#FBFAF8] mt-4">
          Retour au tableau de bord
        </Link>
      </div>
    );
  }

  const reportDateText = new Date(report.date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      {/* Top action header (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-[#EAE6E1]">
        <Link href="/history" className="inline-flex items-center gap-1 text-xs font-semibold text-[#857d77] hover:text-[#2B2520]">
          <ArrowLeft size={14} /> Retour à l'historique
        </Link>

        <button
          onClick={handlePrint}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2B2520] px-5 text-xs font-semibold text-[#FBFAF8] hover:bg-[#2B2520]/85 transition-colors cursor-pointer"
        >
          <Printer size={15} />
          Imprimer / Exporter en PDF
        </button>
      </div>

      {/* MEDICAL REPORT CONTAINER */}
      <div className="bg-white rounded-3xl border border-[#EAE6E1] p-10 md:p-14 space-y-12 print-card shadow-sm">
        
        {/* Cover / Header section */}
        <div className="flex flex-col md:flex-row justify-between items-start border-b border-[#EAE6E1] pb-8 gap-6">
          <div className="space-y-2">
            <h1 className="serif-heading text-3xl font-bold text-[#2B2520] tracking-tight">
              Biolyse Health Intelligence
            </h1>
            <p className="text-[10px] text-[#857d77] uppercase font-bold tracking-widest mono-text">
              Rapport de Synthèse Biologique & Métabolique
            </p>
          </div>
          
          <div className="text-left md:text-right space-y-1 text-xs text-[#857d77] mono-text">
            <div><strong className="text-[#2B2520]">Date d'analyse :</strong> {reportDateText}</div>
            <div><strong className="text-[#2B2520]">Laboratoire :</strong> {report.labName}</div>
            <div><strong className="text-[#2B2520]">ID Rapport :</strong> {report.id.slice(0, 8)}...</div>
          </div>
        </div>

        {/* Patient Profile & Health Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 border-b border-[#FBFAF8] pb-8">
          <div className="md:col-span-2 space-y-4">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b57c1e] mono-text">
              Informations Cliniques
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><strong className="text-[#857d77]">Sexe :</strong> {profile?.sex === "M" ? "Masculin (M)" : "Féminin (F)"}</div>
              <div><strong className="text-[#857d77]">Âge :</strong> {profile?.age} ans</div>
              <div><strong className="text-[#857d77]">Taille :</strong> {profile?.height} cm</div>
              <div><strong className="text-[#857d77]">Poids :</strong> {profile?.weight} kg</div>
            </div>
            {profile?.medicalHistory && (
              <div className="mt-2 text-xs">
                <strong className="text-[#857d77]">Antécédents déclarés :</strong>
                <p className="text-[#2B2520] mt-1 italic">{profile.medicalHistory}</p>
              </div>
            )}
          </div>

          {/* Health score box */}
          <div className="bg-[#FBFAF8] border border-[#EAE6E1] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-bold tracking-wider text-[#857d77] uppercase mono-text">
              Score Métabolique
            </span>
            <div className="mono-text text-4xl font-extrabold text-[#2B2520] mt-2">
              {report.healthScore} <span className="text-xs text-[#857d77] font-medium">/100</span>
            </div>
            <span className="text-xs text-[#2B2520] font-semibold mt-1">
              Classe : {report.scoreClass}
            </span>
          </div>
        </div>

        {/* Narrative Synthesis */}
        <div className="space-y-3">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b57c1e] mono-text">
            Synthèse de l'Analyse
          </h3>
          <div className="p-6 bg-[#FBFAF8] border border-[#EAE6E1] rounded-2xl">
            <p className="serif-heading text-lg font-bold text-[#2B2520] leading-relaxed">
              {report.insightSummary}
            </p>
          </div>
        </div>

        {/* Biomarkers Table */}
        <div className="space-y-4">
          <h3 className="font-semibold text-xs uppercase tracking-wider text-[#b57c1e] mono-text">
            Marqueurs Biologiques Analysés
          </h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs text-left text-[#2B2520] divide-y divide-[#EAE6E1] border border-[#EAE6E1] rounded-xl overflow-hidden">
              <thead className="bg-[#FBFAF8] text-[#857d77] uppercase font-semibold">
                <tr>
                  <th className="px-4 py-3">Biomarqueur</th>
                  <th className="px-4 py-3">Catégorie</th>
                  <th className="px-4 py-3 text-right">Valeur</th>
                  <th className="px-4 py-3">Normes Laboratoire</th>
                  <th className="px-4 py-3">État</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FBFAF8]">
                {report.biomarkers.map((bio: any) => {
                  let badgeColor = "text-green-800 bg-[#E8F5E9]";
                  let statusLabel = "Optimal";
                  if (bio.flag === "yellow") {
                    badgeColor = "text-[#b57c1e] bg-[#FFF8E1]";
                    statusLabel = "À surveiller";
                  } else if (bio.flag === "orange") {
                    badgeColor = "text-[#b71c1c] bg-[#FFEBEE]";
                    statusLabel = "Hors plage";
                  } else if (bio.flag === "red") {
                    badgeColor = "text-red-900 bg-red-100 font-bold";
                    statusLabel = "Critique";
                  }

                  return (
                    <tr key={bio.id} className="hover:bg-[#FBFAF8]/40">
                      <td className="px-4 py-3.5 font-semibold text-[#2B2520]">{bio.name}</td>
                      <td className="px-4 py-3.5 capitalize text-[#857d77]">{bio.category}</td>
                      <td className="px-4 py-3.5 text-right font-semibold mono-text">{bio.rawValue} {bio.rawUnit}</td>
                      <td className="px-4 py-3.5 text-[#857d77] mono-text">
                        {bio.refMin !== null && bio.refMax !== null 
                          ? `${bio.refMin} - ${bio.refMax}` 
                          : bio.refMax !== null 
                          ? `< ${bio.refMax}` 
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${badgeColor}`}>
                          {statusLabel}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* General Disclaimer */}
        <section className="bg-red-50/50 rounded-2xl border border-red-100 p-6 space-y-3 pt-6">
          <h4 className="font-semibold text-xs text-[#b71c1c] flex items-center gap-2 uppercase tracking-wider">
            <ShieldAlert size={16} /> Avertissement Médical Légal
          </h4>
          <p className="text-[10px] leading-relaxed text-red-950">
            Ce document constitue une synthèse de données biologiques générée de manière automatisée à titre d'information préventive et d'éducation sur l'hygiène de vie. Il ne s'agit aucunement d'un bilan d'évaluation clinique officiel. Il n'autorise pas la modification de dosages médicaux et ne dispense pas d'un examen médical clinique régulier avec votre médecin généraliste ou spécialiste.
          </p>
        </section>

        {/* Signature placeholders */}
        <div className="pt-8 flex justify-between text-xs text-[#857d77] border-t border-[#EAE6E1]">
          <div>Document généré par le moteur d'analyse Biolyse AI</div>
          <div className="text-right">Édition imprimable du {new Date().toLocaleDateString("fr-FR")}</div>
        </div>

      </div>

    </div>
  );
}
