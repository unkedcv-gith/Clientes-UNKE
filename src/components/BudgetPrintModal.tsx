import React from 'react';
import { Budget } from '../types';
import { formatARS, formatDateAR } from '../utils/currency';
import { generateBudgetPDF } from '../utils/pdfGenerator';
import { FormattedClarificationText } from './FormattedClarificationEditor';
import { UnkeLogo } from './UnkeLogo';
import { Download, Printer, X, CheckCircle2 } from 'lucide-react';

interface BudgetPrintModalProps {
  budget: Budget | null;
  onClose: () => void;
  onConvertToProject?: (budgetId: string) => void;
}

export const BudgetPrintModal: React.FC<BudgetPrintModalProps> = ({
  budget,
  onClose,
  onConvertToProject,
}) => {
  if (!budget) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateBudgetPDF(budget);
  };

  const discountAmount = budget.discountPercentage
    ? (budget.subtotal * budget.discountPercentage) / 100
    : 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4">
        {/* Modal Action Bar (No Print) */}
        <div className="no-print p-4 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-slate-800 dark:text-white">
              Vista Previa • Presupuesto {budget.number}
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                budget.status === 'aprobado'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : budget.status === 'enviado'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}
            >
              {budget.status.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onConvertToProject && budget.status !== 'aprobado' && !budget.convertedToProjectId && (
              <button
                onClick={() => {
                  onConvertToProject(budget.id);
                  onClose();
                }}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Aprobar & Crear Proyecto</span>
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#34877c] hover:bg-[#276961] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Container */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-slate-50 dark:bg-slate-950 flex justify-center">
          <div
            id="printable-budget-container"
            className="w-full max-w-3xl bg-white text-slate-900 shadow-lg rounded-xl p-8 sm:p-12 border border-slate-200 space-y-8 print:border-none print:shadow-none print:p-0"
          >
            {/* Top Teal Accent */}
            <div className="h-2 bg-[#34877c] rounded-full -mt-4 mb-6" />

            {/* Header: UNKE Wordmark & Budget Info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-200">
              <div>
                <UnkeLogo className="h-9 w-auto text-slate-900 mb-1" />
                <p className="text-xs font-medium uppercase tracking-widest text-[#777777] mt-0.5">
                  Estudio de Diseño & Comunicación
                </p>
                <div className="text-xs text-slate-500 mt-2 space-y-0.5">
                  <p>unkedcv@gmail.com</p>
                  <p>Buenos Aires / Mendoza • Argentina</p>
                </div>
              </div>

              <div className="text-left sm:text-right space-y-1">
                <div className="text-sm font-bold text-slate-900 uppercase">
                  Presupuesto Nº {budget.number}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">Fecha de emisión:</span> {formatDateAR(budget.date)}
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-semibold">Válido hasta:</span> {formatDateAR(budget.validUntilDate)}
                </div>
                <div className="text-xs inline-block bg-teal-50 text-[#34877c] font-bold px-2 py-0.5 rounded border border-teal-200 mt-1">
                  {budget.projectType === 'mantenimiento' ? 'ABONO MENSUAL' : 'PROYECTO PUNTUAL'}
                </div>
              </div>
            </div>

            {/* Client Info Box */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#34877c]">
                  Cliente destinatario
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  {budget.clientName}
                </h2>
                {budget.clientContact && (
                  <p className="text-xs text-slate-600 mt-0.5">{budget.clientContact}</p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Proyecto / Propuesta
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                  {budget.title}
                </h3>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#34877c] text-white">
                    <th className="py-2.5 px-3 font-bold rounded-l-lg">DESCRIPCIÓN / ALCANCE</th>
                    <th className="py-2.5 px-3 font-bold text-center w-16">CANT.</th>
                    <th className="py-2.5 px-3 font-bold text-right w-28">P. UNITARIO</th>
                    <th className="py-2.5 px-3 font-bold text-right rounded-r-lg w-32">TOTAL (ARS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {budget.items.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600">
                        {item.quantity || 1}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {formatARS(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        {formatARS(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Summary */}
              <div className="flex justify-end mt-4">
                <div className="w-64 space-y-2 text-xs">
                  {budget.discountPercentage && budget.discountPercentage > 0 && (
                    <>
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span>{formatARS(budget.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Descuento ({budget.discountPercentage}%):</span>
                        <span>- {formatARS(discountAmount)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between items-center bg-[#f0f7f6] p-3 rounded-lg border border-[#34877c]/30 text-slate-900 font-bold">
                    <span className="text-[#34877c] font-black text-sm">
                      {budget.projectType === 'mantenimiento' ? 'TOTAL MENSUAL:' : 'TOTAL FINAL:'}
                    </span>
                    <span className="text-base text-slate-900 font-black">
                      {formatARS(budget.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deliverables Clarification / Scope Details */}
              {budget.deliverablesClarification && (
                <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <div className="font-bold text-[#34877c] uppercase text-[10px] tracking-wider mb-2">
                    Aclaraciones & Alcance de los Entregables
                  </div>
                  <FormattedClarificationText text={budget.deliverablesClarification} />
                </div>
              )}
            </div>

            {/* Bank Details */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2">
              <div className="font-bold text-[#34877c] uppercase tracking-wider text-[11px]">
                Datos para Transferencia Bancaria
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div>
                  <p><span className="font-semibold">Banco:</span> {budget.bankDetails.bank}</p>
                  <p><span className="font-semibold">Titular:</span> {budget.bankDetails.accountHolder}</p>
                  <p><span className="font-semibold">CUIT:</span> {budget.bankDetails.cuit}</p>
                </div>
                <div>
                  <p><span className="font-semibold">CBU:</span> <span className="font-mono">{budget.bankDetails.cbu}</span></p>
                  <p><span className="font-semibold">Alias:</span> <span className="font-bold text-[#34877c]">{budget.bankDetails.alias}</span></p>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            {budget.notesAndTerms && (
              <div className="text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800 uppercase text-[10px] tracking-wider">
                  Condiciones Comerciales & Alcance
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-slate-600">
                  {budget.notesAndTerms}
                </p>
              </div>
            )}

            {/* Signature / Footer */}
            <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400">
              <div>UNKE • Estudio de Diseño & Comunicación</div>
              <div>Valores expresados en Pesos Argentinos ($ ARS)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
