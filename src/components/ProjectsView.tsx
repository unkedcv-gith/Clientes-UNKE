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
  GitMerge,
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
        monthlyBillingDay: formType === 'mantenimiento' || formType === 'hibrido' ? Number(formMonthlyBillingDay) : undefined,
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
        monthlyBillingDay: formType === 'mantenimiento' || formType === 'hibrido' ? Number(formMonthlyBillingDay) : undefined,
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
    return projects
      .filter(project => {
        const matchSearch =
          project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          project.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchStatus = statusFilter === 'all' || project.status === statusFilter;
        const matchType = typeFilter === 'all' || project.type === typeFilter;

        return matchSearch && matchStatus && matchType;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [projects, searchTerm, statusFilter, typeFilter]);

  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            Proyectos
          </h1>
        </div>
        <button
          onClick={handleOpenCreate}
          className="bg-[#34877c] text-white px-4 py-2.5 rounded-xl font-bold transition-all"
        >
          Nuevo Proyecto
        </button>
      </div>

      <div className="mb-6 flex gap-4">
        <input
          type="text"
          placeholder="Buscar..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="flex-1 bg-[#141414] border border-[#777777]/20 rounded-xl px-4 py-2 text-white"
        />
      </div>

      <div className="space-y-4">
        {filteredProjects.map(project => (
          <div key={project.id} className="bg-[#202020] border border-[#777777]/20 rounded-2xl p-4 flex justify-between items-center">
            <div>
              <div className="font-bold text-white">{project.title}</div>
              <div className="text-sm text-[#888888]">{project.clientName} - {project.type}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleOpenPaymentModal(project.id)} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm">Pago</button>
              <button onClick={() => handleOpenEdit(project)} className="px-3 py-1 bg-[#141414] text-white border border-[#777777]/20 rounded-lg text-sm">Editar</button>
              <button onClick={() => handleDelete(project)} className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-sm">Eliminar</button>
            </div>
          </div>
        ))}
      </div>

      {projectToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#202020] rounded-2xl p-6 border border-rose-500/30 text-white">
            <h3 className="text-lg font-bold">¿Eliminar Proyecto?</h3>
            <p className="mt-2 text-sm text-slate-300">¿Estás seguro que deseas eliminar {projectToDelete.title}?</p>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setProjectToDelete(null)} className="px-4 py-2 bg-[#141414] rounded-lg">Cancelar</button>
              <button onClick={confirmDeleteProject} className="px-4 py-2 bg-rose-600 rounded-lg">Sí, Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Basic Edit/Create Modal (simplified for now to avoid massive code rewrite) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#202020] rounded-2xl p-6 border border-[#777777]/20 text-white max-w-2xl w-full">
            <h3 className="text-lg font-bold mb-4">{editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}</h3>
            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Título</label>
                <input required value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full bg-[#141414] border border-[#777777]/20 rounded-lg p-2" />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-[#141414] rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-[#34877c] rounded-lg">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paymentModalProjectId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#202020] rounded-2xl p-6 border border-[#777777]/20 text-white max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Registrar Pago</h3>
            <form onSubmit={handleSaveQuickPayment} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Monto a registrar</label>
                <input required value={paymentAmountInput} onChange={e => setPaymentAmountInput(e.target.value)} className="w-full bg-[#141414] border border-[#777777]/20 rounded-lg p-2" />
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setPaymentModalProjectId(null)} className="px-4 py-2 bg-[#141414] rounded-lg">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 rounded-lg">Guardar Pago</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
