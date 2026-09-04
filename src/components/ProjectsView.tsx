import React, { useState, useMemo, useEffect } from 'react';
import { useStudio } from '../context/StudioContext';
import { Project, ProjectStatus, ProjectType, PaymentStatus, Deliverable } from '../types';
import { formatARS, formatDateAR, getDeadlineBadge, generateId, parseARS } from '../utils/currency';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  Repeat,
  Layers,
  ChevronDown,
  ChevronUp,
  User,
  X,
  CreditCard,
  Tag,
  Check,
  CheckSquare,
  Square,
  Sparkles,
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ProjectsViewProps {
  selectedProjectId?: string | null;
  onClearSelectedProject?: () => void;
  openCreateTrigger?: number;
}

const KANBAN_COLUMNS: { status: ProjectStatus; label: string; color: string }[] = [
  { status: 'prospecto', label: 'Prospecto', color: 'border-amber-500/40 text-amber-400' },
  { status: 'en_progreso', label: 'En Progreso', color: 'border-blue-500/40 text-blue-400' },
  { status: 'en_revision', label: 'En Revisión', color: 'border-purple-500/40 text-purple-400' },
  { status: 'completado', label: 'Completado', color: 'border-emerald-500/40 text-emerald-400' },
  { status: 'entregado', label: 'Entregado', color: 'border-teal-500/40 text-teal-400' },
];

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  selectedProjectId,
  onClearSelectedProject,
  openCreateTrigger,
}) => {
  const {
    projects,
    clients,
    addClient,
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

  // Expanded project cards in list view
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [detailProject, setDetailProject] = useState<Project | null>(null);

  // Quick Payment Modal
  const [paymentModalProjectId, setPaymentModalProjectId] = useState<string | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Transferencia Bancaria');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Form State for Create/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formNewClientName, setFormNewClientName] = useState('');
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
  useEffect(() => {
    if (selectedProjectId) {
      const proj = projects.find(p => p.id === selectedProjectId);
      if (proj) {
        handleOpenEdit(proj);
      }
    }
  }, [selectedProjectId, projects]);

  // Open create modal if openCreateTrigger changes
  useEffect(() => {
    if (openCreateTrigger && openCreateTrigger > 0) {
      handleOpenCreate();
    }
  }, [openCreateTrigger]);

  const toggleExpand = (id: string) => {
    setExpandedProjects(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleOpenCreate = () => {
    setEditingProject(null);
    setFormTitle('');
    setFormDescription('');
    setFormClientId(clients[0]?.id || 'new');
    setFormNewClientName('');
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
    setFormNewClientName('');
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
    let effectiveClientId = formClientId;
    let effectiveClientName = '';

    if (formClientId === 'new' || (!formClientId && formNewClientName.trim())) {
      const createdClient = addClient({
        name: formNewClientName.trim() || 'Nuevo Cliente',
        company: '',
        email: '',
        phone: '',
        notes: 'Creado desde carga de proyecto',
        status: 'activo',
        hasWeb: false,
      });
      effectiveClientId = createdClient.id;
      effectiveClientName = createdClient.name;
    } else {
      const client = clients.find(c => c.id === formClientId);
      effectiveClientName = client ? client.name : formNewClientName.trim() || 'Cliente General';
    }

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
        clientId: effectiveClientId,
        clientName: effectiveClientName,
        type: formType,
        status: formStatus,
        paymentStatus: formPaymentStatus,
        totalAmount,
        paidAmount,
        monthlyBillingDay:
          formType === 'mantenimiento' || formType === 'hibrido'
            ? Number(formMonthlyBillingDay)
            : undefined,
        startDate: formStartDate,
        deliveryDate: formDeliveryDate,
        tags,
        deliverables: formDeliverables,
      });
    } else {
      addProject({
        title: formTitle,
        description: formDescription,
        clientId: effectiveClientId,
        clientName: effectiveClientName,
        type: formType,
        status: formStatus,
        paymentStatus: formPaymentStatus,
        totalAmount,
        paidAmount,
        monthlyBillingDay:
          formType === 'mantenimiento' || formType === 'hibrido'
            ? Number(formMonthlyBillingDay)
            : undefined,
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
    if (detailProject?.id === projectToDelete.id) {
      setDetailProject(null);
    }
    setProjectToDelete(null);
  };

  const handleToggleDeliverableWithCelebration = (
    projectId: string,
    delId: string,
    currentDone: boolean
  ) => {
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

  // Filtered and Sorted list (Newest to Oldest)
  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        const matchSearch =
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          project.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchStatus = statusFilter === 'all' || project.status === statusFilter;
        const matchType = typeFilter === 'all' || project.type === typeFilter;
        const matchPayment = paymentFilter === 'all' || project.paymentStatus === paymentFilter;

        return matchSearch && matchStatus && matchType && matchPayment;
      })
      .sort((a, b) => {
        // Orden más reciente al más viejo según createdAt (o startDate como fallback)
        const dateA = new Date(a.createdAt || a.startDate).getTime();
        const dateB = new Date(b.createdAt || b.startDate).getTime();
        return dateB - dateA;
      });
  }, [projects, searchTerm, statusFilter, typeFilter, paymentFilter]);

  // Overall financial calculations
  const totalActiveAmount = useMemo(() => {
    return filteredProjects.reduce((sum, p) => sum + p.totalAmount, 0);
  }, [filteredProjects]);

  const totalCollectedAmount = useMemo(() => {
    return filteredProjects.reduce((sum, p) => sum + p.paidAmount, 0);
  }, [filteredProjects]);

  const totalPendingBalance = useMemo(() => {
    return Math.max(0, totalActiveAmount - totalCollectedAmount);
  }, [totalActiveAmount, totalCollectedAmount]);

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'prospecto':
        return { label: 'Prospecto', class: 'bg-amber-950/60 text-amber-400 border-amber-800/60' };
      case 'en_progreso':
        return { label: 'En Progreso', class: 'bg-blue-950/60 text-blue-400 border-blue-800/60' };
      case 'en_revision':
        return { label: 'En Revisión', class: 'bg-purple-950/60 text-purple-400 border-purple-800/60' };
      case 'completado':
        return { label: 'Completado', class: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60' };
      case 'entregado':
        return { label: 'Entregado', class: 'bg-teal-950/60 text-teal-400 border-teal-800/60' };
      case 'pausado':
        return { label: 'Pausado', class: 'bg-slate-800/60 text-slate-400 border-slate-700/60' };
      default:
        return { label: status, class: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  const getPaymentBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'pagado':
      case 'al_dia':
        return { label: status === 'pagado' ? 'Pagado' : 'Al Día', class: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50' };
      case 'parcial':
        return { label: 'Cobro Parcial', class: 'bg-amber-950/50 text-amber-400 border-amber-800/50' };
      case 'pendiente':
        return { label: 'Cobro Pendiente', class: 'bg-rose-950/50 text-rose-400 border-rose-800/50' };
      case 'facturado':
        return { label: 'Facturado', class: 'bg-cyan-950/50 text-cyan-400 border-cyan-800/50' };
      case 'en_mora':
        return { label: 'En Mora', class: 'bg-rose-950/80 text-rose-300 border-rose-700' };
      default:
        return { label: status, class: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6 pb-12 text-white animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-[#34877c]" />
            <span>Proyectos & Entregas</span>
          </h1>
          <p className="text-xs text-[#888888] mt-0.5">
            Gestión de alcance, entregables paso a paso, plazos de entrega y estado de cobros (ordenados del más reciente al más viejo).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Toggle */}
          <div className="flex bg-[#141414] p-1 rounded-xl border border-[#777777]/25">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#34877c] text-white shadow-xs'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              Lista Detallada
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-[#34877c] text-white shadow-xs'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              Tablero Kanban
            </button>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center justify-center gap-2 bg-[#34877c] hover:bg-[#2a6d63] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#202020] p-4 rounded-2xl border border-[#777777]/20 shadow-md">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">Total Proyectos</div>
          <div className="text-xl font-black text-white mt-1">{filteredProjects.length}</div>
          <div className="text-[10px] text-[#777777] mt-0.5">En esta vista</div>
        </div>
        <div className="bg-[#202020] p-4 rounded-2xl border border-[#777777]/20 shadow-md">
          <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider">Total Valuado</div>
          <div className="text-xl font-black text-white mt-1">{formatARS(totalActiveAmount)}</div>
          <div className="text-[10px] text-[#777777] mt-0.5">Monto global</div>
        </div>
        <div className="bg-[#202020] p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 shadow-md">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Total Cobrado</div>
          <div className="text-xl font-black text-emerald-400 mt-1">{formatARS(totalCollectedAmount)}</div>
          <div className="text-[10px] text-emerald-300/60 mt-0.5">Ingresado al estudio</div>
        </div>
        <div className="bg-[#202020] p-4 rounded-2xl border border-amber-500/20 bg-amber-950/10 shadow-md">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Saldo por Cobrar</div>
          <div className="text-xl font-black text-amber-400 mt-1">{formatARS(totalPendingBalance)}</div>
          <div className="text-[10px] text-amber-300/60 mt-0.5">Pendiente de cobro</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#202020] p-3.5 sm:p-4 rounded-2xl border border-[#777777]/20 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, cliente, entregable, alcance o etiquetas..."
            className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-white placeholder-[#777777] outline-none focus:border-[#34877c] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-slate-200 outline-none focus:border-[#34877c]"
          >
            <option value="all">Todos los Estados</option>
            <option value="en_progreso">En Progreso</option>
            <option value="en_revision">En Revisión</option>
            <option value="prospecto">Prospectos</option>
            <option value="completado">Completados</option>
            <option value="entregado">Entregados</option>
            <option value="pausado">Pausados</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-slate-200 outline-none focus:border-[#34877c]"
          >
            <option value="all">Tipo (Todos)</option>
            <option value="proyecto">Trabajo Puntual</option>
            <option value="mantenimiento">Abono Mensual</option>
            <option value="hibrido">Híbrido (Puntual + Abono)</option>
          </select>

          {/* Payment Filter */}
          <select
            value={paymentFilter}
            onChange={e => setPaymentFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-slate-200 outline-none focus:border-[#34877c]"
          >
            <option value="all">Cobro (Todos)</option>
            <option value="pendiente">Pendiente</option>
            <option value="parcial">Parcial</option>
            <option value="pagado">Pagado</option>
            <option value="al_dia">Al Día</option>
            <option value="facturado">Facturado</option>
            <option value="en_mora">En Mora</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'list' ? (
        /* ================= LIST VIEW ================= */
        <div className="space-y-4">
          {filteredProjects.length === 0 ? (
            <div className="bg-[#202020] border border-[#777777]/20 rounded-2xl p-12 text-center text-[#777777] shadow-lg">
              <FolderKanban className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#555555]" />
              <p className="text-sm font-medium text-[#888888]">No se encontraron proyectos con los filtros aplicados.</p>
              <button
                onClick={handleOpenCreate}
                className="mt-3 text-xs text-[#34877c] hover:underline font-bold"
              >
                + Crear un nuevo proyecto
              </button>
            </div>
          ) : (
            filteredProjects.map(project => {
              const deadline = getDeadlineBadge(project.deliveryDate, project.status);
              const pendingBal = Math.max(0, project.totalAmount - project.paidAmount);
              const completedDel = project.deliverables.filter(d => d.done).length;
              const totalDel = project.deliverables.length;
              const percentDel = totalDel > 0 ? Math.round((completedDel / totalDel) * 100) : 0;
              const isExpanded = expandedProjects[project.id] ?? true; // Default expanded so content is seen!

              const statusBadge = getStatusBadge(project.status);
              const paymentBadge = getPaymentBadge(project.paymentStatus);

              return (
                <div
                  key={project.id}
                  className="bg-[#202020] border border-[#777777]/20 rounded-2xl p-5 shadow-lg hover:border-[#34877c]/40 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[#777777]/15">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] font-mono font-bold text-[#34877c] bg-[#34877c]/10 px-2 py-0.5 rounded-md border border-[#34877c]/30">
                          {project.code || 'PRJ'}
                        </span>
                        <h2 className="text-lg font-bold text-white tracking-tight">
                          {project.title}
                        </h2>
                        {project.type === 'mantenimiento' && (
                          <span className="text-[10px] uppercase font-bold text-teal-300 bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-800/60 flex items-center gap-1">
                            <Repeat className="w-3 h-3" /> Abono Mensual
                          </span>
                        )}
                        {project.type === 'hibrido' && (
                          <span className="text-[10px] uppercase font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/60 flex items-center gap-1">
                            <Layers className="w-3 h-3" /> Puntual + Abono
                          </span>
                        )}
                        {project.type === 'proyecto' && (
                          <span className="text-[10px] uppercase font-bold text-slate-300 bg-slate-800/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                            Puntual
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-[#888888] flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-200">
                          <User className="w-3.5 h-3.5 text-[#34877c]" />
                          {project.clientName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-[#aaaaaa]">
                          <Calendar className="w-3.5 h-3.5 text-[#777777]" />
                          Inicio: {formatDateAR(project.startDate)}
                        </span>
                        {project.deliveryDate && (
                          <>
                            <span>•</span>
                            <span className={`px-2 py-0.5 rounded-md text-[11px] border flex items-center gap-1 ${deadline.colorClass}`}>
                              <Clock className="w-3 h-3" />
                              Entrega: {formatDateAR(project.deliveryDate)} ({deadline.label})
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status & Action Buttons */}
                    <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${statusBadge.class}`}>
                        {statusBadge.label}
                      </span>
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${paymentBadge.class}`}>
                        {paymentBadge.label}
                      </span>

                      <div className="flex items-center gap-1.5 ml-2">
                        <button
                          onClick={() => handleOpenPaymentModal(project.id)}
                          className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          title="Registrar cobro"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Cobro</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(project)}
                          className="p-1.5 bg-[#141414] hover:bg-[#282828] text-slate-200 hover:text-white border border-[#777777]/25 rounded-xl transition-colors cursor-pointer"
                          title="Editar proyecto"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          className="p-1.5 bg-[#141414] hover:bg-rose-950/40 text-[#aaaaaa] hover:text-rose-400 border border-[#777777]/25 hover:border-rose-800 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleExpand(project.id)}
                          className="p-1.5 bg-[#141414] hover:bg-[#282828] text-[#aaaaaa] hover:text-white border border-[#777777]/25 rounded-xl transition-colors cursor-pointer"
                          title={isExpanded ? 'Contraer contenido' : 'Expandir contenido'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Body: Content & Deliverables (Visible!) */}
                  {isExpanded && (
                    <div className="pt-4 space-y-4 animate-fadeIn">
                      {/* Description / Content Section */}
                      {project.description ? (
                        <div className="bg-[#141414]/70 p-3.5 rounded-xl border border-[#777777]/15">
                          <div className="text-[11px] uppercase font-bold text-[#34877c] mb-1 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" />
                            Contenido y Alcance del Proyecto
                          </div>
                          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-line">
                            {project.description}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-[#666666] italic bg-[#141414]/40 p-2.5 rounded-xl border border-[#777777]/10">
                          Sin descripción o alcance cargado. Podés editar el proyecto para detallar el alcance.
                        </div>
                      )}

                      {/* Deliverables Checklist Section */}
                      <div className="bg-[#181818] p-4 rounded-xl border border-[#777777]/15 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-[#34877c]" />
                              Entregables & Tareas ({completedDel}/{totalDel})
                            </span>
                          </div>
                          <span className="text-xs font-bold text-[#34877c]">
                            {percentDel}% completado
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden border border-[#777777]/20">
                          <div
                            className="h-full bg-gradient-to-r from-[#34877c] to-[#44a598] rounded-full transition-all duration-300"
                            style={{ width: `${percentDel}%` }}
                          />
                        </div>

                        {/* Deliverables items with interactive checkbox */}
                        {project.deliverables && project.deliverables.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                            {project.deliverables.map(del => (
                              <button
                                key={del.id}
                                type="button"
                                onClick={() => handleToggleDeliverableWithCelebration(project.id, del.id, del.done)}
                                className={`flex items-start gap-2.5 p-2 rounded-lg text-left transition-all border cursor-pointer ${
                                  del.done
                                    ? 'bg-[#141414]/60 border-emerald-900/40 text-[#888888]'
                                    : 'bg-[#141414] border-[#777777]/20 text-slate-200 hover:border-[#34877c]/50'
                                }`}
                              >
                                {del.done ? (
                                  <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="w-4 h-4 text-[#777777] shrink-0 mt-0.5" />
                                )}
                                <span className={`text-xs leading-snug ${del.done ? 'line-through text-[#777777]' : 'font-medium'}`}>
                                  {del.title}
                                </span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#777777] italic">No hay entregables listados en este proyecto.</p>
                        )}
                      </div>

                      {/* Financials & Tags Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                        <div className="bg-[#141414] p-3 rounded-xl border border-[#777777]/15">
                          <span className="text-[10px] text-[#888888] uppercase font-bold block">
                            {project.type === 'mantenimiento' ? 'Abono Mensual' : 'Monto Total'}
                          </span>
                          <span className="text-sm font-bold text-white font-mono">
                            {formatARS(project.totalAmount)}
                          </span>
                          {project.monthlyBillingDay && (
                            <span className="text-[10px] text-[#34877c] block mt-0.5">
                              Factura el día {project.monthlyBillingDay} de c/mes
                            </span>
                          )}
                        </div>

                        <div className="bg-[#141414] p-3 rounded-xl border border-emerald-900/30">
                          <span className="text-[10px] text-emerald-400 uppercase font-bold block">Monto Cobrado</span>
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            {formatARS(project.paidAmount)}
                          </span>
                          <span className="text-[10px] text-[#777777] block mt-0.5">
                            {project.paymentsHistory?.length || 0} pagos registrados
                          </span>
                        </div>

                        <div className="bg-[#141414] p-3 rounded-xl border border-amber-900/30">
                          <span className="text-[10px] text-amber-400 uppercase font-bold block">Saldo Pendiente</span>
                          <span className="text-sm font-bold text-amber-400 font-mono">
                            {formatARS(pendingBal)}
                          </span>
                          <span className="text-[10px] text-[#777777] block mt-0.5">
                            {pendingBal === 0 ? 'Saldado completamente' : 'Resta cobrar'}
                          </span>
                        </div>
                      </div>

                      {/* Tags & Payment History Details */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                        {/* Tags */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Tag className="w-3.5 h-3.5 text-[#777777]" />
                          {project.tags && project.tags.length > 0 ? (
                            project.tags.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-[#141414] text-[#aaaaaa] rounded-md text-[11px] border border-[#777777]/20"
                              >
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#666666] text-[11px]">Sin etiquetas</span>
                          )}
                        </div>

                        {/* Payment history count / trigger */}
                        {project.paymentsHistory && project.paymentsHistory.length > 0 && (
                          <div className="text-[11px] text-[#888888]">
                            Último pago: {formatDateAR(project.paymentsHistory[0]?.date)} ({formatARS(project.paymentsHistory[0]?.amount)})
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* ================= KANBAN VIEW ================= */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map(col => {
            const columnProjects = filteredProjects.filter(p => p.status === col.status);
            return (
              <div
                key={col.status}
                className="bg-[#202020] rounded-2xl p-3.5 border border-[#777777]/20 shadow-lg flex flex-col min-h-[500px]"
              >
                {/* Column Header */}
                <div className={`flex items-center justify-between pb-3 mb-3 border-b ${col.color}`}>
                  <h3 className="text-xs font-bold uppercase tracking-wider">{col.label}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#141414] text-white font-mono font-bold">
                    {columnProjects.length}
                  </span>
                </div>

                {/* Column Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto">
                  {columnProjects.length === 0 ? (
                    <div className="p-6 text-center text-[#666666] text-xs italic">
                      Sin proyectos aquí
                    </div>
                  ) : (
                    columnProjects.map(proj => {
                      const completedDel = proj.deliverables.filter(d => d.done).length;
                      const totalDel = proj.deliverables.length;
                      const pendingBal = Math.max(0, proj.totalAmount - proj.paidAmount);

                      return (
                        <div
                          key={proj.id}
                          className="bg-[#141414] p-3.5 rounded-xl border border-[#777777]/25 hover:border-[#34877c] transition-all space-y-2 group shadow-md"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[10px] font-mono text-[#34877c] font-bold">
                              {proj.code}
                            </span>
                            <span className="text-[10px] text-slate-300 font-medium truncate max-w-[120px]">
                              {proj.clientName}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white line-clamp-2">
                            {proj.title}
                          </h4>

                          {/* Description snippet if any */}
                          {proj.description && (
                            <p className="text-[11px] text-[#888888] line-clamp-2">
                              {proj.description}
                            </p>
                          )}

                          {/* Progress */}
                          {totalDel > 0 && (
                            <div className="space-y-1 pt-1">
                              <div className="flex justify-between text-[10px] text-[#888888]">
                                <span>Entregables</span>
                                <span>{completedDel}/{totalDel}</span>
                              </div>
                              <div className="w-full h-1 bg-[#222222] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#34877c] rounded-full"
                                  style={{ width: `${(completedDel / totalDel) * 100}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Financial snippet */}
                          <div className="flex justify-between items-center text-[11px] pt-2 border-t border-[#777777]/15">
                            <span className="font-bold text-white font-mono">{formatARS(proj.totalAmount)}</span>
                            {pendingBal > 0 ? (
                              <span className="text-[10px] text-amber-400 font-semibold">Resta {formatARS(pendingBal)}</span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 font-semibold">Pagado</span>
                            )}
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              onClick={() => handleOpenPaymentModal(proj.id)}
                              className="p-1 text-emerald-400 hover:bg-emerald-950/40 rounded transition-colors"
                              title="Registrar cobro"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(proj)}
                              className="p-1 text-slate-300 hover:bg-[#282828] rounded transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(proj)}
                              className="p-1 text-rose-400 hover:bg-rose-950/40 rounded transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= FULL CREATE / EDIT PROJECT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#202020] rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#777777]/25 text-white max-h-[90vh] overflow-y-auto animate-fadeIn space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#777777]/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#34877c]/20 text-[#34877c] rounded-xl">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
                  </h3>
                  <p className="text-xs text-[#888888]">
                    {editingProject ? `Modificando ${editingProject.code}` : 'Configuración de alcance, cliente y plazos'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 text-[#888888] hover:text-white hover:bg-[#141414] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Título del Proyecto *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  placeholder="Ej: Rediseño de Identidad & Manual de Marca"
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#34877c] transition-colors"
                />
              </div>

              {/* Description / Contenido del Proyecto */}
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Contenido & Alcance del Proyecto
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Describí los entregables detallados, requerimientos técnicos, accesos o especificaciones acordadas con el cliente..."
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#34877c] transition-colors leading-relaxed"
                />
              </div>

              {/* Client Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                    Cliente Asociado *
                  </label>
                  <select
                    value={formClientId}
                    onChange={e => setFormClientId(e.target.value)}
                    className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  >
                    <option value="new">+ Cargar Nuevo Cliente</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {formClientId === 'new' && (
                  <div>
                    <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                      Nombre del Nuevo Cliente *
                    </label>
                    <input
                      type="text"
                      required
                      value={formNewClientName}
                      onChange={e => setFormNewClientName(e.target.value)}
                      placeholder="Ej: Inmobiliaria Delta"
                      className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                )}
              </div>

              {/* Type, Status and Payment Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                    Tipo de Proyecto
                  </label>
                  <select
                    value={formType}
                    onChange={e => setFormType(e.target.value as ProjectType)}
                    className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  >
                    <option value="proyecto">Trabajo Puntual</option>
                    <option value="mantenimiento">Abono Mensual</option>
                    <option value="hibrido">Híbrido (Puntual + Abono)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                    Estado del Proyecto
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as ProjectStatus)}
                    className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  >
                    <option value="en_progreso">En Progreso</option>
                    <option value="en_revision">En Revisión</option>
                    <option value="prospecto">Prospecto</option>
                    <option value="completado">Completado</option>
                    <option value="entregado">Entregado</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                    Estado de Cobro
                  </label>
                  <select
                    value={formPaymentStatus}
                    onChange={e => setFormPaymentStatus(e.target.value as PaymentStatus)}
                    className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="parcial">Parcial</option>
                    <option value="pagado">Pagado</option>
                    <option value="al_dia">Al Día</option>
                    <option value="facturado">Facturado</option>
                    <option value="en_mora">En Mora</option>
                  </select>
                </div>
              </div>

              {/* Amounts and Billing Day */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                    {formType === 'mantenimiento' ? 'Monto Mensual (ARS) *' : 'Monto Total (ARS) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formTotalAmount}
                    onChange={e => setFormTotalAmount(e.target.value)}
                    placeholder="Ej: 450.000"
                    className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                    Cobrado Hasta Ahora (ARS)
                  </label>
                  <input
                    type="text"
                    value={formPaidAmount}
                    onChange={e => setFormPaidAmount(e.target.value)}
                    placeholder="Ej: 200.000"
                    className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  />
                </div>

                {(formType === 'mantenimiento' || formType === 'hibrido') && (
                  <div>
                    <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                      Día Cobro Mensual (1-31)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={formMonthlyBillingDay}
                      onChange={e => setFormMonthlyBillingDay(Number(e.target.value))}
                      className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                    />
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                    Fecha de Inicio
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                    Fecha Límite / Entrega
                  </label>
                  <input
                    type="date"
                    value={formDeliveryDate}
                    onChange={e => setFormDeliveryDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  />
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={formTags}
                  onChange={e => setFormTags(e.target.value)}
                  placeholder="Branding, Identidad, Web, Packaging"
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                />
              </div>

              {/* Deliverables Builder */}
              <div className="bg-[#141414] p-4 rounded-2xl border border-[#777777]/20 space-y-3">
                <label className="block text-xs font-bold text-[#34877c] uppercase tracking-wider">
                  Checklist de Entregables
                </label>

                <div className="flex gap-2">
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
                    placeholder="Nuevo entregable (ej: Entrega de logotipo en curvas y PNG)"
                    className="flex-1 bg-[#202020] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                  />
                  <button
                    type="button"
                    onClick={handleAddDeliverable}
                    className="px-3 py-2 bg-[#34877c] hover:bg-[#2b7268] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Agregar
                  </button>
                </div>

                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {formDeliverables.map((del, idx) => (
                    <div
                      key={del.id}
                      className="flex items-center justify-between gap-2 p-2 bg-[#202020] rounded-xl border border-[#777777]/15 text-xs"
                    >
                      <span className="text-slate-200">
                        <strong className="text-[#34877c] mr-1.5">{idx + 1}.</strong> {del.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(del.id)}
                        className="text-[#888888] hover:text-rose-400 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#777777]/20">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= QUICK PAYMENT MODAL ================= */}
      {paymentModalProjectId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#202020] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-emerald-500/30 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#777777]/20">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/60">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Registrar Cobro</h3>
                  <p className="text-xs text-[#888888]">Ingreso directo a la cuenta del estudio</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalProjectId(null)}
                className="p-1.5 text-[#888888] hover:text-white rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickPayment} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Monto a Cobrar (ARS) *
                </label>
                <input
                  type="text"
                  required
                  value={paymentAmountInput}
                  onChange={e => setPaymentAmountInput(e.target.value)}
                  placeholder="Ej: 150.000"
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-4 py-2.5 text-sm font-bold text-emerald-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Método de Pago
                </label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                >
                  <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                  <option value="Mercado Pago">Mercado Pago</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Notas del Cobro (opcional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Ej: Adelanto del 50% por inicio de tareas"
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#34877c]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#777777]/20">
                <button
                  type="button"
                  onClick={() => setPaymentModalProjectId(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#202020] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-500/30 space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-950/60 rounded-xl border border-rose-800/60 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Proyecto?</h3>
                <p className="text-xs text-[#888888]">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              ¿Estás seguro que deseas eliminar el proyecto{' '}
              <strong className="text-white font-bold">"{projectToDelete.title}"</strong> ({projectToDelete.code})? Se perderán los entregables y el historial de pagos registrado.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#777777]/20">
              <button
                type="button"
                onClick={() => setProjectToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
