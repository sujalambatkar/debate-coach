import type { Metadata } from "next";
import "./globals.css";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ToastProvider } from "@/components/ToastContext";

export const metadata: Metadata = {
  title: "Debate Coach — AI Argument Analyzer",
  description: "Dissect any argument. Win any debate. Powered by Gemini AI.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AnalysisProvider>
          <ToastProvider>{children}</ToastProvider>
        </AnalysisProvider>
      </body>
    </html>
  );
}
