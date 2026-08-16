import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ActiveUserPresence,
  AuditLogItem,
  Budget,
  Client,
  PostIt,
  Project,
  TeamMember,
} from '../types';
import {
  DEFAULT_STUDIO_BANK,
  DEFAULT_TEAM,
  INITIAL_AUDIT_LOGS,
  INITIAL_BUDGETS,
  INITIAL_CLIENTS,
  INITIAL_POSTITS,
  INITIAL_PROJECTS,
  loadFromStorage,
  saveToStorage,
  STORAGE_KEYS,
} from '../services/storage';
import { generateId } from '../utils/currency';

interface StudioContextType {
  // Authentication
  isAuthenticated: boolean;
  login: (memberId: string, passwordInput: string) => { success: boolean; error?: string };
  logout: () => void;
  inactivityLoggedOut: boolean;
  clearInactivityNotice: () => void;

  // Current user & team
  currentUser: TeamMember;
  team: TeamMember[];
  setCurrentUser: (member: TeamMember) => void;
  updateTeamMember: (updated: TeamMember) => void;

  // Active online presence & collision
  activePresences: ActiveUserPresence[];
  currentEditingItem: { id: string; title: string } | null;
  startEditingItem: (id: string, title: string) => void;
  stopEditingItem: () => void;
  otherEditorWarning: string | null;

  // Clients
  clients: Client[];
  addClient: (clientData: Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Client;
  updateClient: (id: string, clientData: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Projects
  projects: Project[];
  addProject: (projectData: Omit<Project, 'id' | 'code' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Project;
  updateProject: (id: string, projectData: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  toggleDeliverable: (projectId: string, deliverableId: string) => void;
  recordPayment: (projectId: string, amount: number, method: string, notes?: string) => void;
  toggleMonthlyPayment: (projectId: string, monthYear: string) => void;

  // Budgets
  budgets: Budget[];
  addBudget: (budgetData: Omit<Budget, 'id' | 'number' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>) => Budget;
  updateBudget: (id: string, budgetData: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  convertBudgetToProject: (budgetId: string) => Project | null;
  duplicateBudget: (budgetId: string) => Budget;

  // Post-its
  postIts: PostIt[];
  addPostIt: (data: Omit<PostIt, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>) => PostIt;
  updatePostIt: (id: string, data: Partial<PostIt>) => void;
  deletePostIt: (id: string) => void;

  // Audit Logs
  auditLogs: AuditLogItem[];

  // Dark Mode
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  toggleDarkMode: () => void;

  // Studio Bank
  studioBank: typeof DEFAULT_STUDIO_BANK;
  updateStudioBank: (bank: typeof DEFAULT_STUDIO_BANK) => void;

  // Backup / Reset / Cloud simulation
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => boolean;
  resetToSampleData: () => void;

  // Navigation
  activeTab: 'dashboard' | 'proyectos' | 'presupuestos' | 'clientes' | 'postits' | 'calendario';
  setActiveTab: (tab: 'dashboard' | 'proyectos' | 'presupuestos' | 'clientes' | 'postits' | 'calendario') => void;
}

const StudioContext = createContext<StudioContextType | undefined>(undefined);

export const StudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'proyectos' | 'presupuestos' | 'clientes' | 'postits' | 'calendario'>('dashboard');

  // Dark Mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return loadFromStorage(STORAGE_KEYS.DARK_MODE, false);
  });

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DARK_MODE, darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  // Team & Current User
  const [team, setTeam] = useState<TeamMember[]>(() => {
    return loadFromStorage(STORAGE_KEYS.TEAM, DEFAULT_TEAM);
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return loadFromStorage(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_TEAM[0].id);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return loadFromStorage(STORAGE_KEYS.AUTH_SESSION, false);
  });

  const [inactivityLoggedOut, setInactivityLoggedOut] = useState<boolean>(false);

  const clearInactivityNotice = useCallback(() => {
    setInactivityLoggedOut(false);
  }, []);

  const currentUser = useMemo(() => {
    return team.find(m => m.id === currentUserId) || team[0] || DEFAULT_TEAM[0];
  }, [team, currentUserId]);

  const lastActivityRef = useRef<number>(Date.now());
  const lastSavedActivityRef = useRef<number>(Date.now());
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos de inactividad

  const login = useCallback((memberId: string, passwordInput: string) => {
    const member = team.find(m => m.id === memberId);
    if (!member) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

    // Passwords for UNKE team
    const validPassword = member.password || (
      member.id === 'member_nacho' ? 'nachounke' :
      member.id === 'member_fede' ? 'fedeunke' :
      member.id === 'member_willy' ? 'willyunke' : ''
    );

    if (passwordInput.trim() !== validPassword) {
      return { success: false, error: 'Contraseña incorrecta para ' + member.name };
    }

    const now = Date.now();
    lastActivityRef.current = now;
    lastSavedActivityRef.current = now;
    saveToStorage(STORAGE_KEYS.LAST_ACTIVITY, now);

    setCurrentUserId(member.id);
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, member.id);
    setIsAuthenticated(true);
    saveToStorage(STORAGE_KEYS.AUTH_SESSION, true);
    setInactivityLoggedOut(false);
    return { success: true };
  }, [team]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    saveToStorage(STORAGE_KEYS.AUTH_SESSION, false);
  }, []);

