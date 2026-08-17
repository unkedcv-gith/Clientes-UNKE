import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { Budget, BudgetItem, BudgetStatus, ProjectType } from '../types';
import { formatARS, formatDateAR, generateId, parseARS } from '../utils/currency';
import { generateBudgetPDF } from '../utils/pdfGenerator';
import { BudgetPrintModal } from './BudgetPrintModal';
import {
  FormattedClarificationEditor,
  FormattedClarificationText,
} from './FormattedClarificationEditor';
import {
  FileText,
  Plus,
  Search,
  Download,
  Printer,
  Copy,
  Trash2,
  Edit2,
  CheckCircle2,
  Repeat,
  Layers,
  Sparkles,
  X,
  PlusCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BudgetsViewProps {
  onOpenNewBudget?: boolean;
}

export const BudgetsView: React.FC<BudgetsViewProps> = () => {
  const {
    budgets,
    clients,
    addClient,
    currentUser,
    studioBank,
    addBudget,
    updateBudget,
    deleteBudget,
    duplicateBudget,
    convertBudgetToProject,
    startEditingItem,
    stopEditingItem,
    otherEditorWarning,
  } = useStudio();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BudgetStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ProjectType>('all');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [previewBudget, setPreviewBudget] = useState<Budget | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formNewClientName, setFormNewClientName] = useState('');
  const [formClientContact, setFormClientContact] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formValidUntilDate, setFormValidUntilDate] = useState('');
  const [formProjectType, setFormProjectType] = useState<ProjectType>('proyecto');
  const [formStatus, setFormStatus] = useState<BudgetStatus>('enviado');
  const [formDiscount, setFormDiscount] = useState<number>(0);
  const [formDeliverablesClarification, setFormDeliverablesClarification] = useState('');
  const [formNotes, setFormNotes] = useState(
    'Forma de pago: 50% anticipo al confirmar y 50% contra entrega final de archivos originales. Validez del presupuesto: 15 días.'
  );

  const [formItems, setFormItems] = useState<BudgetItem[]>([
    {
      id: generateId('bi'),
      description: 'Diseño de Identidad Visual & Manual Normativo',
      quantity: 1,
      unitPrice: 850000,
      total: 850000,
    },
  ]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setFormTitle('');
    setFormClientId(clients[0]?.id || 'new');
    setFormNewClientName('');
    setFormClientContact(clients[0]?.email || '');
    setFormDate(new Date().toISOString().split('T')[0]);

    const validDate = new Date();
    validDate.setDate(validDate.getDate() + 20);
    setFormValidUntilDate(validDate.toISOString().split('T')[0]);

    setFormProjectType('proyecto');
    setFormStatus('enviado');
    setFormDiscount(0);
    setFormDeliverablesClarification('');
    setFormNotes(
      'Forma de pago: 50% anticipo al iniciar y 50% contra entrega de archivos finales. Incluye 2 rondas de ajustes.'
    );
    setFormItems([
      {
        id: generateId('bi'),
        description: 'Propuesta de diseño y desarrollo conceptual',
        quantity: 1,
        unitPrice: 750000,
        total: 750000,
      },
    ]);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (budget: Budget) => {
    setEditingBudget(budget);
    startEditingItem(budget.id, budget.title);
    setFormTitle(budget.title);
    setFormClientId(budget.clientId);
    setFormNewClientName('');
    setFormClientContact(budget.clientContact || '');
    setFormDate(budget.date);
    setFormValidUntilDate(budget.validUntilDate);
    setFormProjectType(budget.projectType);
    setFormStatus(budget.status);
    setFormDiscount(budget.discountPercentage || 0);
    setFormDeliverablesClarification(budget.deliverablesClarification || '');
    setFormNotes(budget.notesAndTerms);
    setFormItems(budget.items);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingBudget(null);
    stopEditingItem();
  };

  // Line item helpers
  const handleAddItem = () => {
    setFormItems(prev => [
      ...prev,
      {
        id: generateId('bi'),
        description: '',
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (formItems.length === 1) return;
    setFormItems(prev => prev.filter(item => item.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: 'description' | 'quantity' | 'unitPrice',
    val: string | number
  ) => {
    setFormItems(prev =>
      prev.map(item => {
        if (item.id !== id) return item;
        const next = { ...item, [field]: val };
        const qty = Number(field === 'quantity' ? val : item.quantity) || 1;
        const price = field === 'unitPrice' ? parseARS(val) : item.unitPrice;
        next.unitPrice = price;
        next.total = qty * price;
        return next;
      })
    );
  };

  // Calculations
  const calculatedSubtotal = formItems.reduce((acc, item) => acc + (item.total || 0), 0);
  const calculatedDiscountAmount = (calculatedSubtotal * (Number(formDiscount) || 0)) / 100;
  const calculatedTotal = Math.max(0, calculatedSubtotal - calculatedDiscountAmount);

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    let effectiveClientId = formClientId;
    let effectiveClientName = '';

    if (formClientId === 'new' || (!formClientId && formNewClientName.trim())) {
      const createdClient = addClient({
        name: formNewClientName.trim() || 'Nuevo Cliente',
        company: '',
        email: formClientContact.trim() || '',
        phone: '',
        notes: 'Creado desde presupuesto comercial',
        status: 'activo',
        hasWeb: false,
      });
      effectiveClientId = createdClient.id;
      effectiveClientName = createdClient.name;
    } else {
      const client = clients.find(c => c.id === formClientId);
      effectiveClientName = client ? client.name : formNewClientName.trim() || 'Cliente';
    }

    if (editingBudget) {
      updateBudget(editingBudget.id, {
        title: formTitle,
        clientId: effectiveClientId,
        clientName: effectiveClientName,
        clientContact: formClientContact,
        date: formDate,
        validUntilDate: formValidUntilDate,
        projectType: formProjectType,
        items: formItems,
        deliverablesClarification: formDeliverablesClarification,
        subtotal: calculatedSubtotal,
        discountPercentage: Number(formDiscount),
        totalAmount: calculatedTotal,
        notesAndTerms: formNotes,
        status: formStatus,
      });
    } else {
      addBudget({
        title: formTitle,
        clientId: effectiveClientId,
        clientName: effectiveClientName,
        clientContact: formClientContact,
        date: formDate,
        validUntilDate: formValidUntilDate,
        projectType: formProjectType,
        items: formItems,
        deliverablesClarification: formDeliverablesClarification,
        subtotal: calculatedSubtotal,
        discountPercentage: Number(formDiscount),
        totalAmount: calculatedTotal,
        notesAndTerms: formNotes,
        status: formStatus,
        bankDetails: studioBank,
      });
    }
    handleCloseFormModal();
  };

  const handleConvertToProject = (budgetId: string) => {
    const createdProject = convertBudgetToProject(budgetId);
    if (createdProject) {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#34877c', '#10b981', '#6366f1'],
      });
    }
  };

  const filteredBudgets = budgets.filter(b => {
    const matchSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    const matchType = typeFilter === 'all' || b.projectType === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-[#34877c]" />
            <span>Presupuestos & Propuestas Comerciales</span>
          </h1>
          <p className="text-xs text-[#888888]">
            Armado de cotizaciones en ARS, exportación instantánea en PDF y conversión directa a proyecto activo.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-[#34877c] hover:bg-[#2a6d63] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#202020] p-3.5 sm:p-4 rounded-2xl border border-[#777777]/20 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, título o Nº de presupuesto..."
            className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-white placeholder-[#777777] outline-none focus:border-[#34877c] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | BudgetStatus)}
            className="px-3 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-slate-200 outline-none focus:border-[#34877c]"
          >
            <option value="all">Todos los Estados</option>
            <option value="borrador">Borrador</option>
            <option value="enviado">Enviado</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>

          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'all' | ProjectType)}
            className="px-3 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-slate-200 outline-none focus:border-[#34877c]"
          >
            <option value="all">Todos los Tipos</option>
            <option value="proyecto">📦 Proyecto Puntual</option>
            <option value="mantenimiento">🔄 Abono Mensual</option>
          </select>
        </div>
      </div>

      {/* Budgets List */}
      <div className="space-y-4">
        {filteredBudgets.length === 0 ? (
          <div className="bg-[#202020] border border-[#777777]/20 rounded-2xl p-12 text-center text-[#777777] shadow-lg">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#555555]" />
            <p className="text-sm font-medium text-[#888888]">No se encontraron presupuestos.</p>
          </div>
        ) : (
          filteredBudgets.map(budget => (
            <div
              key={budget.id}
              className="bg-[#202020] rounded-2xl border border-[#777777]/20 p-5 sm:p-6 shadow-lg hover:border-[#34877c]/60 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#888888]">
                      {budget.number}
                    </span>

                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-[#34877c]/15 text-[#34877c] border border-[#34877c]/30">
                      {budget.clientName}
                    </span>

                    {budget.projectType === 'mantenimiento' ? (
                      <span className="text-[10px] uppercase font-bold text-sky-300 bg-sky-950/60 border border-sky-800 px-2 py-0.5 rounded-lg">
                        Abono Mensual
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#aaaaaa] bg-[#141414] border border-[#777777]/20 px-2 py-0.5 rounded-lg">
                        Puntual
                      </span>
                    )}

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        budget.status === 'aprobado'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : budget.status === 'enviado'
                          ? 'bg-blue-950 text-blue-300 border border-blue-700'
                          : budget.status === 'rechazado'
                          ? 'bg-rose-950 text-rose-300 border border-rose-700'
                          : 'bg-[#141414] text-slate-300 border border-[#777777]/30'
                      }`}
                    >
                      {budget.status}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {budget.title}
                  </h2>

                  <div className="text-xs text-[#888888] flex items-center gap-3">
                    <span>Emisión: {formatDateAR(budget.date)}</span>
                    <span>•</span>
                    <span>Vencimiento: {formatDateAR(budget.validUntilDate)}</span>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-xl font-black text-white font-mono">
                    {formatARS(budget.totalAmount)}
                    {budget.projectType === 'mantenimiento' && (
                      <span className="text-xs text-sky-400 font-normal ml-1">/mes</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Convert to Project Action */}
                    {!budget.convertedToProjectId && budget.status !== 'aprobado' && (
                      <button
                        onClick={() => handleConvertToProject(budget.id)}
                        className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/25 transition-all cursor-pointer"
                        title="Aprobar presupuesto y crear proyecto activo de trabajo automáticamente"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprobar & Crear Proyecto</span>
                      </button>
                    )}

                    {budget.convertedToProjectId && (
                      <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-1 bg-emerald-950/40 border border-emerald-800 rounded-xl">
                        ✓ En ejecución activa
                      </span>
                    )}

                    {/* PDF Generator Button */}
                    <button
                      onClick={() => generateBudgetPDF(budget)}
                      className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-[#34877c]/20 hover:bg-[#34877c]/35 text-[#44a598] border border-[#34877c]/40 rounded-xl transition-all cursor-pointer"
                      title="Descargar presupuesto oficial en PDF con estética UNKE"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    {/* View / Print Preview */}
                    <button
                      onClick={() => setPreviewBudget(budget)}
                      className="p-1.5 bg-[#141414] hover:bg-[#282828] text-[#aaaaaa] hover:text-white border border-[#777777]/25 rounded-xl transition-colors cursor-pointer"
                      title="Ver vista previa de impresión"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => duplicateBudget(budget.id)}
                      className="p-1.5 bg-[#141414] hover:bg-[#282828] text-[#aaaaaa] hover:text-white border border-[#777777]/25 rounded-xl transition-colors cursor-pointer"
                      title="Duplicar presupuesto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(budget)}
                      className="p-1.5 bg-[#141414] hover:bg-[#282828] text-[#aaaaaa] hover:text-white border border-[#777777]/25 rounded-xl transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar presupuesto ${budget.number}?`)) {
                          deleteBudget(budget.id);
                        }
                      }}
                      className="p-1.5 bg-[#141414] hover:bg-rose-950/40 text-[#777777] hover:text-rose-400 border border-[#777777]/20 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div className="pt-2.5 border-t border-[#777777]/15 text-xs text-slate-300 space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#aaaaaa]">
                  {budget.items.map((item, idx) => (
                    <span key={item.id || idx}>
                      • {item.description} ({formatARS(item.total)})
                    </span>
                  ))}
                </div>

                {budget.deliverablesClarification && (
                  <div className="bg-[#141414] rounded-xl p-3 border border-[#777777]/20 mt-2 text-xs">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-[#34877c] mb-1">
                      Aclaraciones & Alcance:
                    </div>
                    <FormattedClarificationText text={budget.deliverablesClarification} />
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create / Edit Budget (Landscape / Wide 2-Column layout) */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-5xl lg:max-w-6xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-[#777777]/20 my-auto max-h-[94vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#777777]/20 pb-3 mb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#34877c]/15 text-[#34877c] flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                    {editingBudget ? `Editar Presupuesto ${editingBudget.number}` : 'Nuevo Presupuesto Comercial'}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-[#888888]">
                    Confeccionado por: <strong className="text-slate-700 dark:text-slate-200">{currentUser.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseFormModal}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                title="Cerrar formulario"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {otherEditorWarning && (
              <div className="mb-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 p-2.5 rounded-xl text-xs flex items-center gap-2 shrink-0">
                <span>{otherEditorWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="flex flex-col flex-1 min-h-0 overflow-y-auto pr-0.5 space-y-4">
              {/* Wide 2-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
                
                {/* Column 1 (Left - 5 Cols on Desktop): General Proposal Details & Terms */}
                <div className="lg:col-span-5 space-y-3.5">
                  {/* Type selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Modalidad del Trabajo *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormProjectType('proyecto')}
                        className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          formProjectType === 'proyecto'
                            ? 'border-[#34877c] bg-[#34877c]/10 text-[#34877c] dark:text-teal-200 ring-2 ring-[#34877c]'
                            : 'border-slate-200 dark:border-[#777777]/30 text-slate-600 dark:text-[#888888] hover:border-slate-300 dark:hover:border-[#777777]/50'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-[#34877c]" />
                          <span className="truncate">Proyecto Puntual</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormProjectType('mantenimiento')}
                        className={`p-2 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                          formProjectType === 'mantenimiento'
                            ? 'border-[#34877c] bg-[#34877c]/10 text-[#34877c] dark:text-teal-200 ring-2 ring-[#34877c]'
                            : 'border-slate-200 dark:border-[#777777]/30 text-slate-600 dark:text-[#888888] hover:border-slate-300 dark:hover:border-[#777777]/50'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1.5">
                          <Repeat className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="truncate">Abono Mensual</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Client Selector or Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Cliente *
                      </label>
                      {clients.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormClientId(formClientId === 'new' ? (clients[0]?.id || '') : 'new')}
                          className="text-[10px] text-[#34877c] hover:underline font-semibold cursor-pointer"
                        >
                          {formClientId === 'new' ? 'Elegir existente' : '+ Nuevo cliente'}
                        </button>
                      )}
                    </div>
                    {clients.length === 0 || formClientId === 'new' ? (
                      <input
                        type="text"
                        value={formNewClientName}
                        onChange={e => setFormNewClientName(e.target.value)}
                        placeholder="Nombre del cliente o empresa..."
                        required
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                      />
                    ) : (
                      <select
                        value={formClientId}
                        onChange={e => {
                          const cId = e.target.value;
                          setFormClientId(cId);
                          const sel = clients.find(c => c.id === cId);
                          if (sel) setFormClientContact(sel.email || '');
                        }}
                        required
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                      >
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.company ? `(${c.company})` : ''}
                          </option>
                        ))}
                        <option value="new">+ Crear nuevo cliente...</option>
                      </select>
                    )}
                  </div>

                  {/* Proposal Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Título de la Propuesta *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="Ej. Rediseño Web & Branding Institucional"
                      required
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                    />
                  </div>

                  {/* Dates & Status Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Emisión
                      </label>
                      <input
                        type="date"
                        value={formDate}
                        onChange={e => setFormDate(e.target.value)}
                        required
                        className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Válido hasta
                      </label>
                      <input
                        type="date"
                        value={formValidUntilDate}
                        onChange={e => setFormValidUntilDate(e.target.value)}
                        required
                        className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Estado
                      </label>
                      <select
                        value={formStatus}
                        onChange={e => setFormStatus(e.target.value as BudgetStatus)}
                        className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200"
                      >
                        <option value="borrador">Borrador</option>
                        <option value="enviado">Enviado</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="rechazado">Rechazado</option>
                      </select>
                    </div>
                  </div>

                  {/* Commercial Terms & Payment notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Condiciones comerciales y formas de pago
                    </label>
                    <textarea
                      value={formNotes}
                      onChange={e => setFormNotes(e.target.value)}
                      rows={3}
                      placeholder="Condiciones de pago (ej. 50% anticipo y 50% contra entrega)..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200 resize-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c]"
                    />
                  </div>
                </div>

                {/* Column 2 (Right - 7 Cols on Desktop): Items Table & Formatted Scope Clarifications */}
                <div className="lg:col-span-7 space-y-3.5">
                  {/* Items Table Builder */}
                  <div className="border border-slate-200 dark:border-[#777777]/20 rounded-2xl p-3.5 bg-slate-50/70 dark:bg-[#141414]/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        Conceptos & Entregables cotizados
                      </span>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center gap-1 text-xs font-bold text-[#34877c] hover:text-[#276961] dark:hover:text-[#44a598] transition-colors cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Agregar Fila</span>
                      </button>
                    </div>

                    {/* Table headers */}
                    <div className="grid grid-cols-12 gap-2 text-[10px] font-semibold text-slate-500 dark:text-[#777777] px-1">
                      <div className="col-span-6">DESCRIPCIÓN / SERVICIO</div>
                      <div className="col-span-2 text-center">CANT.</div>
                      <div className="col-span-3 text-right">PRECIO ($ ARS)</div>
                      <div className="col-span-1 text-center"></div>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                      {formItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-[#202020] p-1.5 rounded-xl border border-slate-200 dark:border-[#777777]/20 shadow-xs"
                        >
                          <div className="col-span-6">
                            <input
                              type="text"
                              value={item.description}
                              onChange={e =>
                                handleItemChange(item.id, 'description', e.target.value)
                              }
                              placeholder={`Concepto #${idx + 1}...`}
                              required
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c]"
                            />
                          </div>

                          <div className="col-span-2">
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e =>
                                handleItemChange(item.id, 'quantity', e.target.value)
                              }
                              placeholder="Cant."
                              className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-lg text-slate-800 dark:text-slate-200 text-center focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c]"
                            />
                          </div>

                          <div className="col-span-3">
                            <input
                              type="text"
                              value={item.unitPrice}
                              onChange={e =>
                                handleItemChange(item.id, 'unitPrice', e.target.value)
                              }
                              placeholder="$ ARS"
                              required
                              className="w-full text-xs px-2.5 py-1.5 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-lg text-slate-800 dark:text-slate-200 text-right font-mono font-semibold focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c]"
                            />
                          </div>

                          <div className="col-span-1 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={formItems.length === 1}
                              className="p-1 text-slate-400 hover:text-rose-500 disabled:opacity-20 transition-colors cursor-pointer"
                              title="Eliminar fila"
                            >
                              <Trash2 className="w-3.5 h-3.5 mx-auto" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal and Discount Bar */}
                    <div className="pt-2 flex flex-row items-center justify-between gap-3 border-t border-slate-200 dark:border-[#777777]/20 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-600 dark:text-[#888888] text-[11px]">Descuento (%):</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={formDiscount}
                          onChange={e => setFormDiscount(Number(e.target.value))}
                          className="w-14 text-xs px-2 py-1 bg-white dark:bg-[#202020] border border-slate-200 dark:border-[#777777]/30 rounded-lg text-center font-bold"
                        />
                      </div>

                      <div className="flex items-center gap-2 text-right">
                        <span className="text-slate-500 dark:text-[#888888] text-[11px]">Total Final:</span>
                        <span className="text-base sm:text-lg font-black text-[#34877c] font-mono">
                          {formatARS(calculatedTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Free Text Clarification / Detailed Deliverables Scope */}
                  <div className="border border-slate-200 dark:border-[#777777]/20 rounded-2xl p-3 bg-slate-50/70 dark:bg-[#141414]/90">
                    <FormattedClarificationEditor
                      value={formDeliverablesClarification}
                      onChange={setFormDeliverablesClarification}
                      label="Aclaraciones & Alcance Detallado de Entregables (Opcional)"
                      placeholder="Escribí aclaraciones sobre los entregables cotizados (ej: qué incluye, formatos de entrega, cantidad de revisiones, qué no incluye)..."
                      helperText="Podés usar la barra para aplicar Negrita, Cursiva, Viñetas (•) o separar en Párrafos."
                    />
                  </div>
                </div>

              </div>

              {/* Modal Footer / Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-[#777777]/20 pt-3 mt-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-[#aaaaaa] hover:bg-slate-100 dark:hover:bg-[#282828] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#34877c] hover:bg-[#276961] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {editingBudget ? 'Guardar Cambios' : 'Crear Presupuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview / Print Modal */}
      {previewBudget && (
        <BudgetPrintModal
          budget={previewBudget}
          onClose={() => setPreviewBudget(null)}
          onConvertToProject={handleConvertToProject}
        />
      )}
    </div>
  );
};
