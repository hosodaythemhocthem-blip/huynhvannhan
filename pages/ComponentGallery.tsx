import React, { useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Badge } from "../components/Badge";
import { SkeletonCard } from "../components/Skeleton";
import { SmartMathInput } from "../components/SmartMathInput";
import { MathKeyboard } from "../components/MathKeyboard";
import { FunctionGrapher } from "../components/FunctionGrapher";
import { useToast } from "../components/Toast";

import {
  Mic,
  Volume2,
} from "lucide-react";

const ComponentGallery: React.FC = () => {
  const { showToast } = useToast();

  const [smartValue, setSmartValue] = useState<string>(
    "Cho hàm số $f(x) = x^2 + 2x + 1$, tính đạo hàm $f'(1)$."
  );

  return (
    <div className="space-y-16 max-w-6xl mx-auto pb-40 animate-in fade-in duration-700">
      {/* ================= HEADER ================= */}
      <header className="space-y-4">
        <h2 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase">
          Component Laboratory
        </h2>
        <p className="text-slate-500 max-w-2xl font-medium">
          A collection of advanced UI/UX components optimized for high-performance LMS interactions.
        </p>
      </header>

      {/* ================= VISUAL ANALYTICS ================= */}
      <section className="space-y-6">
        <h3 className="section-label">Visual Analytics</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <FunctionGrapher equation="Math.sin(x)" range={[-6, 6]} />
          <FunctionGrapher equation="Math.pow(x, 2) / 10" range={[-5, 5]} />
        </div>
      </section>

      {/* ================= FEEDBACK & LOADING ================= */}
      <section className="space-y-6">
        <h3 className="section-label">Feedback & Loading</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card title="Notification System" subtitle="Global toast triggers">
            <div className="flex flex-wrap gap-3">
              <Button
                size="sm"
                onClick={() => showToast("Success notification!", "success")}
              >
                Success
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => showToast("Something went wrong", "error")}
              >
                Error
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => showToast("New update available", "info")}
              >
                Info
              </Button>
            </div>
          </Card>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Skeleton Loaders
            </p>
            <SkeletonCard />
          </div>
        </div>
      </section>

      {/* ================= SMART INPUT ================= */}
      <section className="space-y-6">
        <h3 className="section-label">Interactive Inputs</h3>

        <Card
          title="Smart Math Editor"
          subtitle="LaTeX-aware input with real-time preview"
        >
          <SmartMathInput
            value={smartValue}
            onChange={setSmartValue}
            label="Nội dung câu hỏi"
          />
        </Card>
      </section>

      {/* ================= MATH KEYBOARD ================= */}
      <section className="space-y-6">
        <h3 className="section-label">Math Keyboards</h3>
        <div className="max-w-md">
          <MathKeyboard
            onSymbolClick={(symbol: string) =>
              showToast(`Inserted: ${symbol}`, "info")
            }
          />
        </div>
      </section>

      {/* ================= VOICE ENGINE ================= */}
      <section className="space-y-6">
        <h3 className="section-label">Live Voice Engine</h3>

        <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden group">
          <Mic className="absolute -right-6 -bottom-6 text-white/5 w-48 h-48 group-hover:scale-110 transition-transform duration-700" />

          <div className="relative z-10 space-y-4 max-w-lg">
            <Badge
              variant="info"
              className="bg-indigo-600 border-none text-white"
            >
              Voice Lab Beta
            </Badge>

            <h4 className="text-2xl font-black italic">
              Gemini Live Integration
            </h4>

            <p className="text-indigo-100/60 text-sm leading-relaxed">
              Experience real-time, human-like voice conversations about complex
              mathematics. Powered by Gemini 2.5 Flash Native Audio.
            </p>

            <div className="flex items-center gap-6 pt-4">
              <div className="flex items-center gap-2">
                <Volume2 size={16} className="text-indigo-400" />
                <span className="meta-chip">PCM 24kHz Out</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-indigo-400" />
                <span className="meta-chip">16kHz Audio In</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= BASE COMPONENTS ================= */}
      <section className="space-y-6">
        <h3 className="section-label">Base Atoms</h3>

        <Card className="p-8">
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>

            <Badge variant="success">Passed</Badge>
            <Badge variant="error">High Risk</Badge>
          </div>
        </Card>
      </section>
    </div>
  );
};

export default ComponentGallery;

/* =========================
   SMALL UTILITY CLASSES
========================= */
/*
.section-label {
  @apply text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] border-b border-indigo-100 pb-2;
}
.meta-chip {
  @apply text-[10px] font-black uppercase tracking-widest;
}
*/