  // 5-Minute Inactivity Auto-Logout Effect
  useEffect(() => {
    if (!isAuthenticated) return;

    const recordUserActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      if (now - lastSavedActivityRef.current > 3000) {
        lastSavedActivityRef.current = now;
        saveToStorage(STORAGE_KEYS.LAST_ACTIVITY, now);
      }
    };

    const userActivityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
      'wheel',
    ];

    userActivityEvents.forEach(evt => {
      window.addEventListener(evt, recordUserActivity, { passive: true });
    });

    // Check every 4 seconds for inactivity
    const interval = setInterval(() => {
      const storedLastActivity = loadFromStorage<number>(STORAGE_KEYS.LAST_ACTIVITY, lastActivityRef.current);
      const effectiveLastActivity = Math.max(lastActivityRef.current, storedLastActivity);

      if (Date.now() - effectiveLastActivity >= INACTIVITY_TIMEOUT_MS) {
        setInactivityLoggedOut(true);
        logout();
      }
    }, 4000);

    // Tab visibility and focus check
    const handleVisibilityOrFocus = () => {
      const storedLastActivity = loadFromStorage<number>(STORAGE_KEYS.LAST_ACTIVITY, lastActivityRef.current);
      const effectiveLastActivity = Math.max(lastActivityRef.current, storedLastActivity);

      if (Date.now() - effectiveLastActivity >= INACTIVITY_TIMEOUT_MS) {
        setInactivityLoggedOut(true);
        logout();
      } else {
        recordUserActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      userActivityEvents.forEach(evt => {
        window.removeEventListener(evt, recordUserActivity);
      });
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isAuthenticated, logout]);

