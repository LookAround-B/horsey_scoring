"use client";

import { useState } from "react";
import { Eye, X, ChevronDown } from "lucide-react";
import type { TestCard } from "@/lib/dummy-data";

export function SheetsField({ sheets }: { sheets: TestCard[] }) {
  const [preview, setPreview] = useState<TestCard | null>(null);

  return (
    <>
      <details className="sm:col-span-2 group border border-border rounded-lg">
        <summary className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none list-none text-sm">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
          Scoring sheets <span className="text-muted-foreground">(optional — you can also add them later)</span>
        </summary>
        <div className="border-t border-border p-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 max-h-64 overflow-y-auto">
          {sheets.map((t, idx) => (
            <div key={t.slug} className="flex items-center gap-2 text-sm py-0.5 animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
              <label className="flex items-center gap-2 cursor-pointer flex-1 hover:opacity-80 transition-opacity">
                <input type="checkbox" name="slug" value={t.slug} className="h-4 w-4 rounded border-border accent-primary cursor-pointer" />
                <span className="truncate">{t.category}</span>
              </label>
              <button
                type="button"
                onClick={() => setPreview(t)}
                className="p-1 text-muted-foreground hover:text-foreground hover:scale-110 transition-all duration-200"
                title="Preview sheet"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </details>

      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-background rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slide-in-up">
            <div className="sticky top-0 bg-background border-b border-border p-4 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg tracking-tight">{preview.category}</h2>
                <p className="text-xs text-muted-foreground mt-1">{preview.description}</p>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Max Score</label>
                  <div className="text-sm font-medium">{preview.maxScore}</div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Discipline</label>
                  <div className="text-sm font-medium capitalize">{preview.discipline}</div>
                </div>
              </div>

              {preview.appendix && (
                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Appendix</label>
                  <div className="text-sm">{preview.appendix}</div>
                </div>
              )}

              <div className="bg-muted/50 rounded-lg p-4 text-xs space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{preview.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Max Score:</span>
                  <span className="font-medium">{preview.maxScore}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Discipline:</span>
                  <span className="font-medium capitalize">{preview.discipline}</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">{preview.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
