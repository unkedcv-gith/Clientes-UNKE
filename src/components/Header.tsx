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
  const connectedMembers = React.useMemo(() => {
    const activeMemberIds = new Set<string>();
    if (isAuthenticated && currentUser?.id) {
      activeMemberIds.add(currentUser.id);
    }
    const now = Date.now();
    activePresences.forEach(p => {
      if (p.lastHeartbeat && now - p.lastHeartbeat < 10000) {
        activeMemberIds.add(p.memberId);
      }
    });
    return team.filter(m => activeMemberIds.has(m.id));
  }, [team, isAuthenticated, currentUser?.id, activePresences]);

  const getMemberBgColor = (memberId: string) => {
    switch (memberId) {
      case 'member_nacho':
        return 'bg-[#27655d] ring-1 ring-[#34877c]/80';
      case 'member_fede':
        return 'bg-[#34877c] ring-1 ring-[#5d9f96]/80';
      case 'member_willy':
        return 'bg-[#5d9f96] ring-1 ring-[#27655d]/80';
      default:
        return 'bg-[#34877c] ring-1 ring-[#5d9f96]/80';
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
    <header className="sticky top-0 z-40 w-full bg-[#141414] border-b border-[#777777]/15 shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-3">
        {/* Top Collision Notification Bar if someone is editing the same item */}
        {otherEditorWarning && (
          <div className="mb-2.5 bg-amber-500 text-slate-950 px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-between gap-2 shadow-lg animate-pulse">
            <div className="flex items-center gap-2 max-w-5xl mx-auto">
              <AlertTriangle className="w-4 h-4 shrink-0 text-slate-950" />
              <span>{otherEditorWarning}</span>
            </div>
          </div>
        )}

        {/* Bento Header Bar */}
        <div className="bg-[#202020] p-2 sm:p-2.5 rounded-2xl border border-[#777777]/20 shadow-md flex items-center justify-between gap-2 sm:gap-4 text-white">
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
          <nav className="hidden lg:flex items-center space-x-1 bg-[#141414] p-1 rounded-xl border border-[#777777]/20">
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

            {/* Connected Users In Real Time - Avatars only */}
            <div className="pl-1 sm:pl-1.5 border-l border-[#777777]/25 flex items-center">
              <button
                onClick={onOpenTeamModal}
                className="flex items-center p-1 sm:p-1.5 rounded-xl bg-[#141414] hover:bg-[#2a2a2a] border border-[#777777]/25 hover:border-[#34877c]/40 transition-all group focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#34877c] cursor-pointer"
                title={`Integrantes en línea (${connectedMembers.length}): ${connectedMembers.map(m => m.name).join(', ')}. Clic para cambiar de usuario o ver equipo.`}
              >
                {/* Avatars of all connected users */}
                <div className="flex items-center -space-x-1.5">
                  {connectedMembers.map((m, idx) => {
                    const isCurrent = m.id === currentUser.id;
                    const zIndexStyle = { zIndex: 30 - idx };
                    const presence = activePresences.find(p => p.memberId === m.id);
                    const viewLabel = presence?.currentView ? ` • Viendo ${presence.currentView}` : '';

                    return (
                      <div
                        key={m.id}
                        style={zIndexStyle}
                        className={`relative w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-[#202020] shadow-md transition-transform group-hover:scale-105 shrink-0 ${getMemberBgColor(
                          m.id
                        )}`}
                        title={`${m.name} (${isCurrent ? 'Tu sesión actual' : 'Conectado en vivo'}${viewLabel})`}
                      >
                        {m.initials}
                        {/* Active Pulse Green Dot */}
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#202020] animate-pulse" />
                      </div>
                    );
                  })}
                </div>
              </button>
            </div>
          </div>
        </div>

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
    </header>
  );
};
