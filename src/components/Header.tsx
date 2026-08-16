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
  } = useStudio();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'proyectos' as const, label: 'Proyectos', icon: FolderKanban },
    { id: 'presupuestos' as const, label: 'Presupuestos', icon: FileText },
    { id: 'clientes' as const, label: 'Clientes', icon: Users },
    { id: 'postits' as const, label: 'Notas', icon: StickyNote },
    { id: 'calendario' as const, label: 'Calendario', icon: Calendar },
  ];

  // Show ONLY connected users
  const connectedMembers = team.filter(
    m => m.id === currentUser.id || activePresences.some(p => p.memberId === m.id)
  );

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
            className="flex items-center text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c] rounded-lg transition-transform active:scale-95 text-white"
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
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 ${
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
            className="flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap"
            title="Crear un nuevo proyecto"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden xs:inline sm:inline">Nuevo Proyecto</span>
            <span className="xs:hidden sm:hidden">Proyecto</span>
          </button>

          {/* Quick Action: Budget */}
          <button
            onClick={() => setActiveTab('presupuestos')}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-[#141414] hover:bg-[#272727] text-[#cccccc] hover:text-white border border-[#777777]/30 hover:border-[#777777]/50 rounded-xl text-xs font-semibold transition-all shadow-xs whitespace-nowrap"
            title="Crear un nuevo presupuesto"
          >
            <FilePlus className="w-3.5 h-3.5 text-[#34877c]" />
            <span>Presupuestar</span>
          </button>

          {/* Connected Users Only */}
          <div className="pl-1 sm:pl-1.5 border-l border-[#777777]/25 flex items-center">
            <button
              onClick={onOpenTeamModal}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1 rounded-xl bg-[#141414]/70 hover:bg-[#2a2a2a] border border-[#777777]/25 transition-all text-left group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c]"
              title="Usuarios conectados en tiempo real. Clic para cambiar de usuario o cerrar sesión."
            >
              <div className="flex items-center -space-x-1.5">
                {connectedMembers.map(m => {
                  const isCurrent = m.id === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`relative w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#202020] shadow-sm transition-transform group-hover:scale-105 ${
                        isCurrent ? 'bg-[#34877c] z-10 ring-1 ring-emerald-400' : 'bg-[#0284c7]'
                      }`}
                    >
                      {m.initials}
                      {/* Green online dot */}
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#202020] animate-pulse" />
                    </div>
                  );
                })}
              </div>

              {/* User short name */}
              <div className="hidden xl:flex flex-col text-left pl-1">
                <span className="text-[11px] font-bold text-white leading-tight">
                  {currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[9px] text-emerald-400 leading-tight">En línea</span>
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
              className={`flex flex-col items-center py-1 px-2.5 text-[10px] font-bold rounded-lg whitespace-nowrap transition-colors ${
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
