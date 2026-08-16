import React, { useState, useMemo } from 'react';
import { useStudio } from '../context/StudioContext';
import { Project, ProjectStatus, ProjectType, PaymentStatus, Deliverable } from '../types';
import { formatARS, formatDateAR, getDeadlineBadge, generateId, parseARS } from '../utils/currency';
import {
  FolderKanban,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Repeat,
  Layers,
  ChevronRight,
  User,
  PlusCircle,
  X,
  CreditCard,
  Tag,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectsViewProps {
  selectedProjectId?: string | null;
  onClearSelectedProject?: () => void;
  openCreateTrigger?: number;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  selectedProjectId,
  onClearSelectedProject,
  openCreateTrigger,
}) => {
  const {
    projects,
    clients,
    currentUser,
    activePresences,
    addProject,
    updateProject,
    deleteProject,
    toggleDeliverable,
    recordPayment,
    startEditingItem,
    stopEditingItem,
    otherEditorWarning,
  } = useStudio();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | ProjectType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ProjectStatus>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentStatus>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  // Quick Payment Modal
  const [paymentModalProjectId, setPaymentModalProjectId] = useState<string | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form State for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formType, setFormType] = useState<ProjectType>('proyecto');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('en_progreso');
  const [formPaymentStatus, setFormPaymentStatus] = useState<PaymentStatus>('pendiente');
  const [formTotalAmount, setFormTotalAmount] = useState<string>('0');
  const [formPaidAmount, setFormPaidAmount] = useState<string>('0');
  const [formMonthlyBillingDay, setFormMonthlyBillingDay] = useState<number>(5);
  const [formStartDate, setFormStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [formDeliveryDate, setFormDeliveryDate] = useState('');
  const [formTags, setFormTags] = useState<string>('');
  const [formDeliverables, setFormDeliverables] = useState<Deliverable[]>([]);
  const [newDeliverableTitle, setNewDeliverableTitle] = useState('');

  // Open modal if selectedProjectId changes
  React.useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        handleOpenEdit(proj);
      }
    }
  }, [selectedProjectId]);

  // Open create modal if openCreateTrigger changes
  React.useEffect(() => {
    if (openCreateTrigger && openCreateTrigger > 0) {
      handleOpenCreate();
    }
  }, [openCreateTrigger]);

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormTitle('');
    setFormDescription('');
    setFormClientId(clients[0]?.id || '');
    setFormType('proyecto');
    setFormStatus('en_progreso');
    setFormPaymentStatus('pendiente');
    setFormTotalAmount('');
    setFormPaidAmount('0');
    setFormMonthlyBillingDay(5);
    setFormStartDate(new Date().toISOString().split('T')[0]);

    const defaultDelivery = new Date();
    defaultDelivery.setDate(defaultDelivery.getDate() + 14);
    setFormDeliveryDate(defaultDelivery.toISOString().split('T')[0]);
    setFormTags('Branding, Digital');
    setFormDeliverables([
      { id: generateId('del'), title: 'Reunión de briefing y moodboard', done: false },
      { id: generateId('del'), title: 'Diseño de propuestas conceptuales', done: false },
      { id: generateId('del'), title: 'Entrega de archivos finales', done: false },
    ]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (project: Project) => {
    setEditingProject(project);
    startEditingItem(project.id, project.title);
    setFormTitle(project.title);
    setFormDescription(project.description || '');
    setFormClientId(project.clientId);
    setFormType(project.type);
    setFormStatus(project.status);
    setFormPaymentStatus(project.paymentStatus);
    setFormTotalAmount(String(project.totalAmount));
    setFormPaidAmount(String(project.paidAmount));
    setFormMonthlyBillingDay(project.monthlyBillingDay || 5);
    setFormStartDate(project.startDate);
    setFormDeliveryDate(project.deliveryDate || '');
    setFormTags(project.tags ? project.tags.join(', ') : '');
    setFormDeliverables(project.deliverables || []);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    stopEditingItem();
    if (onClearSelectedProject) onClearSelectedProject();
  };

  const handleAddDeliverable = () => {
    if (!newDeliverableTitle.trim()) return;
    setFormDeliverables(prev => [
      ...prev,
      { id: generateId('del'), title: newDeliverableTitle.trim(), done: false },
    ]);
    setNewDeliverableTitle('');
  };

  const handleRemoveDeliverable = (id: string) => {
    setFormDeliverables(prev => prev.filter(d => d.id !== id));
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === formClientId);
    const clientName = client ? client.name : 'Cliente General';
    const totalAmount = parseARS(formTotalAmount);
    const paidAmount = parseARS(formPaidAmount);
    const tags = formTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingProject) {
      updateProject(editingProject.id, {
        title: formTitle,
        description: formDescription,
        clientId: formClientId,
        clientName,
        type: formType,
        status: formStatus,
        paymentStatus: formPaymentStatus,
        totalAmount,
        paidAmount,
        monthlyBillingDay: formType === 'mantenimiento' ? Number(formMonthlyBillingDay) : undefined,
        startDate: formStartDate,
        deliveryDate: formDeliveryDate,
        tags,
        deliverables: formDeliverables,
      });
    } else {
      addProject({
        title: formTitle,
        description: formDescription,
        clientId: formClientId,
        clientName,
        type: formType,
        status: formStatus,
        paymentStatus: formPaymentStatus,
        totalAmount,
        paidAmount,
        monthlyBillingDay: formType === 'mantenimiento' ? Number(formMonthlyBillingDay) : undefined,
        startDate: formStartDate,
        deliveryDate: formDeliveryDate,
        tags,
        deliverables: formDeliverables,
        paymentsHistory:
          paidAmount > 0
            ? [
                {
                  id: generateId('pay'),
                  date: formStartDate,
                  amount: paidAmount,
                  method: 'Transferencia Bancaria',
                  notes: 'Pago inicial registrado al crear proyecto',
                  recordedBy: currentUser.name,
                },
              ]
            : [],
      });
    }

    handleCloseModal();
  };

  const handleDelete = (project: Project) => {
    setProjectToDelete(project);
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;
    deleteProject(projectToDelete.id);
    if (editingProject?.id === projectToDelete.id) {
      handleCloseModal();
    }
    setProjectToDelete(null);
  };

  const handleToggleDeliverableWithCelebration = (projectId: string, delId: string, currentDone: boolean) => {
    toggleDeliverable(projectId, delId);
    if (!currentDone) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#34877c', '#44a598', '#276961'],
      });
    }
  };

  const handleOpenPaymentModal = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    setPaymentModalProjectId(projectId);
    const remaining = Math.max(0, project.totalAmount - project.paidAmount);
    setPaymentAmountInput(String(remaining));
    setPaymentNotes('');
  };

  const handleSaveQuickPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalProjectId) return;
    const amount = parseARS(paymentAmountInput);
    if (amount <= 0) return;

    recordPayment(paymentModalProjectId, amount, paymentMethod, paymentNotes);
    confetti({
      particleCount: 45,
      spread: 70,
      origin: { y: 0.7 },
      colors: ['#10b981', '#34877c', '#3b82f6'],
    });
    setPaymentModalProjectId(null);
  };

  // Filtered list
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.tags && project.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchType = typeFilter === 'all' || project.type === typeFilter;
      const matchStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchPayment = paymentFilter === 'all' || project.paymentStatus === paymentFilter;

      return matchSearch && matchType && matchStatus && matchPayment;
    });
  }, [projects, searchTerm, typeFilter, statusFilter, paymentFilter]);

  const kanbanColumns: { status: ProjectStatus; title: string; color: string }[] = [
    { status: 'prospecto', title: 'Prospecto / A Presupuestar', color: 'border-slate-300' },
    { status: 'en_progreso', title: 'En Progreso', color: 'border-[#34877c]' },
    { status: 'en_revision', title: 'En Revisión / Feedback', color: 'border-amber-400' },
    { status: 'completado', title: 'Completado', color: 'border-emerald-500' },
    { status: 'entregado', title: 'Entregado / Cerrado', color: 'border-blue-500' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Proyectos & Abonos Mensuales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Control de entregables, fechas límites y estados de facturación en Pesos Argentinos (ARS).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle (List vs Kanban) */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Tablero
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-[#34877c] hover:bg-[#276961] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#34877c]"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Trabajo</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, título, código (UNK-2026-...) o etiqueta..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as 'all' | ProjectType)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
          >
            <option value="all">Todos los Tipos</option>
            <option value="proyecto">📦 Proyectos Puntuales</option>
            <option value="mantenimiento">🔄 Abonos Mensuales</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | ProjectStatus)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
          >
            <option value="all">Todos los Estados</option>
            <option value="prospecto">Prospecto</option>
            <option value="en_progreso">En Progreso</option>
            <option value="en_revision">En Revisión</option>
            <option value="completado">Completado</option>
            <option value="entregado">Entregado</option>
            <option value="pausado">Pausado</option>
          </select>

          {/* Payment Status Filter */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value as 'all' | PaymentStatus)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
          >
            <option value="all">Todos los Pagos</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="al_dia">Al Día</option>
            <option value="pagado">Pagado</option>
            <option value="facturado">Facturado</option>
            <option value="en_mora">En Mora</option>
          </select>
        </div>
      </div>

      {/* View 1: List View */}
      {viewMode === 'list' ? (
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-12 text-center text-slate-400">
              <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No se encontraron proyectos con los filtros aplicados.</p>
            </div>
          ) : (
            filteredProjects.map(project => {
              const deadline = getDeadlineBadge(project.deliveryDate, project.status);
              const pendingBal = Math.max(0, project.totalAmount - project.paidAmount);
              const completedDel = project.deliverables.filter(d => d.done).length;
              const totalDel = project.deliverables.length;
              const percentDel = totalDel > 0 ? Math.round((completedDel / totalDel) * 100) : 0;

              return (
                <div
                  key={project.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-[#34877c]/60 dark:hover:border-[#34877c]/60 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Main details */}
                    <div className="flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                          {project.code}
                        </span>

                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-teal-50 dark:bg-teal-950/40 text-[#34877c] dark:text-[#44a598]">
                          {project.clientName}
                        </span>

                        {project.type === 'mantenimiento' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                            <Repeat className="w-3 h-3" />
                            Abono Mensual (Día {project.monthlyBillingDay || 5})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Layers className="w-3 h-3" />
                            Proyecto Puntual
                          </span>
                        )}

                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium border ${deadline.colorClass}`}
                        >
                          {deadline.label}
                        </span>
                      </div>

                      <h2 className="text-base font-bold text-slate-900 dark:text-white">
                        {project.title}
                      </h2>

                      {project.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Tags */}
                      {project.tags && project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {project.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Financial Summary & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-end justify-between gap-3 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <div className="text-xs text-slate-400">
                          {project.type === 'mantenimiento' ? 'Valor Abono Mensual' : 'Valor Total Presupuestado'}
                        </div>
                        <div className="text-lg font-bold text-slate-900 dark:text-white">
                          {formatARS(project.totalAmount)}
                        </div>

                        {project.type === 'proyecto' && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 sm:justify-end">
                            <span>Cobrado: {formatARS(project.paidAmount)}</span>
                            {pendingBal > 0 && (
                              <span className="text-amber-600 dark:text-amber-400 font-medium">
                                (Resta: {formatARS(pendingBal)})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {project.type === 'proyecto' && pendingBal > 0 && (
                          <button
                            onClick={() => handleOpenPaymentModal(project.id)}
                            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Cobrar Pago</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleDelete(project)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          title="Eliminar proyecto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables Checklist Section */}
                  {project.deliverables && project.deliverables.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          Entregables del trabajo ({completedDel}/{totalDel})
                        </span>
                        <span>{percentDel}% completado</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {project.deliverables.map(del => (
                          <div
                            key={del.id}
                            onClick={() =>
                              handleToggleDeliverableWithCelebration(project.id, del.id, del.done)
                            }
                            className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                              del.done
                                ? 'bg-teal-50/50 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/40 text-teal-900 dark:text-teal-200'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                                del.done
                                  ? 'bg-[#34877c] border-[#34877c] text-white'
                                  : 'border-slate-400 bg-white dark:bg-slate-900'
                              }`}
                            >
                              {del.done && <CheckCircle2 className="w-3 h-3" />}
                            </div>
                            <span className={`truncate ${del.done ? 'line-through opacity-70' : ''}`}>
                              {del.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer metadata (Author & Updater) */}
                  <div className="mt-3 pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-50 dark:border-slate-800/40">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span>Cargado por: <strong>{project.createdBy}</strong></span>
                      {project.updatedBy && project.updatedBy !== project.createdBy && (
                        <span>• Última modif.: <strong>{project.updatedBy}</strong></span>
                      )}
                    </div>
                    <span>Inicio: {formatDateAR(project.startDate)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* View 2: Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const columnProjects = filteredProjects.filter(p => p.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-slate-100/70 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/60 flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 ${col.color} bg-white dark:bg-slate-900`} />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {col.title}
                    </span>
                  </div>
                  <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded-full">
                    {columnProjects.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnProjects.map(project => {
                    const deadline = getDeadlineBadge(project.deliveryDate, project.status);
                    return (
                      <div
                        key={project.id}
                        onClick={() => handleOpenEdit(project)}
                        className="bg-white dark:bg-slate-900 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs hover:border-[#34877c] transition-all cursor-pointer space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#34877c] truncate max-w-[120px]">
                            {project.clientName}
                          </span>
                          <span className="font-mono text-slate-400">{project.code}</span>
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2">
                          {project.title}
                        </h3>

                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {formatARS(project.totalAmount)}
                          </span>
                          {project.type === 'mantenimiento' && (
                            <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold">
                              /mes
                            </span>
                          )}
                        </div>

                        <div className="pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px]">
                          <span className={`px-1.5 py-0.5 rounded font-medium ${deadline.colorClass}`}>
                            {deadline.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">{project.createdBy}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(project);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-500 rounded hover:bg-rose-950/30 transition-colors"
                              title="Eliminar proyecto"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Create or Edit Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editingProject ? `Editar ${editingProject.code}` : 'Nuevo Proyecto o Abono Mensual'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Cargado por: <strong className="text-slate-700 dark:text-slate-200">{currentUser.name}</strong>
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Collision Warning inside modal if another member is online on this project */}
            {otherEditorWarning && (
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 p-3 rounded-lg text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{otherEditorWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveProject} className="space-y-4">
              {/* Type selector (Puntual vs Mantenimiento mensual) */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormType('proyecto')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    formType === 'proyecto'
                      ? 'border-[#34877c] bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 ring-2 ring-[#34877c]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <Layers className="w-4 h-4 text-[#34877c]" />
                    <span>Proyecto Cerrado (Puntual)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Precio global cerrado, entregas delimitadas y pagos por hitos.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setFormType('mantenimiento')}
                  className={`p-3 rounded-xl border text-left text-xs transition-all ${
                    formType === 'mantenimiento'
                      ? 'border-[#34877c] bg-teal-50/50 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200 ring-2 ring-[#34877c]'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5 text-sm">
                    <Repeat className="w-4 h-4 text-emerald-600" />
                    <span>Mantenimiento Mensual (Abono)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Cobro recurrente mensual (redes, web, soporte institucional).
                  </p>
                </button>
              </div>

              {/* Title & Client */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cliente *
                  </label>
                  <select
                    value={formClientId}
                    onChange={e => setFormClientId(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Título del Trabajo *
                  </label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder="Ej. Rediseño de Identidad y Packaging"
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción y alcance
                </label>
                <textarea
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Detalles sobre entregables, acuerdos o requerimientos técnicos..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                />
              </div>

              {/* Amount, Billing Day, Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {formType === 'mantenimiento' ? 'Valor Mensual ($ ARS) *' : 'Valor Total ($ ARS) *'}
                  </label>
                  <input
                    type="text"
                    value={formTotalAmount}
                    onChange={e => setFormTotalAmount(e.target.value)}
                    placeholder="Ej: 1.250.000"
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  />
                  <span className="text-[10px] text-slate-400">
                    Formato ARS: {formatARS(parseARS(formTotalAmount))}
                  </span>
                </div>

                {formType === 'mantenimiento' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Día de cobro mensual (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={formMonthlyBillingDay}
                      onChange={e => setFormMonthlyBillingDay(Number(e.target.value))}
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Monto Pagado / Anticipo ($ ARS)
                    </label>
                    <input
                      type="text"
                      value={formPaidAmount}
                      onChange={e => setFormPaidAmount(e.target.value)}
                      placeholder="0"
                      className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                    />
                    <span className="text-[10px] text-slate-400">
                      Cobrado: {formatARS(parseARS(formPaidAmount))}
                    </span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Entrega / Límite *
                  </label>
                  <input
                    type="date"
                    value={formDeliveryDate}
                    onChange={e => setFormDeliveryDate(e.target.value)}
                    required
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  />
                </div>
              </div>

              {/* Status & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado del Trabajo
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as ProjectStatus)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  >
                    <option value="prospecto">Prospecto</option>
                    <option value="en_progreso">En Progreso</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="completado">Completado</option>
                    <option value="entregado">Entregado</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado del Cobro
                  </label>
                  <select
                    value={formPaymentStatus}
                    onChange={e => setFormPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="parcial">Parcial</option>
                    <option value="al_dia">Al Día</option>
                    <option value="pagado">Pagado</option>
                    <option value="facturado">Facturado</option>
                    <option value="en_mora">En Mora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Etiquetas (separadas por coma)
                  </label>
                  <input
                    type="text"
                    value={formTags}
                    onChange={e => setFormTags(e.target.value)}
                    placeholder="Branding, Web, Reels..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  />
                </div>
              </div>

              {/* Deliverables Checklist Manager */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Entregables & Checklist del Proyecto
                </label>

                {/* Add new deliverable */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newDeliverableTitle}
                    onChange={e => setNewDeliverableTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDeliverable();
                      }
                    }}
                    placeholder="Ej. Enviar archivos vectoriales a imprenta..."
                    className="flex-1 text-xs px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    Agregar
                  </button>
                </div>

                {/* Deliverables list */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {formDeliverables.map(del => (
                    <div
                      key={del.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <span className="text-slate-800 dark:text-slate-200">{del.title}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(del.id)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4">
                {editingProject ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingProject)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Proyecto</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#34877c] hover:bg-[#276961] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
                  >
                    {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Project */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#202020] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-500/30 space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-950/60 rounded-xl border border-rose-800/60 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Proyecto?</h3>
                <p className="text-xs text-[#888888]">Esta acción removerá el proyecto del sistema</p>
              </div>
            </div>

            <div className="bg-[#141414] p-3.5 rounded-xl border border-[#777777]/20 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Código:</span>
                <span className="font-mono font-bold text-[#34877c]">{projectToDelete.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Título:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{projectToDelete.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Cliente:</span>
                <span className="font-semibold text-slate-200">{projectToDelete.clientName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Valor:</span>
                <span className="font-bold text-emerald-400">{formatARS(projectToDelete.totalAmount)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              ¿Estás seguro de eliminar este trabajo? Se perderán los entregables y el historial de pagos asociados.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#777777]/20">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Sí, Eliminar Proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Payment Modal */}
      {paymentModalProjectId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Registrar Pago / Cobro
                </h3>
              </div>
              <button
                onClick={() => setPaymentModalProjectId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monto a Registrar ($ ARS) *
                </label>
                <input
                  type="text"
                  value={paymentAmountInput}
                  onChange={e => setPaymentAmountInput(e.target.value)}
                  placeholder="Ej: 500.000"
                  required
                  className="w-full text-sm font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                />
                <span className="text-xs text-emerald-600 font-semibold mt-1 block">
                  {formatARS(parseARS(paymentAmountInput))}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medio de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Comentarios o comprobante
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Ej: Comprobante Nº 984128"
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPaymentModalProjectId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
