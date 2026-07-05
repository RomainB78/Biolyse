import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: "Biolyse AI",
  description:
    "Décodez vos analyses de sang avec notre intelligence métabolique. Visualisez vos tendances de santé sur le long terme et obtenez des explications claires et personnalisées.",
};

export default function RootLayout({
  children,
  modal, // supporting parallel routes if needed, otherwise just standard children
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full scroll-smooth">
      <body className="min-h-full flex flex-col bg-[#FBFAF8] text-[#2B2520] font-sans antialiased selection:bg-[#EAE6E1]">
        {/* Navigation Bar */}
        <header className="no-print sticky top-0 z-50 w-full border-b border-[#EAE6E1] bg-[#FBFAF8]/80 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <span className="serif-heading text-xl font-bold tracking-tight">Biolyse<span className="text-[#b57c1e]">.</span></span>
                <span className="rounded bg-[#EAE6E1] px-2 py-0.5 mono-text text-[10px] uppercase tracking-wider text-[#857d77]">
                  AI Engine
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                <Link href="/?view=dashboard" className="transition-colors hover:text-[#b57c1e]">
                  Tableau de bord
                </Link>
                <Link href="/history" className="transition-colors hover:text-[#b57c1e]">
                  Historique
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Button removed as requested */}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
        
        {modal}

        {/* Footer */}
        <footer className="no-print border-t border-[#EAE6E1] bg-[#FBFAF8] py-8 text-center text-xs text-[#857d77]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Biolyse AI. Développé en conformité avec le RGPD.</p>
            <p className="max-w-md sm:text-right text-[10px] leading-relaxed">
              <strong>Avertissement :</strong> Les analyses et conseils fournis sont informatifs et éducatifs. Ils ne constituent pas un avis médical ni un diagnostic, et ne remplacent pas la consultation d'un médecin.
            </p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
