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

const MainAppContent: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated } = useStudio();

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo_horizontal.svg"
              alt="UNKE"
              className="h-4 sm:h-5 w-auto object-contain opacity-90"
            />
            <span>•</span>
            <span>Estudio de Diseño y Comunicación</span>
          </div>
          <div className="text-[11px] text-[#777777] font-mono">
            Valores en ARS ($) • Sincronización Multi-usuario en vivo
          </div>
        </div>
      </footer>

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

