import { useState } from 'react';
import { explainRoute } from '../api';
import { toast } from './Toast';

export default function AiExplainPanel({ route, query, onClose }) {
  const [explanation, setExplanation] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleExplain() {
    if (!route) return;
    setLoading(true);
    try {
      const context = JSON.stringify(route);
      const result = await explainRoute(query || 'Explain this route', context);
      setExplanation(result);
    } catch (err) {
      toast(err.message || 'AI explanation failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-800">🤖 AI Route Explanation</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!explanation && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-500 mb-4">
                Get an AI-powered explanation of this route
              </p>
              <button
                type="button"
                onClick={handleExplain}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md"
              >
                Explain Route
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="animate-pulse text-sm text-slate-400">Generating explanation...</div>
            </div>
          )}

          {explanation && (
            <div className="space-y-3">
              {explanation.summary_bn && (
                <div className="bg-slate-50 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-slate-600 mb-1">Summary</h4>
                  <p className="text-sm text-slate-800">{explanation.summary_bn}</p>
                </div>
              )}
              {explanation.why_this_route_bn && (
                <div className="bg-emerald-50 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-emerald-700 mb-1">Why This Route</h4>
                  <p className="text-sm text-slate-800">{explanation.why_this_route_bn}</p>
                </div>
              )}
              {explanation.fare_note_bn && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-blue-700 mb-1">Fare Note</h4>
                  <p className="text-sm text-slate-800">{explanation.fare_note_bn}</p>
                </div>
              )}
              {explanation.confidence_note_bn && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-amber-700 mb-1">Confidence</h4>
                  <p className="text-sm text-slate-800">{explanation.confidence_note_bn}</p>
                </div>
              )}
              {Array.isArray(explanation.risks_bn) && explanation.risks_bn.length > 0 && (
                <div className="bg-red-50 rounded-xl p-3">
                  <h4 className="text-xs font-bold text-red-700 mb-1">Risks</h4>
                  <ul className="text-sm text-slate-800 list-disc pl-4">
                    {explanation.risks_bn.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
