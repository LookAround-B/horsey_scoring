"use client";

import { useState } from "react";
import { Eye, ChevronDown } from "lucide-react";
import type { TestCard } from "@/lib/dummy-data";
import { TEST_CONFIGS } from "@/lib/tests";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function SheetsField({ sheets }: { sheets: TestCard[] }) {
  const [preview, setPreview] = useState<TestCard | null>(null);
  const config = preview ? TEST_CONFIGS[preview.slug] : null;

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
                <Checkbox name="slug" value={t.slug} className="cursor-pointer" />
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

      <Dialog open={preview !== null} onOpenChange={(open) => { if (!open) setPreview(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-0 p-0">
          {preview && (
            <>
            {/* Modal header */}
            <div className="sticky top-0 bg-background border-b border-border px-5 py-4 flex items-start justify-between gap-4 rounded-t-xl">
              <div className="min-w-0">
                <h2 className="font-display text-xl tracking-tight">{preview.category}</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {config?.subtitle ?? preview.description}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs">
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Appendix:</span> {preview.appendix}
                  </span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground">Max score:</span> {preview.maxScore}
                  </span>
                  {preview.discipline && (
                    <span className="text-muted-foreground capitalize">
                      <span className="font-medium text-foreground">Discipline:</span> {preview.discipline}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {config ? (
                <>
                  {/* Movements table */}
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2 pr-3 w-8">No.</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2 pr-3 w-16">Letters</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2 pr-3">Movement</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2 pr-3 w-12">Coeff</th>
                        <th className="text-left text-[10px] uppercase tracking-wider text-muted-foreground py-2 w-48 hidden sm:table-cell">Directive</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {config.movements.map((m) => (
                        <tr
                          key={m.no}
                          className={m.coefficient > 1 ? "bg-primary/5" : ""}
                        >
                          <td className="py-2 pr-3 align-top text-muted-foreground font-mono text-xs">
                            {m.no}
                          </td>
                          <td className="py-2 pr-3 align-top font-mono text-xs whitespace-pre-line">
                            {m.letters}
                          </td>
                          <td className="py-2 pr-3 align-top whitespace-pre-line leading-relaxed">
                            {m.test}
                          </td>
                          <td className="py-2 pr-3 align-top">
                            {m.coefficient > 1 ? (
                              <span className="inline-block bg-primary/20 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                ×{m.coefficient}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">×1</span>
                            )}
                          </td>
                          <td className="py-2 align-top text-xs text-muted-foreground leading-relaxed hidden sm:table-cell">
                            {m.directive}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Collectives */}
                  {config.collectives && config.collectives.length > 0 && (
                    <div className="mt-5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Collective marks</div>
                      <table className="w-full text-sm border-collapse">
                        <tbody className="divide-y divide-border/50">
                          {config.collectives.map((c) => (
                            <tr key={c.no}>
                              <td className="py-1.5 pr-3 text-muted-foreground font-mono text-xs w-8">{c.no}</td>
                              <td className="py-1.5 pr-3">{c.label}</td>
                              <td className="py-1.5 text-xs">
                                {c.coefficient > 1 ? (
                                  <span className="inline-block bg-primary/20 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded">×{c.coefficient}</span>
                                ) : (
                                  <span className="text-muted-foreground">×1</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Artistic movements (freestyle tests) */}
                  {config.artisticMovements && config.artisticMovements.length > 0 && (
                    <div className="mt-5">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Artistic marks</div>
                      <table className="w-full text-sm border-collapse">
                        <tbody className="divide-y divide-border/50">
                          {config.artisticMovements.map((m) => (
                            <tr key={m.no} className={m.coefficient > 1 ? "bg-primary/5" : ""}>
                              <td className="py-2 pr-3 align-top text-muted-foreground font-mono text-xs w-8">{m.no}</td>
                              <td className="py-2 pr-3 align-top font-mono text-xs whitespace-pre-line w-16">{m.letters}</td>
                              <td className="py-2 pr-3 align-top whitespace-pre-line leading-relaxed">{m.test}</td>
                              <td className="py-2 align-top text-xs">
                                {m.coefficient > 1 ? (
                                  <span className="inline-block bg-primary/20 text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded">×{m.coefficient}</span>
                                ) : (
                                  <span className="text-muted-foreground">×1</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : (
                /* Custom sheet or unknown — show summary */
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Max Score</div>
                      <div className="font-medium">{preview.maxScore}</div>
                    </div>
                    {preview.discipline && (
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Discipline</div>
                        <div className="font-medium capitalize">{preview.discipline}</div>
                      </div>
                    )}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Appendix</div>
                      <div className="font-medium">{preview.appendix}</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground italic">{preview.description}</p>
                  <p className="text-xs text-muted-foreground border border-dashed border-border rounded-lg px-3 py-2">
                    Full movement details are available in the scoring page for this sheet.
                  </p>
                </div>
              )}
            </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
