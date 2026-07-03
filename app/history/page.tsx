"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Trash2, ChevronRight, Award, Plus, FileText } from "lucide-react";

export default function HistoryPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);

  const loadReports = async () => {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDelete = async (id: string, dateText: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer le bilan du ${dateText} ? Cette action est irréversible.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/reports?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setReports(reports.filter((r) => r.id !== id));
      } else {
        alert("Impossible de supprimer le bilan.");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression.");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-[#EAE6E1] rounded" />
        <div className="h-64 bg-[#EAE6E1] rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="serif-heading text-3xl font-bold text-[#2B2520]">Historique des bilans</h1>
          <p className="text-xs text-[#857d77] mt-1">
            Gérez et comparez vos analyses sanguines importées dans l'application.
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#2B2520] px-4 text-xs font-semibold text-[#FBFAF8] transition-all hover:bg-[#2B2520]/85 cursor-pointer"
        >
          <Plus size={14} /> Importer un bilan
        </Link>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#EAE6E1] p-8">
          <FileText size={48} className="mx-auto text-[#857d77] mb-4" />
          <h3 className="serif-heading text-xl font-bold text-[#2B2520]">Aucun bilan enregistré</h3>
          <p className="text-xs text-[#857d77] max-w-sm mx-auto mt-2 leading-relaxed">
            Commencez par charger votre premier rapport biologique en format PDF pour démarrer le suivi longitudinal de vos biomarqueurs.
          </p>
          <Link
            href="/upload"
            className="inline-flex h-10 items-center justify-center rounded-full bg-[#2B2520] px-5 text-xs font-semibold text-[#FBFAF8] mt-6 hover:bg-[#2B2520]/85"
          >
            Importer un bilan
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => {
            const reportDate = new Date(report.date);
            const dateStr = reportDate.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            
            // Score badges
            let scoreBadgeStyle = "bg-[#E8F5E9] text-[#1b5e20]";
            if (report.scoreClass === "Moderate") scoreBadgeStyle = "bg-[#FFF8E1] text-[#b57c1e]";
            if (report.scoreClass === "At risk") scoreBadgeStyle = "bg-[#FFEBEE] text-[#b71c1c]";

            return (
              <div
                key={report.id}
                className="bg-white rounded-2xl border border-[#EAE6E1] p-6 hover-card-effect flex flex-col md:flex-row justify-between items-start md:items-stretch gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs text-[#857d77] mono-text">
                      <Calendar size={14} />
                      {dateStr}
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-[#FBFAF8] border border-[#EAE6E1] font-medium text-[#2B2520]">
                      {report.labName}
                    </span>
                  </div>
                  
                  <h3 className="serif-heading text-lg font-bold text-[#2B2520] leading-snug">
                    {report.insightSummary}
                  </h3>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {report.biomarkers.map((b: any) => (
                      <span
                        key={b.id}
                        className={`inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-medium ${
                          b.flag === "green" || b.flag === "blue"
                            ? "bg-[#E8F5E9] text-[#1b5e20]"
                            : b.flag === "yellow"
                            ? "bg-[#FFF8E1] text-[#b57c1e]"
                            : "bg-[#FFEBEE] text-[#b71c1c]"
                        }`}
                      >
                        {b.name} : {b.rawValue} {b.rawUnit}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex md:flex-col justify-between items-center md:items-end gap-4 min-w-[140px] border-t md:border-t-0 md:border-l border-[#FBFAF8] pt-4 md:pt-0 md:pl-6 shrink-0 w-full md:w-auto">
                  <div className="text-left md:text-right">
                    <div className="flex items-center gap-2 md:justify-end">
                      <span className="text-xs uppercase tracking-wider text-[#857d77] font-semibold">
                        Score
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${scoreBadgeStyle}`}>
                        {report.scoreClass}
                      </span>
                    </div>
                    <div className="mono-text text-3xl font-bold text-[#2B2520] mt-1">
                      {report.healthScore} <span className="text-xs text-[#857d77]">/ 100</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(report.id, dateStr)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 border border-red-100 hover:bg-[#FFEBEE] transition-colors cursor-pointer"
                      title="Supprimer ce bilan"
                    >
                      <Trash2 size={15} />
                    </button>
                    
                    {/* Visual spacer / action */}
                    <Link
                      href={`/export/${report.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-full border border-[#EAE6E1] bg-white px-4 text-xs font-semibold text-[#2B2520] hover:bg-[#FBFAF8] transition-colors"
                    >
                      Exporter PDF
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
