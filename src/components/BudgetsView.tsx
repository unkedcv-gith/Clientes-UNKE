import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { BankAccountDetails, Budget, BudgetItem, BudgetStatus, ProjectType } from '../types';
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
  CreditCard,
  Building,
  User,
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
    team,
    studioBank,
    userBanks,
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

  // Selected Bank Account in Budget Form ('studio' | member_id)
  const [formSelectedBankId, setFormSelectedBankId] = useState<string>('studio');

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
    // Default bank selector to current user or studio
    setFormSelectedBankId(currentUser?.id || 'studio');
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
    setFormSelectedBankId(budget.selectedMemberBankId || 'studio');
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

  // Helper to resolve chosen bank details
  const getSelectedBankDetails = (bankId: string): BankAccountDetails => {
    if (bankId === 'studio') {
      return studioBank;
    }
    return userBanks[bankId] || studioBank;
  };

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

    const resolvedBankDetails = getSelectedBankDetails(formSelectedBankId);

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
        selectedMemberBankId: formSelectedBankId,
        bankDetails: resolvedBankDetails,
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
        selectedMemberBankId: formSelectedBankId,
        bankDetails: resolvedBankDetails,
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

  // Filter and search
  const filteredBudgets = budgets
    .filter(budget => {
      const matchSearch =
        budget.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        budget.number.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || budget.status === statusFilter;
      const matchType = typeFilter === 'all' || budget.projectType === typeFilter;

      return matchSearch && matchStatus && matchType;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Metrics
  const totalBudgetsCount = budgets.length;
  const approvedBudgets = budgets.filter(b => b.status === 'aprobado');
  const totalApprovedAmount = approvedBudgets.reduce((sum, b) => sum + b.totalAmount, 0);
  const conversionRate =
    totalBudgetsCount > 0
      ? Math.round((approvedBudgets.length / totalBudgetsCount) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Presupuestos Comerciales</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#34877c]/20 text-[#34877c] border border-[#34877c]/30 font-semibold">
              {budgets.length}
            </span>
          </h1>
          <p className="text-xs text-[#888888] mt-1">
            Cotizaciones oficiales en ARS, datos bancarios por integrante y descarga directa en PDF
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#34877c] hover:bg-[#276961] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Presupuesto</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#777777]/20 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#888888]">Presupuestos Emitidos</div>
            <div className="text-xl font-bold text-white mt-0.5">{totalBudgetsCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#34877c]/10 text-[#34877c] flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#777777]/20 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#888888]">Presupuestos Aprobados</div>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {approvedBudgets.length}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#1a1a1a] p-4 rounded-2xl border border-[#777777]/20 flex items-center justify-between">
          <div>
            <div className="text-xs text-[#888888]">Tasa de Aprobación</div>
            <div className="text-xl font-bold text-[#34877c] mt-0.5 font-mono">
              {conversionRate}%
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#34877c]/10 text-[#34877c] flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#1a1a1a] p-3 rounded-2xl border border-[#777777]/20 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-[#777777] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente, título o número..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#141414] border border-[#777777]/30 rounded-xl text-xs text-white placeholder-[#777777] outline-none focus:border-[#34877c]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-1.5 bg-[#141414] border border-[#777777]/30 rounded-xl text-xs text-[#aaaaaa] outline-none focus:border-[#34877c]"
          >
            <option value="all">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="enviado">Enviado</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="w-full sm:w-auto px-3 py-1.5 bg-[#141414] border border-[#777777]/30 rounded-xl text-xs text-[#aaaaaa] outline-none focus:border-[#34877c]"
          >
            <option value="all">Todas las modalidades</option>
            <option value="proyecto">Proyecto Puntual</option>
            <option value="mantenimiento">Abono Mensual</option>
          </select>
        </div>
      </div>

      {/* Budgets List */}
      {filteredBudgets.length === 0 ? (
        <div className="bg-[#1a1a1a] rounded-2xl border border-[#777777]/20 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#141414] text-[#777777] flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div className="text-sm font-bold text-white">No se encontraron presupuestos</div>
          <p className="text-xs text-[#777777] max-w-sm mx-auto">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
              ? 'Probá ajustando los filtros o el término de búsqueda.'
              : 'Creá la primera cotización para un cliente existente o nuevo.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-[#34877c] hover:bg-[#276961] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            + Crear Presupuesto
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBudgets.map(budget => (
            <div
              key={budget.id}
              className="bg-[#1a1a1a] p-4 sm:p-5 rounded-2xl border border-[#777777]/20 hover:border-[#34877c]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              {/* Info Column */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#34877c] bg-[#34877c]/10 px-2 py-0.5 rounded-md">
                    {budget.number}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      budget.status === 'aprobado'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : budget.status === 'enviado'
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : budget.status === 'borrador'
                        ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {budget.status}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      budget.projectType === 'mantenimiento'
                        ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {budget.projectType === 'mantenimiento' ? 'Abono Mensual' : 'Proyecto'}
                  </span>

                  {/* Bank Account indicator */}
                  {budget.bankDetails && (
                    <span className="text-[10px] text-[#888888] bg-[#141414] px-2 py-0.5 rounded-md border border-[#777777]/20 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-[#34877c]" />
                      <span>{budget.bankDetails.bank || 'Cta. Bancaria'} ({budget.bankDetails.accountHolder?.split(' ')[0] || 'UNKE'})</span>
                    </span>
                  )}
                </div>

                <div className="text-sm font-bold text-white group-hover:text-[#34877c] transition-colors truncate">
                  {budget.title}
                </div>

                <div className="text-xs text-[#888888] flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-300">
                    Cliente: <strong>{budget.clientName}</strong>
                  </span>
                  <span>•</span>
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
                      if (window.confirm(`¿Eliminar el presupuesto ${budget.number}?`)) {
                        deleteBudget(budget.id);
                      }
                    }}
                    className="p-1.5 bg-[#141414] hover:bg-rose-950/40 text-[#aaaaaa] hover:text-rose-400 border border-[#777777]/25 hover:border-rose-800 rounded-xl transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT BUDGET MODAL */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 dark:border-[#777777]/20 my-auto max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#777777]/20 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2.5">
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
                
                {/* Column 1 (Left - 5 Cols on Desktop): General Proposal Details, Bank & Terms */}
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
                          if (sel?.email) setFormClientContact(sel.email);
                        }}
                        className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                      >
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.company ? `(${c.company})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Proposal Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Título / Asunto de la propuesta *
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="ej. Rediseño de Identidad & Arquitectura Web"
                      required
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-xl text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                    />
                  </div>

                  {/* Bank Account Selection for this budget */}
                  <div className="p-3 bg-slate-50 dark:bg-[#141414] rounded-xl border border-slate-200 dark:border-[#777777]/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-[#34877c]" />
                        <span>Datos Bancarios a Incluir</span>
                      </label>
                      <span className="text-[10px] text-slate-500 dark:text-[#888888]">
                        Aparecerá en el PDF
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFormSelectedBankId('studio')}
                        className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          formSelectedBankId === 'studio'
                            ? 'border-[#34877c] bg-[#34877c]/15 text-[#34877c] dark:text-teal-200 ring-1 ring-[#34877c]'
                            : 'border-slate-200 dark:border-[#777777]/20 text-slate-600 dark:text-[#888888] hover:bg-slate-100 dark:hover:bg-[#202020]'
                        }`}
                      >
                        <Building className="w-3.5 h-3.5 shrink-0 text-[#34877c]" />
                        <span className="truncate">UNKE Oficial</span>
                      </button>

                      {team.map(member => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setFormSelectedBankId(member.id)}
                          className={`flex items-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            formSelectedBankId === member.id
                              ? 'border-[#34877c] bg-[#34877c]/15 text-[#34877c] dark:text-teal-200 ring-1 ring-[#34877c]'
                              : 'border-slate-200 dark:border-[#777777]/20 text-slate-600 dark:text-[#888888] hover:bg-slate-100 dark:hover:bg-[#202020]'
                          }`}
                        >
                          <div
                            style={{ backgroundColor: member.avatarColor }}
                            className="w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center shrink-0"
                          >
                            {member.initials}
                          </div>
                          <span className="truncate">{member.name.split(' ')[0]}</span>
                        </button>
                      ))}
                    </div>

                    {/* Preview of active selected bank */}
                    <div className="text-[11px] text-slate-500 dark:text-[#888888] bg-white dark:bg-[#1a1a1a] p-2 rounded-lg border border-slate-200 dark:border-[#777777]/20">
                      {(() => {
                        const bank = getSelectedBankDetails(formSelectedBankId);
                        return (
                          <div className="space-y-0.5">
                            <p>
                              <strong className="text-slate-700 dark:text-slate-200">{bank.bank || 'Sin banco'}</strong> • {bank.accountHolder}
                            </p>
                            <p className="font-mono text-[10px]">
                              Alias: <span className="text-[#34877c] font-bold">{bank.alias || '-'}</span> | CBU: {bank.cbu || '-'}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
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
                              className="w-full text-xs px-2 py-1.5 text-center bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-lg text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          <div className="col-span-3">
                            <input
                              type="number"
                              min={0}
                              step={1000}
                              value={item.unitPrice || ''}
                              onChange={e =>
                                handleItemChange(item.id, 'unitPrice', e.target.value)
                              }
                              placeholder="$ 0"
                              required
                              className="w-full text-xs px-2 py-1.5 text-right font-mono bg-slate-50 dark:bg-[#141414] border border-slate-200 dark:border-[#777777]/30 rounded-lg text-slate-800 dark:text-slate-200"
                            />
                          </div>

                          <div className="col-span-1 text-center">
                            {formItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-slate-400 hover:text-rose-500 p-1 rounded-md transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Subtotals and Discount */}
                    <div className="pt-2 border-t border-slate-200 dark:border-[#777777]/20 flex flex-col items-end gap-1.5 text-xs">
                      <div className="flex items-center justify-between w-64 text-slate-500 dark:text-[#888888]">
                        <span>Subtotal bruto:</span>
                        <span className="font-mono">{formatARS(calculatedSubtotal)}</span>
                      </div>

                      <div className="flex items-center justify-between w-64 text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1">
                          <span>Descuento (%):</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={formDiscount || ''}
                            onChange={e => setFormDiscount(Number(e.target.value) || 0)}
                            className="w-12 px-1 py-0.5 bg-slate-100 dark:bg-[#202020] border border-slate-200 dark:border-[#777777]/30 rounded text-center text-xs font-bold text-rose-500"
                          />
                        </span>
                        <span className="font-mono text-rose-500">
                          - {formatARS(calculatedDiscountAmount)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between w-64 pt-1.5 border-t border-slate-200 dark:border-[#777777]/20 text-sm font-bold text-slate-900 dark:text-white">
                        <span className="text-[#34877c] uppercase">
                          {formProjectType === 'mantenimiento' ? 'Total Mensual:' : 'Total Presupuesto:'}
                        </span>
                        <span className="text-base font-black text-[#34877c] font-mono">
                          {formatARS(calculatedTotal)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Formatted Scope Clarifications Editor */}
                  <FormattedClarificationEditor
                    value={formDeliverablesClarification}
                    onChange={setFormDeliverablesClarification}
                  />
                </div>
              </div>

              {/* Form Action Footer */}
              <div className="pt-3 border-t border-slate-200 dark:border-[#777777]/20 flex items-center justify-end gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-4 py-2 bg-slate-100 dark:bg-[#141414] hover:bg-slate-200 dark:hover:bg-[#282828] text-slate-700 dark:text-[#aaaaaa] hover:text-slate-900 dark:hover:text-white rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#777777]/20 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#34877c] hover:bg-[#276961] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingBudget ? 'Guardar Cambios' : 'Emitir Presupuesto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT / DOWNLOAD MODAL */}
      <BudgetPrintModal
        budget={previewBudget}
        onClose={() => setPreviewBudget(null)}
        onConvertToProject={handleConvertToProject}
      />
    </div>
  );
};
