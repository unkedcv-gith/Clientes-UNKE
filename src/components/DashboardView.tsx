import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { PostItColor } from '../types';
import { formatARS, formatDateAR, getDeadlineBadge } from '../utils/currency';
import {
  FolderKanban,
  Repeat,
  DollarSign,
  Calendar,
  Plus,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  StickyNote,
  Activity,
  Users,
  ShieldCheck,
  Zap,
  FilePlus,
  FolderPlus,
  Trash2,
  Pin,
} from 'lucide-react';

interface DashboardViewProps {
  onNewProject: () => void;
  onNewBudget: () => void;
  onNewClient: () => void;
  onSelectProject: (projectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNewProject,
  onNewBudget,
  onNewClient,
  onSelectProject,
}) => {
  const {
    projects,
    budgets,
    clients,
    team,
    currentUser,
    activePresences,
    postIts,
    auditLogs,
    setActiveTab,
    toggleDeliverable,
    toggleMonthlyPayment,
    addPostIt,
    deletePostIt,
  } = useStudio();

  // Quick note input state
  const [showQuickNoteForm, setShowQuickNoteForm] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [quickNoteTitle, setQuickNoteTitle] = useState('');
  const [quickNoteColor, setQuickNoteColor] = useState<PostItColor>('yellow');

  // Filter for bento project table
  const [projectTableFilter, setProjectTableFilter] = useState<'activos' | 'abonos' | 'todos'>('activos');

  // Calculations
  const activeProjects = projects.filter(
    p => p.status === 'en_progreso' || p.status === 'en_revision' || p.status === 'prospecto'
  );

  const oneTimeProjects = activeProjects.filter(p => p.type === 'proyecto');
  const retainers = projects.filter(p => p.type === 'mantenimiento' && p.status !== 'pausado');

  // MRR (Monthly Recurring Revenue from retainers)
  const monthlyRecurringRevenue = retainers.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

  // Total Pending Collection (ARS)
  const pendingCollection = projects.reduce((acc, curr) => {
    if (curr.type === 'proyecto') {
      return acc + Math.max(0, curr.totalAmount - curr.paidAmount);
    } else {
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (curr.lastMonthlyPaymentDate !== currentMonth) {
        return acc + curr.totalAmount;
      }
      return acc;
    }
  }, 0);

  // Filtered projects for table
  const tableProjects = projects.filter(p => {
    if (projectTableFilter === 'activos') {
      return p.status === 'en_progreso' || p.status === 'en_revision';
    }
    if (projectTableFilter === 'abonos') {
      return p.type === 'mantenimiento';
    }
    return true;
  }).slice(0, 6);

  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g. "2026-08"

  const handleQuickAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNoteText.trim()) return;
    addPostIt({
      title: quickNoteTitle.trim() || 'NOTA RÁPIDA',
      content: quickNoteText.trim(),
      color: quickNoteColor,
      pinned: true,
    });
    setQuickNoteText('');
    setQuickNoteTitle('');
    setShowQuickNoteForm(false);
  };

  const getPostItBgColor = (color: string) => {
    switch (color) {
      case 'yellow':
        return 'bg-[#fef08a] dark:bg-[#713f12]/90 text-amber-950 dark:text-amber-100 border-[#facc15] dark:border-[#ca8a04] shadow-amber-900/10';
      case 'teal':
        return 'bg-[#99f6e4] dark:bg-[#134e4a]/90 text-teal-950 dark:text-teal-100 border-[#2dd4bf] dark:border-[#0d9488] shadow-teal-900/10';
      case 'coral':
      case 'pink':
        return 'bg-[#fecdd3] dark:bg-[#881337]/90 text-rose-950 dark:text-rose-100 border-[#fb7185] dark:border-[#e11d48] shadow-rose-900/10';
      case 'purple':
        return 'bg-[#e9d5ff] dark:bg-[#581c87]/90 text-purple-950 dark:text-purple-100 border-[#c084fc] dark:border-[#9333ea] shadow-purple-900/10';
      case 'mint':
      case 'green':
        return 'bg-[#bbf7d0] dark:bg-[#14532d]/90 text-emerald-950 dark:text-emerald-100 border-[#4ade80] dark:border-[#16a34a] shadow-emerald-900/10';
      case 'blue':
        return 'bg-[#bae6fd] dark:bg-[#0c4a6e]/90 text-sky-950 dark:text-sky-100 border-[#38bdf8] dark:border-[#0284c7] shadow-sky-900/10';
      default:
        return 'bg-[#fef08a] dark:bg-[#713f12]/90 text-amber-950 dark:text-amber-100 border-[#facc15] dark:border-[#ca8a04] shadow-amber-900/10';
    }
  };

  return (
    <div className="space-y-4">
      {/* Bento Grid Top Layer (12 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Tile 1: Hero Facturación Mensual / MRR (Span 4) */}
        <div className="md:col-span-4 bg-[#34877c] rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden shadow-lg min-h-[260px]">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-lg pointer-events-none"></div>

          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-100 bg-black/20 px-2.5 py-1 rounded-full backdrop-blur-xs">
                Abonos Mensuales
              </span>
              <div className="flex items-center space-x-1.5 bg-black/25 px-2.5 py-1 rounded-full text-[10px] text-white font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>En vivo</span>
              </div>
            </div>

            <div className="mt-4">
              <div className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
                {formatARS(monthlyRecurringRevenue)}
              </div>
              <div className="text-xs text-emerald-100/90 font-medium mt-1">
                Ingreso recurrente mensual en abonos activos
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/20 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-[11px] text-emerald-100/80 block">Abonos activos</span>
              <span className="font-bold text-white text-sm">{retainers.length} clientes</span>
            </div>
            <div>
              <span className="text-[11px] text-emerald-100/80 block">Trabajos puntuales</span>
              <span className="font-bold text-white text-sm">{oneTimeProjects.length} proyectos</span>
            </div>
          </div>
        </div>

        {/* Bento Tile 2: Trabajos en Curso & Estado (Span 8) */}
        <div className="md:col-span-8 bg-[#202020] rounded-3xl p-5 sm:p-6 border border-[#777777]/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#34877c]/20 text-[#34877c] flex items-center justify-center font-bold">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                    Trabajos en Curso
                  </h2>
                  <p className="text-xs text-[#888888]">
                    Control operativo de entregas y estados de cobro
                  </p>
                </div>
              </div>

              {/* Table Filter Tabs */}
              <div className="flex items-center space-x-1 bg-[#141414] p-1 rounded-xl border border-[#777777]/20 self-start sm:self-center">
                <button
                  onClick={() => setProjectTableFilter('activos')}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    projectTableFilter === 'activos'
                      ? 'bg-[#34877c] text-white shadow-xs'
                      : 'text-[#777777] hover:text-white'
                  }`}
                >
                  Activos ({activeProjects.length})
                </button>
                <button
                  onClick={() => setProjectTableFilter('abonos')}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    projectTableFilter === 'abonos'
                      ? 'bg-[#34877c] text-white shadow-xs'
                      : 'text-[#777777] hover:text-white'
                  }`}
                >
                  Abonos ({retainers.length})
                </button>
                <button
                  onClick={() => setProjectTableFilter('todos')}
                  className={`text-xs px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    projectTableFilter === 'todos'
                      ? 'bg-[#34877c] text-white shadow-xs'
                      : 'text-[#777777] hover:text-white'
                  }`}
                >
                  Todos ({projects.length})
                </button>
              </div>
            </div>

            {/* Compact Bento Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#777777]/15 text-[#777777]">
                    <th className="pb-2 font-semibold">CLIENTE / TRABAJO</th>
                    <th className="pb-2 font-semibold">ENTREGA</th>
                    <th className="pb-2 font-semibold">ESTADO PAGO</th>
                    <th className="pb-2 font-semibold text-right">COBRO / RESTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#777777]/10">
                  {tableProjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#777777]">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FolderKanban className="w-8 h-8 text-[#555555]" />
                          <p className="text-xs text-[#888888] font-medium">
                            No hay proyectos cargados en esta vista.
                          </p>
                          <button
                            onClick={onNewProject}
                            className="text-xs text-[#34877c] hover:underline font-bold"
                          >
                            + Crear el primer proyecto
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tableProjects.map(proj => {
                      const badge = getDeadlineBadge(proj.deliveryDate, proj.status);
                      const isRetainer = proj.type === 'mantenimiento';
                      const isPaid =
                        !isRetainer
                          ? proj.paymentStatus === 'pagado' || (proj.totalAmount > 0 && proj.paidAmount >= proj.totalAmount)
                          : proj.lastMonthlyPaymentDate === currentMonthStr;

                      const hasPartialPayment =
                        !isRetainer &&
                        !isPaid &&
                        proj.paidAmount > 0 &&
                        proj.paidAmount < proj.totalAmount;

                      const remainingAmount = Math.max(0, proj.totalAmount - proj.paidAmount);

                      return (
                        <tr
                          key={proj.id}
                          onClick={() => onSelectProject(proj.id)}
                          className="hover:bg-[#272727] cursor-pointer transition-colors group"
                        >
                          <td className="py-2.5 pr-2">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-white group-hover:text-[#44a598] transition-colors">
                                {proj.clientName}
                              </span>
                              {proj.type === 'mantenimiento' && (
                                <span className="text-[9px] uppercase font-bold text-teal-400 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800">
                                  Abono
                                </span>
                              )}
                            </div>
                            <div className="text-[#888888] truncate max-w-xs">{proj.title}</div>
                          </td>
                          <td className="py-2.5 whitespace-nowrap">
                            <span className={`text-[11px] px-2 py-0.5 rounded-full border ${badge.colorClass}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="py-2.5 whitespace-nowrap">
                            {isRetainer ? (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isPaid
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {isPaid ? 'AL DÍA' : 'PENDIENTE'}
                              </span>
                            ) : hasPartialPayment ? (
                              <div className="inline-flex flex-col items-start">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-cyan-950/80 text-cyan-300 border border-cyan-700">
                                  PARCIAL ({Math.round((proj.paidAmount / proj.totalAmount) * 100)}%)
                                </span>
                              </div>
                            ) : (
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                  isPaid
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                                }`}
                              >
                                {isPaid ? 'PAGADO' : 'PENDIENTE'}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-right whitespace-nowrap">
                            {isRetainer ? (
                              <div>
                                <span className="font-mono font-bold text-white">
                                  {formatARS(proj.totalAmount)}
                                </span>
                                <span className="text-[10px] text-[#777777] block font-mono">/mes</span>
                              </div>
                            ) : hasPartialPayment ? (
                              <div className="space-y-0.5">
                                <div className="text-[11px] font-mono">
                                  <span className="text-emerald-400 font-bold">Cobrado: {formatARS(proj.paidAmount)}</span>
                                </div>
                                <div className="text-[11px] font-mono">
                                  <span className="text-amber-400 font-bold">Resta: {formatARS(remainingAmount)}</span>
                                </div>
                                <div className="text-[10px] font-mono text-[#777777]">
                                  Total: {formatARS(proj.totalAmount)}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <span className="font-mono font-bold text-white">
                                  {formatARS(proj.totalAmount)}
                                </span>
                                {isPaid && proj.paidAmount > 0 && (
                                  <span className="text-[10px] text-emerald-400 block font-mono font-medium">100% cobrado</span>
                                )}
                                {!isPaid && proj.paidAmount === 0 && (
                                  <span className="text-[10px] text-amber-400/80 block font-mono">Sin cobros</span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#777777]/15 flex items-center justify-between">
            <button
              onClick={onNewProject}
              className="flex items-center space-x-1.5 text-xs text-[#34877c] hover:text-[#44a598] font-bold cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Cargar nuevo proyecto</span>
            </button>
            <button
              onClick={() => setActiveTab('proyectos')}
              className="text-xs text-[#888888] hover:text-white flex items-center space-x-1 cursor-pointer"
            >
              <span>Ver todos los proyectos</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bento Grid Middle Layer (3 equal columns on Desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Bento Tile 3: Muro de Notas / Post-It (Span 4) */}
        <div className="md:col-span-4 bg-[#202020] rounded-3xl p-5 border border-[#777777]/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <StickyNote className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Muro de Notas
                </h3>
              </div>
              <button
                onClick={() => setShowQuickNoteForm(!showQuickNoteForm)}
                className="text-xs text-[#34877c] hover:text-[#44a598] font-bold flex items-center space-x-1 cursor-pointer"
              >
                <StickyNote className="w-3.5 h-3.5" />
                <span>{showQuickNoteForm ? 'Cerrar' : 'Nueva nota'}</span>
              </button>
            </div>

            {/* Quick note form if active */}
            {showQuickNoteForm && (
              <form onSubmit={handleQuickAddNote} className="mb-3 p-3 bg-[#141414] rounded-2xl border border-[#777777]/20 space-y-2">
                <input
                  type="text"
                  value={quickNoteTitle}
                  onChange={e => setQuickNoteTitle(e.target.value)}
                  placeholder="Título corto..."
                  className="w-full text-xs px-2.5 py-1.5 bg-[#202020] rounded-lg border border-[#777777]/30 text-white placeholder-[#666666] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c]"
                />
                <textarea
                  value={quickNoteText}
                  onChange={e => setQuickNoteText(e.target.value)}
                  placeholder="Escribí un recordatorio para el equipo..."
                  rows={2}
                  className="w-full text-xs px-2.5 py-1.5 bg-[#202020] rounded-lg border border-[#777777]/30 text-white placeholder-[#666666] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c] resize-none"
                />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-1.5">
                    {([
                      { id: 'yellow', bg: 'bg-[#fef08a] border-[#facc15]' },
                      { id: 'teal', bg: 'bg-[#99f6e4] border-[#2dd4bf]' },
                      { id: 'coral', bg: 'bg-[#fecdd3] border-[#fb7185]' },
                      { id: 'purple', bg: 'bg-[#e9d5ff] border-[#c084fc]' },
                      { id: 'mint', bg: 'bg-[#bbf7d0] border-[#4ade80]' },
                      { id: 'blue', bg: 'bg-[#bae6fd] border-[#38bdf8]' },
                    ] as const).map(item => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => setQuickNoteColor(item.id as PostItColor)}
                        className={`w-4 h-4 rounded-full border ${item.bg} cursor-pointer ${
                          quickNoteColor === item.id ? 'ring-2 ring-white scale-125' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={item.id}
                      />
                    ))}
                  </div>
                  <button
                    type="submit"
                    disabled={!quickNoteText.trim()}
                    className="bg-[#34877c] hover:bg-[#2a6d63] disabled:opacity-50 text-white text-xs px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer"
                  >
                    Pegar Nota
                  </button>
                </div>
              </form>
            )}

            {/* Tilted Bento Post-It Previews or Clean Empty State */}
            {postIts.length === 0 ? (
              <div className="p-4 bg-[#141414]/60 rounded-2xl border border-dashed border-[#777777]/25 text-center my-2">
                <StickyNote className="w-6 h-6 text-[#555555] mx-auto mb-1.5" />
                <p className="text-xs text-[#888888]">No hay notas rápidas en el muro.</p>
                <button
                  onClick={() => setShowQuickNoteForm(true)}
                  className="text-xs text-[#34877c] hover:underline font-bold mt-1.5 inline-block cursor-pointer"
                >
                  + Dejar recordatorio para el equipo
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {postIts.slice(0, 4).map((note, idx) => {
                  const tilts = ['-rotate-1', 'rotate-1', '-rotate-0.5', 'rotate-2'];
                  const tilt = tilts[idx % tilts.length];
                  const colorClasses = getPostItBgColor(note.color);

                  return (
                    <div
                      key={note.id}
                      onClick={() => setActiveTab('postits')}
                      className={`group p-3.5 rounded-2xl border shadow-md ${colorClasses} ${tilt} hover:rotate-0 hover:scale-[1.02] transition-all cursor-pointer flex flex-col justify-between min-h-[105px]`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1.5 mb-1.5">
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            {note.pinned && (
                              <Pin className="w-3 h-3 fill-current text-rose-500 shrink-0 rotate-12" />
                            )}
                            <span className="font-black text-xs uppercase tracking-wide break-words whitespace-normal leading-snug">
                              {note.title}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deletePostIt(note.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/15 dark:hover:bg-white/20 rounded transition-opacity shrink-0 cursor-pointer"
                            title="Eliminar nota"
                          >
                            <Trash2 className="w-3 h-3 opacity-75 hover:opacity-100" />
                          </button>
                        </div>
                        <p className="text-[11px] leading-relaxed line-clamp-3 font-medium opacity-90">
                          {note.content}
                        </p>
                      </div>
                      <div className="text-[9px] font-bold opacity-75 mt-2.5 flex items-center justify-between">
                        <span>— {note.authorName}</span>
                        {note.tags && note.tags.length > 0 && (
                          <span className="text-[8px] opacity-75 font-mono">#{note.tags[0]}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-[#777777]/15">
            <button
              onClick={() => setActiveTab('postits')}
              className="text-xs text-[#888888] hover:text-white flex items-center justify-between w-full cursor-pointer"
            >
              <span>Ver tablero de notas ({postIts.length})</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Bento Tile 4: Saldos por Cobrar & Métricas (Span 4) */}
        <div className="md:col-span-4 bg-[#202020] rounded-3xl p-5 border border-[#777777]/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center space-x-2 mb-3">
              <DollarSign className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Saldos & Presupuestos
              </h3>
            </div>

            <div className="space-y-3">
              {/* Box 1: Pending Balance */}
              <div className="bg-[#141414] p-3.5 rounded-2xl border border-[#777777]/15">
                <div className="text-xs text-[#888888]">Total Saldos Pendientes de Cobro</div>
                <div className="text-2xl font-black text-amber-400 font-mono mt-0.5">
                  {formatARS(pendingCollection)}
                </div>
                <div className="text-[11px] text-[#777777] mt-1">
                  Proyectos activos con pagos pendientes o cuotas
                </div>
              </div>

              {/* Box 2: Budgets sent */}
              <div className="bg-[#141414] p-3.5 rounded-2xl border border-[#777777]/15 flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#888888]">Presupuestos Enviados</div>
                  <div className="text-xl font-bold text-white font-mono">
                    {budgets.filter(b => b.status === 'enviado').length} en curso
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('presupuestos')}
                  className="bg-[#34877c]/20 text-[#34877c] hover:bg-[#34877c] hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Ver Todos
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#777777]/15">
            <button
              onClick={onNewBudget}
              className="text-xs text-[#34877c] hover:text-[#44a598] font-bold flex items-center justify-between w-full cursor-pointer"
            >
              <span>Confeccionar nuevo presupuesto</span>
              <FilePlus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bento Tile 5: Registro de Actividad Reciente & Integrantes en vivo (Span 4) */}
        <div className="md:col-span-4 bg-[#202020] rounded-3xl p-5 border border-[#777777]/15 flex flex-col justify-between shadow-lg">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-[#34877c]" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Actividad & Equipo
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                En vivo
              </span>
            </div>

            {/* Team live presence strip */}
            <div className="mb-3 p-2.5 bg-[#141414] rounded-2xl border border-[#777777]/15 flex items-center justify-between gap-2">
              <div className="text-[10px] font-bold text-[#888888] uppercase tracking-wider">
                Presencia
              </div>
              <div className="flex items-center gap-2">
                {team.map(m => {
                  const isCurrent = m.id === currentUser.id;
                  const now = Date.now();
                  const isOnline = isCurrent || activePresences.some(p => p.memberId === m.id && now - p.lastHeartbeat < 10000);

                  return (
                    <div
                      key={m.id}
                      className="flex items-center gap-1 text-[11px]"
                      title={`${m.name}: ${isOnline ? 'En línea' : 'Desconectado'}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-[#555555]'
                        }`}
                      />
                      <span className={`text-[10px] font-bold ${isOnline ? 'text-white' : 'text-[#666666]'}`}>
                        {m.name.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              {auditLogs.length === 0 ? (
                <div className="p-4 bg-[#141414]/60 rounded-2xl border border-dashed border-[#777777]/25 text-center my-2">
                  <Activity className="w-6 h-6 text-[#555555] mx-auto mb-1.5" />
                  <p className="text-xs text-[#888888]">
                    Aún no hay acciones registradas.
                  </p>
                  <p className="text-[10px] text-[#666666] mt-0.5">
                    Cada cambio de proyecto, cliente o cobro se listará aquí.
                  </p>
                </div>
              ) : (
                auditLogs.slice(0, 3).map(log => (
                  <div key={log.id} className="text-xs flex items-start space-x-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#34877c] mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-200">
                        <span className="font-bold text-white">{log.memberName}</span>{' '}
                        <span className="text-[#888888]">{log.action}:</span>{' '}
                        <span className="text-[#cccccc]">{log.details}</span>
                      </div>
                      <div className="text-[10px] text-[#777777] mt-0.5 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString('es-AR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • {formatDateAR(log.timestamp)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-[#777777]/15 text-[10px] text-[#777777] text-center">
            Todos los cambios se registran con autor y fecha para el equipo.
          </div>
        </div>
      </div>

      {/* Full Width Control de Cobro de Abonos */}
      <div className="bg-[#202020] rounded-3xl p-5 sm:p-6 border border-[#777777]/15 shadow-lg w-full">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Repeat className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-black text-white">
              Control de Cobro: Abonos Mensuales
            </h3>
          </div>
          <span className="text-xs text-[#777777] font-semibold">
            {retainers.length} abonos registrados
          </span>
        </div>
        <p className="text-xs text-[#888888] mb-4">
          Hacé clic sobre el estado para registrar el pago del abono correspondiente al mes actual.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#777777]/15 text-[#777777]">
                <th className="pb-2 font-semibold">CLIENTE / SERVICIO</th>
                <th className="pb-2 font-semibold">DÍA DE COBRO</th>
                <th className="pb-2 font-semibold">VALOR MENSUAL</th>
                <th className="pb-2 font-semibold text-right">ESTADO DEL MES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#777777]/10">
              {retainers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-[#777777]">
                    <div className="flex flex-col items-center justify-center space-y-1.5">
                      <Repeat className="w-6 h-6 text-[#555555]" />
                      <p className="text-xs text-[#888888] font-medium">
                        No hay abonos mensuales registrados actualmente.
                      </p>
                      <button
                        onClick={onNewProject}
                        className="text-xs text-[#34877c] hover:underline font-bold cursor-pointer"
                      >
                        + Crear un abono de mantenimiento recurrente
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                retainers.map(ret => {
                  const isPaidThisMonth = ret.lastMonthlyPaymentDate === currentMonthStr;
                  return (
                    <tr key={ret.id} className="hover:bg-[#272727] transition-colors">
                      <td className="py-2.5 pr-2">
                        <div className="font-bold text-white">{ret.clientName}</div>
                        <div className="text-[#888888] truncate max-w-xs">{ret.title}</div>
                      </td>
                      <td className="py-2.5 text-[#aaaaaa]">
                        Día {ret.monthlyBillingDay || 5} de c/mes
                      </td>
                      <td className="py-2.5 font-bold font-mono text-white">
                        {formatARS(ret.totalAmount)}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => toggleMonthlyPayment(ret.id, currentMonthStr)}
                          className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isPaidThisMonth
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 hover:bg-emerald-900'
                              : 'bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900'
                          }`}
                        >
                          {isPaidThisMonth ? '✓ Cobrado este mes' : '✕ Pendiente de cobro'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
