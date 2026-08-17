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
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Presupuestos & Propuestas Comerciales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Armado de cotizaciones en ARS, exportación instantánea en PDF y conversión directa a proyecto activo.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-[#34877c] hover:bg-[#276961] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#34877c]"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Presupuesto</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, título o Nº de presupuesto..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | BudgetStatus)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
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
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
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
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">No se encontraron presupuestos.</p>
          </div>
        ) : (
          filteredBudgets.map(budget => (
            <div
              key={budget.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-[#34877c]/60 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                      {budget.number}
                    </span>

                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-[#34877c]">
                      {budget.clientName}
                    </span>

                    {budget.projectType === 'mantenimiento' ? (
                      <span className="text-[10px] uppercase font-bold text-sky-700 bg-sky-100 dark:bg-sky-950 dark:text-sky-300 px-1.5 py-0.5 rounded">
                        Abono Mensual
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        Puntual
                      </span>
                    )}

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                        budget.status === 'aprobado'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                          : budget.status === 'enviado'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-300'
                          : budget.status === 'rechazado'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                      }`}
                    >
                      {budget.status.toUpperCase()}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    {budget.title}
                  </h2>

                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3">
                    <span>Emisión: {formatDateAR(budget.date)}</span>
                    <span>•</span>
                    <span>Vencimiento: {formatDateAR(budget.validUntilDate)}</span>
                  </div>
                </div>

                {/* Price and Actions */}
                <div className="flex flex-col sm:items-end gap-2">
                  <div className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatARS(budget.totalAmount)}
                    {budget.projectType === 'mantenimiento' && (
                      <span className="text-xs text-slate-400 font-normal ml-1">/mes</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Convert to Project Action */}
                    {!budget.convertedToProjectId && budget.status !== 'aprobado' && (
                      <button
                        onClick={() => handleConvertToProject(budget.id)}
                        className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
                        title="Aprobar presupuesto y crear proyecto activo de trabajo automáticamente"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Aprobar & Crear Proyecto</span>
                      </button>
                    )}

                    {budget.convertedToProjectId && (
                      <span className="text-[11px] text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg">
                        ✓ En ejecución activa
                      </span>
                    )}

                    {/* PDF Generator Button */}
                    <button
                      onClick={() => generateBudgetPDF(budget)}
                      className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-[#34877c]/10 hover:bg-[#34877c]/20 text-[#34877c] dark:text-[#44a598] rounded-lg transition-colors"
                      title="Descargar presupuesto oficial en PDF con estética UNKE"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    {/* View / Print Preview */}
                    <button
                      onClick={() => setPreviewBudget(budget)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                      title="Ver vista previa de impresión"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>

                    {/* Duplicate */}
                    <button
                      onClick={() => duplicateBudget(budget.id)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
                      title="Duplicar presupuesto"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => handleOpenEdit(budget)}
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
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
                      className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Items summary */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {budget.items.map((item, idx) => (
                    <span key={item.id || idx}>
                      • {item.description} ({formatARS(item.total)})
                    </span>
                  ))}
                </div>

                {budget.deliverablesClarification && (
                  <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700/60 mt-2 text-xs">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-[#34877c] dark:text-[#44a598] mb-1">
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

      {/* Modal: Create / Edit Budget */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingBudget ? `Editar ${editingBudget.number}` : 'Nuevo Presupuesto UNKE'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cargado por: <strong className="text-slate-700 dark:text-slate-200">{currentUser.name}</strong>
                </p>
              </div>
              <button
                onClick={handleCloseFormModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {otherEditorWarning && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 p-3 rounded-lg text-xs flex items-center gap-2">
                <span>{otherEditorWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-4">
              {/* Type selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormProjectType('proyecto')}
                  className={`p-2.5 rounded-xl border text-left text-xs ${
                    formProjectType === 'proyecto'
                      ? 'border-[#34877c] bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 ring-2 ring-[#34877c]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#34877c]" />
                    <span>Presupuesto Cerrado (Puntual)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormProjectType('mantenimiento')}
                  className={`p-2.5 rounded-xl border text-left text-xs ${
                    formProjectType === 'mantenimiento'
                      ? 'border-[#34877c] bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 ring-2 ring-[#34877c]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    <Repeat className="w-4 h-4 text-emerald-600" />
                    <span>Presupuesto de Abono Mensual</span>
                  </div>
                </button>
              </div>

              {/* Client & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Cliente *
                    </label>
                    {clients.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormClientId(formClientId === 'new' ? (clients[0]?.id || '') : 'new')}
                        className="text-[10px] text-[#34877c] hover:underline font-semibold"
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
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
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
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Título de la Propuesta *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Ej. Diseño y Desarrollo Web Ecommerce"
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  />
                </div>
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Válido hasta
                  </label>
                  <input
                    type="date"
                    value={formValidUntilDate}
                    onChange={e => setFormValidUntilDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as BudgetStatus)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="enviado">Enviado</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              {/* Items Table Builder */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Conceptos & Entregables cotizados
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center gap-1 text-xs font-semibold text-[#34877c] dark:text-[#44a598] hover:underline"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Agregar Fila</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700"
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
                          className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200"
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
                          className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-center"
                        />
                      </div>

                      <div className="col-span-3">
                        <input
                          type="text"
                          value={item.unitPrice}
                          onChange={e =>
                            handleItemChange(item.id, 'unitPrice', e.target.value)
                          }
                          placeholder="P. Unit ($ ARS)"
                          required
                          className="w-full text-xs px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 text-right"
                        />
                      </div>

                      <div className="col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={formItems.length === 1}
                          className="text-slate-400 hover:text-rose-500 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal and Discount Bar */}
                <div className="pt-2 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-700 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">Descuento aplicado (%):</span>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formDiscount}
                      onChange={e => setFormDiscount(Number(e.target.value))}
                      className="w-16 text-xs px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-center"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-slate-500 mr-2">Total Final en ARS:</span>
                    <span className="text-base font-bold text-[#34877c] dark:text-[#44a598]">
                      {formatARS(calculatedTotal)}
                    </span>
                  </div>
                </div>

                {/* Free Text Clarification / Detailed Deliverables Scope */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                  <FormattedClarificationEditor
                    value={formDeliverablesClarification}
                    onChange={setFormDeliverablesClarification}
                    label="Aclaraciones & Alcance Detallado de Entregables (Opcional)"
                    placeholder="Escribí aclaraciones sobre los entregables cotizados (ej: qué incluye, formatos de entrega, cantidad de revisiones, qué no incluye)..."
                    helperText="Podés usar la barra superior para aplicar Negrita, Cursiva, Viñetas (•) o separar en Párrafos."
                  />
                </div>
              </div>

              {/* Terms and conditions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condiciones comerciales y formas de pago
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#34877c] hover:bg-[#276961] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                >
                  {editingBudget ? 'Guardar Presupuesto' : 'Crear Presupuesto'}
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
