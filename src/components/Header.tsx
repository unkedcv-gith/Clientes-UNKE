import React from 'react';
import { useStudio } from '../context/StudioContext';
import { UnkeLogo } from './UnkeLogo';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  StickyNote,
  Calendar,
  AlertTriangle,
  Plus,
  FilePlus,
} from 'lucide-react';

interface HeaderProps {
  onOpenTeamModal: () => void;
  onOpenBackupModal?: () => void;
  onNewProject?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTeamModal,
  onNewProject,
}) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    team,
    activePresences,
    otherEditorWarning,
    isAuthenticated,
  } = useStudio();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'proyectos' as const, label: 'Proyectos', icon: FolderKanban },
    { id: 'presupuestos' as const, label: 'Presupuestos', icon: FileText },
    { id: 'clientes' as const, label: 'Clientes', icon: Users },
    { id: 'postits' as const, label: 'Notas', icon: StickyNote },
    { id: 'calendario' as const, label: 'Calendario', icon: Calendar },
  ];

  // List of all connected/active members
  const connectedMembers = team.filter(m => {
    if (isAuthenticated && m.id === currentUser.id) return true;
    return activePresences.some(p => p.memberId === m.id);
  });

  const getMemberBgColor = (memberId: string) => {
    switch (memberId) {
      case 'member_nacho':
        return 'bg-[#34877c] ring-1 ring-teal-400';
      case 'member_fede':
        return 'bg-[#0284c7] ring-1 ring-sky-400';
      case 'member_willy':
        return 'bg-[#e11d48] ring-1 ring-rose-400';
      default:
        return 'bg-[#34877c] ring-1 ring-teal-400';
    }
  };

  const handleCreateProjectClick = () => {
    if (onNewProject) {
      onNewProject();
    } else {
      setActiveTab('proyectos');
    }
  };

  return (
    <div className="sticky top-0 z-40 pt-3 sm:pt-4 px-3 sm:px-6 max-w-7xl mx-auto w-full transition-colors">
      {/* Top Collision Notification Bar if someone is editing the same item */}
      {otherEditorWarning && (
        <div className="mb-3 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-between gap-2 shadow-lg animate-pulse">
          <div className="flex items-center gap-2 max-w-5xl mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
            <span>{otherEditorWarning}</span>
          </div>
        </div>
      )}

      {/* Bento Header Bar */}
      <header className="bg-[#202020] p-2.5 sm:p-3.5 rounded-2xl border border-[#777777]/20 shadow-xl flex items-center justify-between gap-2 sm:gap-4 text-white">
        {/* Zone 1: Brand Wordmark / Logo */}
        <div className="flex items-center shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c] rounded-lg transition-transform active:scale-95 text-white cursor-pointer"
            title="UNKE Estudio - Inicio"
          >
            <UnkeLogo className="h-7 sm:h-8 w-auto text-white group-hover:opacity-90 transition-opacity" />
          </button>
        </div>

        {/* Zone 2: Navigation Tabs (Desktop / Tablet) */}
        <nav className="hidden lg:flex items-center space-x-1 bg-[#141414]/90 p-1 rounded-xl border border-[#777777]/20">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#34877c] text-white shadow-sm'
                    : 'text-[#888888] hover:text-white hover:bg-[#202020]'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Action Buttons & Connected Users */}
        <div className="flex items-center space-x-2 sm:space-x-2.5 shrink-0">
          {/* Quick Action: New Project */}
          <button
            onClick={handleCreateProjectClick}
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap cursor-pointer"
            title="Crear un nuevo proyecto"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Nuevo Proyecto</span>
            <span className="xs:hidden sm:hidden">Proyecto</span>
          </button>

          {/* Quick Action: Budget */}
          <button
            onClick={() => setActiveTab('presupuestos')}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#141414] hover:bg-[#272727] text-[#cccccc] hover:text-white border border-[#777777]/30 hover:border-[#777777]/50 rounded-xl text-xs font-semibold transition-all shadow-xs whitespace-nowrap cursor-pointer"
            title="Crear un nuevo presupuesto"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#34877c]" />
            <span>Presupuestar</span>
          </button>

          {/* Connected Users In Real Time */}
          <div className="pl-1 sm:pl-1.5 border-l border-[#777777]/25 flex items-center">
            <button
              onClick={onOpenTeamModal}
              className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-[#141414]/80 hover:bg-[#2a2a2a] border border-[#777777]/25 hover:border-[#34877c]/40 transition-all text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c] cursor-pointer"
              title={`Usuarios en línea: ${connectedMembers.map(m => m.name).join(', ')}. Clic para cambiar de usuario o ver equipo.`}
            >
              {/* Avatars of all connected users */}
              <div className="flex items-center -space-x-2">
                {connectedMembers.map((m, idx) => {
                  const isCurrent = m.id === currentUser.id;
                  const zIndexStyle = { zIndex: 30 - idx };
                  return (
                    <div
                      key={m.id}
                      style={zIndexStyle}
                      className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#202020] shadow-md transition-transform group-hover:scale-105 ${getMemberBgColor(
                        m.id
                      )}`}
                      title={`${m.name} (${isCurrent ? 'Tu sesión' : 'En línea'})`}
                    >
                      {m.initials}
                      {/* Active Pulse Green Dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#202020] animate-pulse" />
                    </div>
                  );
                })}
              </div>

              {/* Status and Name Badges */}
              <div className="hidden sm:flex flex-col text-left pl-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-white leading-tight">
                    {connectedMembers.length > 1
                      ? `${connectedMembers.length} en línea`
                      : currentUser.name.split(' ')[0]}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <span className="text-[9px] font-medium text-emerald-400 leading-tight">
                  {connectedMembers.length > 1
                    ? connectedMembers.map(m => m.name.split(' ')[0]).join(', ')
                    : 'En línea'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Row */}
      <div className="lg:hidden mt-2 flex items-center justify-around bg-[#202020] rounded-xl border border-[#777777]/20 p-1.5 overflow-x-auto shadow-md">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center py-1 px-2.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-[#34877c] text-white'
                  : 'text-[#777777] hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
