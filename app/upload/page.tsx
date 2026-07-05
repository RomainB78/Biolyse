"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

export default function UploadPage() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processStep, setProcessStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [ocrDetected, setOcrDetected] = useState(false);

  const steps = [
    "Analyse de la structure du PDF & Détection OCR...",
    "Extraction des tables de biomarqueurs...",
    "Normalisation des unités et des synonymes...",
    "Calcul du score métabolique & Analyse préventive...",
  ];

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
        setError(null);
      } else {
        setError("Seuls les fichiers PDF sont acceptés pour le moment.");
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Seuls les fichiers PDF sont acceptés pour le moment.");
      }
    }
  };

  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);
    setProcessStep(0);

    // Simulate timeline step transitions for visual feedback
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
        setOcrDetected(!!data.ocrSimulated);
        setProcessStep(steps.length); // mark all done
        
        // Wait 1 second on success page before redirecting to dashboard
        setTimeout(() => {
          router.push("/?view=dashboard");
          router.refresh();
        }, 1200);
      } else {
        setError(data.error || "Une erreur est survenue lors de l'extraction des données.");
        setProcessing(false);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setError("Impossible d'envoyer le fichier. Vérifiez votre connexion.");
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 space-y-8">
      <div>
        <h1 className="serif-heading text-3xl font-bold text-[#2B2520]">Importer un bilan sanguin</h1>
        <p className="text-xs text-[#857d77] mt-1">
          Glissez-déposez le PDF fourni par votre laboratoire d'analyses (Biofutur, Cerballiance, Eurofins, etc.).
        </p>
      </div>

      {!processing ? (
        <div className="space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => document.getElementById("file-upload")?.click()}
            className={`flex flex-col items-center justify-center p-12 bg-white rounded-2xl border-2 border-dashed transition-colors cursor-pointer ${
              dragActive 
                ? "border-[#b57c1e] bg-[#FFF8E1]/10" 
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
            
            <div className="h-14 w-14 rounded-full bg-[#FBFAF8] border border-[#EAE6E1] flex items-center justify-center text-[#857d77] mb-4">
              <Upload size={24} />
            </div>

            {file ? (
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-[#2B2520]">{file.name}</p>
                <p className="text-[10px] text-[#857d77] mono-text">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm font-medium text-[#2B2520]">
                  Déposez votre bilan sanguin en PDF ici, ou{" "}
                  <span className="text-[#b57c1e] font-semibold hover:underline">
                    parcourez vos fichiers
                  </span>
                </p>
                <p className="text-[11px] text-[#857d77] mt-2">
                  Format PDF uniquement. Les images scannées seront traitées via OCR.
                </p>
              </div>
            )}
          </div>

          {error && (
            <div className="p-4 bg-[#FFEBEE] border border-red-100 rounded-xl text-xs text-[#b71c1c] flex items-start gap-2.5">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Erreur de traitement</p>
                <p className="mt-1 leading-relaxed">{error}</p>
              </div>
            </div>
          )}

          {file && (
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setFile(null)}
                className="inline-flex h-11 items-center justify-center rounded-full border border-[#EAE6E1] bg-white px-6 text-sm font-semibold text-[#2B2520] hover:bg-[#FBFAF8]"
              >
                Annuler
              </button>
              <button
                onClick={processFile}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[#2B2520] px-6 text-sm font-semibold text-[#FBFAF8] hover:bg-[#2B2520]/85 cursor-pointer"
              >
                Lancer l'analyse
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Processing Screen with Timeline Steps */
        <div className="bg-white rounded-2xl border border-[#EAE6E1] p-8 space-y-8 text-center">
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
            <p className="text-xs text-[#857d77]">
              {processStep < steps.length 
                ? "Nous traitons vos données biomédicales en direct." 
                : "Redirection vers votre tableau de bord..."}
            </p>
          </div>

          {/* Timeline steps */}
          <div className="max-w-md mx-auto text-left space-y-4 border-t border-[#FBFAF8] pt-6">
            {steps.map((stepText, idx) => {
              const isDone = processStep > idx;
              const isActive = processStep === idx;

              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isDone ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E8F5E9] text-[#1b5e20] text-xs font-bold">
                        ✓
                      </span>
                    ) : isActive ? (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#b57c1e] border-t-transparent animate-spin" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F0EDE9] text-[#857d77] text-xs mono-text">
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
  );
}
