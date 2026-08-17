import React, { useState } from 'react';
import { StudioProvider, useStudio } from './context/StudioContext';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ProjectsView } from './components/ProjectsView';
import { BudgetsView } from './components/BudgetsView';
import { ClientsView } from './components/ClientsView';
import { PostItBoardView } from './components/PostItBoardView';
import { CalendarView } from './components/CalendarView';
import { TeamLoginModal } from './components/TeamLoginModal';
import { BackupModal } from './components/BackupModal';
import { LoginScreen } from './components/LoginScreen';
import { X, Volume2, Users, Database } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    isAuthenticated,
    connectionToast,
    dismissConnectionToast,
  } = useStudio();

  // Modals
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Selected project for deep navigation from Dashboard
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [openCreateProjectTrigger, setOpenCreateProjectTrigger] = useState<number>(0);

  // If not authenticated, render Login Screen
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  const handleNewProject = () => {
    setSelectedProjectId(null);
    setActiveTab('proyectos');
    setOpenCreateProjectTrigger(prev => prev + 1);
  };

  const handleNewBudget = () => {
    setActiveTab('presupuestos');
  };

  const handleNewClient = () => {
    setActiveTab('clientes');
  };

  const handleSelectProjectFromDashboard = (projId: string) => {
    setSelectedProjectId(projId);
    setActiveTab('proyectos');
  };

  return (
    <div className="min-h-screen bg-[#141414] text-[#ffffff] flex flex-col font-sans transition-colors selection:bg-[#34877c] selection:text-white">
      {/* Bento Header */}
      <Header
        onOpenTeamModal={() => setIsTeamModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onNewProject={handleNewProject}
      />

      {/* Main Bento Grid Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-4 pb-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNewProject={handleNewProject}
            onNewBudget={handleNewBudget}
            onNewClient={handleNewClient}
            onSelectProject={handleSelectProjectFromDashboard}
          />
        )}

        {activeTab === 'proyectos' && (
          <ProjectsView
            selectedProjectId={selectedProjectId}
            onClearSelectedProject={() => setSelectedProjectId(null)}
            openCreateTrigger={openCreateProjectTrigger}
          />
        )}

        {activeTab === 'presupuestos' && <BudgetsView />}

        {activeTab === 'clientes' && <ClientsView />}

        {activeTab === 'postits' && <PostItBoardView />}

        {activeTab === 'calendario' && <CalendarView />}
      </main>

      {/* Bento Footer */}
      <footer className="border-t border-[#777777]/15 bg-[#141414] py-4 mt-auto text-xs text-[#777777]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo_horizontal.svg"
              alt="UNKE"
              className="h-4 sm:h-5 w-auto object-contain opacity-90"
            />
            <span>•</span>
            <span>Estudio de Diseño y Comunicación</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-[11px] text-[#777777] font-mono">
              Valores en ARS ($)
            </div>
            <span>•</span>
            {/* Subtle Backup & Restore button */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="text-[11px] text-[#777777] hover:text-[#34877c] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Descargar copia de seguridad o restaurar datos"
            >
              <Database className="w-3.5 h-3.5 opacity-75" />
              <span>Backup</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Live User Connection Toast Notification */}
      {connectionToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-[#202020] border-2 border-[#34877c] text-white p-3 sm:p-4 rounded-2xl shadow-2xl flex items-center gap-3.5 max-w-sm">
            <div
              style={{ backgroundColor: connectionToast.memberColor }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md ring-2 ring-white/20"
            >
              {connectionToast.memberInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                  Nuevo integrante conectado
                </span>
              </div>
              <p className="text-xs text-[#ffffff] font-semibold truncate mt-0.5">
                {connectionToast.memberName}
              </p>
              <p className="text-[10px] text-[#888888]">
                Se ha conectado al estudio en tiempo real
              </p>
            </div>
            <button
              onClick={dismissConnectionToast}
              className="text-[#888888] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <TeamLoginModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <StudioProvider>
      <MainAppContent />
    </StudioProvider>
  );
}