  const setCurrentUser = useCallback((member: TeamMember) => {
    setCurrentUserId(member.id);
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, member.id);
  }, []);

  const updateTeamMember = useCallback((updated: TeamMember) => {
    setTeam(prev => {
      const next = prev.map(m => (m.id === updated.id ? updated : m));
      saveToStorage(STORAGE_KEYS.TEAM, next);
      return next;
    });
  }, []);

  // Studio Bank Details
  const [studioBank, setStudioBank] = useState(() => {
    return loadFromStorage(STORAGE_KEYS.STUDIO_INFO, DEFAULT_STUDIO_BANK);
  });

  const updateStudioBank = useCallback((bank: typeof DEFAULT_STUDIO_BANK) => {
    setStudioBank(bank);
    saveToStorage(STORAGE_KEYS.STUDIO_INFO, bank);
  }, []);

  // Data Collections
  const [clients, setClients] = useState<Client[]>(() => {
    return loadFromStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    return loadFromStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
  });

  const [budgets, setBudgets] = useState<Budget[]>(() => {
    return loadFromStorage(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
  });

  const [postIts, setPostIts] = useState<PostIt[]>(() => {
    return loadFromStorage(STORAGE_KEYS.POSTITS, INITIAL_POSTITS);
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    return loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  });

  // Audit Logger helper
  const addAuditLog = useCallback((
    action: AuditLogItem['action'],
    entityType: AuditLogItem['entityType'],
    entityId: string,
    details: string
  ) => {
    const newLog: AuditLogItem = {
      id: generateId('log'),
      timestamp: new Date().toISOString(),
      memberId: currentUser.id,
      memberName: currentUser.name,
      action,
      entityType,
      entityId,
      details,
    };
    setAuditLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 100);
      saveToStorage(STORAGE_KEYS.AUDIT_LOGS, updated);
      return updated;
    });
  }, [currentUser]);

  // Realtime Presence & Broadcast Sync
  const [activePresences, setActivePresences] = useState<ActiveUserPresence[]>([]);
  const [currentEditingItem, setCurrentEditingItem] = useState<{ id: string; title: string } | null>(null);
  const [otherEditorWarning, setOtherEditorWarning] = useState<string | null>(null);

  // Broadcast Channel setup
  const broadcastChannel = useMemo(() => {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      return new BroadcastChannel('unke_studio_sync_channel');
    }
    return null;
  }, []);

  // Broadcast Data Changes
  const broadcastSync = useCallback((type: string, payload?: unknown) => {
    if (broadcastChannel) {
      broadcastChannel.postMessage({ type, payload, senderId: currentUser.id, senderName: currentUser.name });
    }
  }, [broadcastChannel, currentUser]);

  // Heartbeat Presence sender
  useEffect(() => {
    const sendHeartbeat = () => {
      if (broadcastChannel) {
        broadcastChannel.postMessage({
          type: 'HEARTBEAT',
          presence: {
            memberId: currentUser.id,
            memberName: currentUser.name,
            memberInitials: currentUser.initials,
            memberColor: currentUser.avatarColor,
            currentView: activeTab,
            editingItemId: currentEditingItem?.id || null,
            editingItemTitle: currentEditingItem?.title || null,
            lastHeartbeat: Date.now(),
          } as ActiveUserPresence,
        });
      }
    };

    sendHeartbeat();
    const interval = setInterval(sendHeartbeat, 3000);
    return () => clearInterval(interval);
  }, [broadcastChannel, currentUser, activeTab, currentEditingItem]);

  // Clean stale presences (>8 seconds without heartbeat)
  useEffect(() => {
    const cleaner = setInterval(() => {
      const threshold = Date.now() - 8000;
      setActivePresences(prev => prev.filter(p => p.lastHeartbeat > threshold));
    }, 4000);
    return () => clearInterval(cleaner);
  }, []);

  // Listen to incoming messages from other tabs/users
  useEffect(() => {
    if (!broadcastChannel) return;

    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data) return;

      if (data.type === 'HEARTBEAT' && data.presence) {
        const presence: ActiveUserPresence = data.presence;
        // Don't track self
        if (presence.memberId === currentUser.id) return;

        setActivePresences(prev => {
          const filtered = prev.filter(p => p.memberId !== presence.memberId);
          return [...filtered, presence];
        });

        // Check for editing collision
        if (
          currentEditingItem &&
          presence.editingItemId === currentEditingItem.id &&
          presence.memberId !== currentUser.id
        ) {
          setOtherEditorWarning(
            `⚠️ ¡Atención! ${presence.memberName} también está editando "${currentEditingItem.title}". Tengan cuidado de no sobreescribir cambios.`
          );
        }
      }

      if (data.type === 'DATA_RELOAD') {
        // Re-read storage
        setClients(loadFromStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS));
        setProjects(loadFromStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS));
        setBudgets(loadFromStorage(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS));
        setPostIts(loadFromStorage(STORAGE_KEYS.POSTITS, INITIAL_POSTITS));
        setAuditLogs(loadFromStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS));
      }
    };

    broadcastChannel.addEventListener('message', handleMessage);
    return () => broadcastChannel.removeEventListener('message', handleMessage);
  }, [broadcastChannel, currentUser, currentEditingItem]);

  // Start / Stop Editing Item helpers
  const startEditingItem = useCallback((id: string, title: string) => {
    setCurrentEditingItem({ id, title });

    // Check if someone else is already editing it
    const collision = activePresences.find(
      p => p.editingItemId === id && p.memberId !== currentUser.id
    );
    if (collision) {
      setOtherEditorWarning(
        `⚠️ ${collision.memberName} está editando "${title}" en este momento. Coordinen para no pisar cambios.`
      );
    } else {
      setOtherEditorWarning(null);
    }
  }, [activePresences, currentUser]);

  const stopEditingItem = useCallback(() => {
    setCurrentEditingItem(null);
    setOtherEditorWarning(null);
  }, []);

  // CLIENT CRUD
  const addClient = useCallback((clientData: Omit<Client, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: generateId('cli'),
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };
    setClients(prev => {
      const updated = [newClient, ...prev];
      saveToStorage(STORAGE_KEYS.CLIENTS, updated);
      return updated;
    });
    addAuditLog('creó', 'cliente', newClient.id, `Creó el cliente "${newClient.name}"`);
    broadcastSync('DATA_RELOAD');
    return newClient;
  }, [currentUser, addAuditLog, broadcastSync]);

  const updateClient = useCallback((id: string, clientData: Partial<Client>) => {
    setClients(prev => {
      const updated = prev.map(c =>
        c.id === id
          ? {
              ...c,
              ...clientData,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
            }
          : c
      );
      saveToStorage(STORAGE_KEYS.CLIENTS, updated);
      return updated;
    });
    addAuditLog('editó', 'cliente', id, `Actualizó datos del cliente`);
    broadcastSync('DATA_RELOAD');
  }, [currentUser, addAuditLog, broadcastSync]);

  const deleteClient = useCallback((id: string) => {
    const target = clients.find(c => c.id === id);
    setClients(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveToStorage(STORAGE_KEYS.CLIENTS, updated);
      return updated;
    });
    if (target) {
      addAuditLog('eliminó', 'cliente', id, `Eliminó el cliente "${target.name}"`);
    }
    broadcastSync('DATA_RELOAD');
  }, [clients, addAuditLog, broadcastSync]);

  // PROJECTS CRUD
  const addProject = useCallback((projectData: Omit<Project, 'id' | 'code' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Project => {
    const year = new Date().getFullYear();
    const count = projects.length + 1;
    const code = `UNK-${year}-${String(count).padStart(2, '0')}`;

    const newProject: Project = {
      ...projectData,
      id: generateId('proj'),
      code,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    setProjects(prev => {
      const updated = [newProject, ...prev];
      saveToStorage(STORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
    addAuditLog(
      'creó',
      'proyecto',
      newProject.id,
      `Creó el ${newProject.type === 'mantenimiento' ? 'abono' : 'proyecto'} "${newProject.title}" para ${newProject.clientName}`
    );
    broadcastSync('DATA_RELOAD');
    return newProject;
  }, [currentUser, projects.length, addAuditLog, broadcastSync]);

  const updateProject = useCallback((id: string, projectData: Partial<Project>) => {
    setProjects(prev => {
      const updated = prev.map(p =>
        p.id === id
          ? {
              ...p,
              ...projectData,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
            }
          : p
      );
      saveToStorage(STORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
    addAuditLog('editó', 'proyecto', id, `Actualizó proyecto`);
    broadcastSync('DATA_RELOAD');
  }, [currentUser, addAuditLog, broadcastSync]);

  const deleteProject = useCallback((id: string) => {
    const target = projects.find(p => p.id === id);
    setProjects(prev => {
      const updated = prev.filter(p => p.id !== id);
      saveToStorage(STORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
    if (target) {
      addAuditLog('eliminó', 'proyecto', id, `Eliminó el proyecto "${target.title}"`);
    }
    broadcastSync('DATA_RELOAD');
  }, [projects, addAuditLog, broadcastSync]);

  const toggleDeliverable = useCallback((projectId: string, deliverableId: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const nextDeliverables = p.deliverables.map(d =>
          d.id === deliverableId ? { ...d, done: !d.done } : d
        );
        return {
          ...p,
          deliverables: nextDeliverables,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.name,
        };
      });
      saveToStorage(STORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
    broadcastSync('DATA_RELOAD');
  }, [currentUser, broadcastSync]);

  const recordPayment = useCallback((projectId: string, amount: number, method: string, notes?: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const newPaid = p.paidAmount + amount;
        const newRecord = {
          id: generateId('pay'),
          date: new Date().toISOString().split('T')[0],
          amount,
          method,
          notes: notes || '',
          recordedBy: currentUser.name,
        };
        const newStatus =
          newPaid >= p.totalAmount
            ? 'pagado'
            : newPaid > 0
            ? 'parcial'
            : p.paymentStatus;

        return {
          ...p,
          paidAmount: newPaid,
          paymentStatus: newStatus as Project['paymentStatus'],
          paymentsHistory: [newRecord, ...(p.paymentsHistory || [])],
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.name,
        };
      });
      saveToStorage(STORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
    addAuditLog('registró pago', 'proyecto', projectId, `Registró pago por $ ${amount.toLocaleString('es-AR')}`);
    broadcastSync('DATA_RELOAD');
  }, [currentUser, addAuditLog, broadcastSync]);

  const toggleMonthlyPayment = useCallback((projectId: string, monthYear: string) => {
    setProjects(prev => {
      const updated = prev.map(p => {
        if (p.id !== projectId) return p;
        const isCurrentlyPaidForMonth = p.lastMonthlyPaymentDate === monthYear;
        const nextLastDate = isCurrentlyPaidForMonth ? '' : monthYear;
        const nextStatus = isCurrentlyPaidForMonth ? 'pendiente' : 'al_dia';

        return {
          ...p,
          lastMonthlyPaymentDate: nextLastDate,
          paymentStatus: nextStatus as Project['paymentStatus'],
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser.name,
        };
      });
      saveToStorage(STORAGE_KEYS.PROJECTS, updated);
      return updated;
    });
    broadcastSync('DATA_RELOAD');
  }, [currentUser, broadcastSync]);

  // BUDGETS CRUD
  const addBudget = useCallback((budgetData: Omit<Budget, 'id' | 'number' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>): Budget => {
    const year = new Date().getFullYear();
    const count = budgets.length + 1;
    const number = `PRES-${year}-${String(count).padStart(3, '0')}`;

    const newBudget: Budget = {
      ...budgetData,
      id: generateId('bud'),
      number,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    setBudgets(prev => {
      const updated = [newBudget, ...prev];
      saveToStorage(STORAGE_KEYS.BUDGETS, updated);
      return updated;
    });
    addAuditLog('creó', 'presupuesto', newBudget.id, `Creó el presupuesto ${newBudget.number} para ${newBudget.clientName}`);
    broadcastSync('DATA_RELOAD');
    return newBudget;
  }, [currentUser, budgets.length, addAuditLog, broadcastSync]);

  const updateBudget = useCallback((id: string, budgetData: Partial<Budget>) => {
    setBudgets(prev => {
      const updated = prev.map(b =>
        b.id === id
          ? {
              ...b,
              ...budgetData,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
            }
          : b
      );
      saveToStorage(STORAGE_KEYS.BUDGETS, updated);
      return updated;
    });
    addAuditLog('editó', 'presupuesto', id, `Actualizó presupuesto`);
    broadcastSync('DATA_RELOAD');
  }, [currentUser, addAuditLog, broadcastSync]);

  const deleteBudget = useCallback((id: string) => {
    const target = budgets.find(b => b.id === id);
    setBudgets(prev => {
      const updated = prev.filter(b => b.id !== id);
      saveToStorage(STORAGE_KEYS.BUDGETS, updated);
      return updated;
    });
    if (target) {
      addAuditLog('eliminó', 'presupuesto', id, `Eliminó el presupuesto ${target.number}`);
    }
    broadcastSync('DATA_RELOAD');
  }, [budgets, addAuditLog, broadcastSync]);

  const duplicateBudget = useCallback((budgetId: string): Budget => {
    const original = budgets.find(b => b.id === budgetId);
    if (!original) throw new Error('Presupuesto no encontrado');

    const year = new Date().getFullYear();
    const count = budgets.length + 1;
    const number = `PRES-${year}-${String(count).padStart(3, '0')}`;

    const duplicated: Budget = {
      ...original,
      id: generateId('bud'),
      number,
      title: `${original.title} (Copia)`,
      status: 'borrador',
      convertedToProjectId: undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.name,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    setBudgets(prev => {
      const updated = [duplicated, ...prev];
      saveToStorage(STORAGE_KEYS.BUDGETS, updated);
      return updated;
    });
    addAuditLog('creó', 'presupuesto', duplicated.id, `Duplicó presupuesto ${original.number} como ${duplicated.number}`);
    broadcastSync('DATA_RELOAD');
    return duplicated;
  }, [budgets, currentUser, addAuditLog, broadcastSync]);

  const convertBudgetToProject = useCallback((budgetId: string): Project | null => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return null;

    // Build deliverables from budget items
    const deliverables = budget.items.map(item => ({
      id: generateId('del'),
      title: item.description,
      done: false,
    }));

    // Target delivery 30 days from now
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 30);
    const deliveryDate = delivery.toISOString().split('T')[0];

    const year = new Date().getFullYear();
    const count = projects.length + 1;
    const code = `UNK-${year}-${String(count).padStart(2, '0')}`;

    const newProject: Project = {
      id: generateId('proj'),
      code,
      title: budget.title,
      description: `Generado a partir del presupuesto ${budget.number}.`,
      clientId: budget.clientId,
      clientName: budget.clientName,
      type: budget.projectType,
      status: 'en_progreso',
      paymentStatus: 'pendiente',
      totalAmount: budget.totalAmount,
      paidAmount: 0,
      monthlyBillingDay: budget.projectType === 'mantenimiento' ? 5 : undefined,
      startDate: new Date().toISOString().split('T')[0],
      deliveryDate,
      tags: [budget.projectType === 'mantenimiento' ? 'Abono Mensual' : 'Proyecto Cerrado'],
      deliverables,
      paymentsHistory: [],
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      updatedAt: new Date().toISOString(),
    };

    // Update project list & mark budget as approved/converted
    setProjects(prev => {
      const updated = [newProject, ...prev];
      saveToStorage(STORAGE_KEYS.PROJECTS, updated);
      return updated;
    });

    setBudgets(prev => {
      const updated = prev.map(b =>
        b.id === budgetId
          ? {
              ...b,
              status: 'aprobado' as Budget['status'],
              convertedToProjectId: newProject.id,
              updatedAt: new Date().toISOString(),
              updatedBy: currentUser.name,
            }
          : b
      );
      saveToStorage(STORAGE_KEYS.BUDGETS, updated);
      return updated;
    });

    addAuditLog(
      'aprobó presupuesto',
      'presupuesto',
      budgetId,
      `Aprobó presupuesto ${budget.number} y lo convirtió en el proyecto activo ${code}`
    );
    broadcastSync('DATA_RELOAD');
    return newProject;
  }, [budgets, projects.length, currentUser, addAuditLog, broadcastSync]);

  // POST-ITS CRUD
  const addPostIt = useCallback((data: Omit<PostIt, 'id' | 'createdAt' | 'updatedAt' | 'authorId' | 'authorName'>): PostIt => {
    const newNote: PostIt = {
      ...data,
      id: generateId('note'),
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPostIts(prev => {
      const updated = [newNote, ...prev];
      saveToStorage(STORAGE_KEYS.POSTITS, updated);
      return updated;
    });
    addAuditLog('creó', 'nota', newNote.id, `Agregó la nota rápida "${newNote.title}"`);
    broadcastSync('DATA_RELOAD');
    return newNote;
  }, [currentUser, addAuditLog, broadcastSync]);

  const updatePostIt = useCallback((id: string, data: Partial<PostIt>) => {
    setPostIts(prev => {
      const updated = prev.map(n =>
        n.id === id
          ? {
              ...n,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : n
      );
      saveToStorage(STORAGE_KEYS.POSTITS, updated);
      return updated;
    });
    broadcastSync('DATA_RELOAD');
  }, [broadcastSync]);

  const deletePostIt = useCallback((id: string) => {
    setPostIts(prev => {
      const updated = prev.filter(n => n.id !== id);
      saveToStorage(STORAGE_KEYS.POSTITS, updated);
      return updated;
    });
    broadcastSync('DATA_RELOAD');
  }, [broadcastSync]);

  // BACKUP & RESTORE
  const exportDataJSON = useCallback(() => {
    const bundle = {
      app: 'UNKE Dashboard',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.name,
      clients,
      projects,
      budgets,
      postIts,
      team,
      studioBank,
      auditLogs,
    };
    return JSON.stringify(bundle, null, 2);
  }, [currentUser, clients, projects, budgets, postIts, team, studioBank, auditLogs]);

  const importDataJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (data.clients) {
        setClients(data.clients);
        saveToStorage(STORAGE_KEYS.CLIENTS, data.clients);
      }
      if (data.projects) {
        setProjects(data.projects);
        saveToStorage(STORAGE_KEYS.PROJECTS, data.projects);
      }
      if (data.budgets) {
        setBudgets(data.budgets);
        saveToStorage(STORAGE_KEYS.BUDGETS, data.budgets);
      }
      if (data.postIts) {
        setPostIts(data.postIts);
        saveToStorage(STORAGE_KEYS.POSTITS, data.postIts);
      }
      if (data.team) {
        setTeam(data.team);
        saveToStorage(STORAGE_KEYS.TEAM, data.team);
      }
      if (data.studioBank) {
        setStudioBank(data.studioBank);
        saveToStorage(STORAGE_KEYS.STUDIO_INFO, data.studioBank);
      }
      if (data.auditLogs) {
        setAuditLogs(data.auditLogs);
        saveToStorage(STORAGE_KEYS.AUDIT_LOGS, data.auditLogs);
      }
      broadcastSync('DATA_RELOAD');
      return true;
    } catch (e) {
      console.error('Error importing backup JSON:', e);
      return false;
    }
  }, [broadcastSync]);

  const resetToSampleData = useCallback(() => {
    setClients(INITIAL_CLIENTS);
    setProjects(INITIAL_PROJECTS);
    setBudgets(INITIAL_BUDGETS);
    setPostIts(INITIAL_POSTITS);
    setTeam(DEFAULT_TEAM);
    setStudioBank(DEFAULT_STUDIO_BANK);
    setAuditLogs(INITIAL_AUDIT_LOGS);

    saveToStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    saveToStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
    saveToStorage(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS);
    saveToStorage(STORAGE_KEYS.POSTITS, INITIAL_POSTITS);
    saveToStorage(STORAGE_KEYS.TEAM, DEFAULT_TEAM);
    saveToStorage(STORAGE_KEYS.STUDIO_INFO, DEFAULT_STUDIO_BANK);
    saveToStorage(STORAGE_KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);

    broadcastSync('DATA_RELOAD');
  }, [broadcastSync]);

  return (
    <StudioContext.Provider
      value={{
        isAuthenticated,
        login,
        logout,
        inactivityLoggedOut,
        clearInactivityNotice,
        currentUser,
        team,
        setCurrentUser,
        updateTeamMember,
        activePresences,
        currentEditingItem,
        startEditingItem,
        stopEditingItem,
        otherEditorWarning,
        clients,
        addClient,
        updateClient,
        deleteClient,
        projects,
        addProject,
        updateProject,
        deleteProject,
        toggleDeliverable,
        recordPayment,
        toggleMonthlyPayment,
        budgets,
        addBudget,
        updateBudget,
        deleteBudget,
        convertBudgetToProject,
        duplicateBudget,
        postIts,
        addPostIt,
        updatePostIt,
        deletePostIt,
        auditLogs,
        darkMode,
        setDarkMode,
        toggleDarkMode,
        studioBank,
        updateStudioBank,
        exportDataJSON,
        importDataJSON,
        resetToSampleData,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
};

export const useStudio = () => {
  const context = useContext(StudioContext);
  if (!context) {
    throw new Error('useStudio must be used within a StudioProvider');
  }
  return context;
};
