import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  ActiveUserPresence,
  AuditLogItem,
  BankAccountDetails,
  Budget,
  Client,
  PostIt,
  Project,
  TeamMember,
} from '../types';
import {
  DEFAULT_STUDIO_BANK,
  DEFAULT_TEAM,
  DEFAULT_USER_BANKS,
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
import { playUserJoinedSound } from '../utils/audio';
import { FirestoreService } from '../services/firestoreService';

export interface ConnectionToastData {
  id: number;
  memberName: string;
  memberInitials: string;
  memberColor: string;
  timestamp: number;
}

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
  connectionToast: ConnectionToastData | null;
  dismissConnectionToast: () => void;
  playNotificationChime: () => void;

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

  // Studio Bank & Individual User Banks
  studioBank: BankAccountDetails;
  updateStudioBank: (bank: BankAccountDetails) => void;
  userBanks: Record<string, BankAccountDetails>;
  updateUserBank: (memberId: string, bank: BankAccountDetails) => void;

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

  // Per-tab unique session ID for multi-device/multi-window
  const tabIdRef = useRef<string>(
    typeof window !== 'undefined'
      ? (window.sessionStorage.getItem('unke_tab_instance_id') ||
         Math.random().toString(36).substring(2, 9))
      : 'tab_' + Math.random().toString(36).substring(2, 7)
  );

  useEffect(() => {
    try {
      window.sessionStorage.setItem('unke_tab_instance_id', tabIdRef.current);
    } catch {
      // ignore
    }
  }, []);

  // Team & Current User
  const [team, setTeam] = useState<TeamMember[]>(() => {
    const stored = loadFromStorage<TeamMember[]>(STORAGE_KEYS.TEAM, DEFAULT_TEAM);
    return stored.map(m => {
      const defaultMatch = DEFAULT_TEAM.find(d => d.id === m.id);
      if (defaultMatch) {
        return { ...m, avatarColor: defaultMatch.avatarColor };
      }
      return m;
    });
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const sess = sessionStorage.getItem('unke_session_current_user_id');
      if (sess) return sess;
    } catch {
      // ignore
    }
    return loadFromStorage(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_TEAM[0].id);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const sess = sessionStorage.getItem('unke_session_auth');
      if (sess !== null) return JSON.parse(sess);
    } catch {
      // ignore
    }
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
  const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes inactivity

  // Connection Toast state for newly joined users
  const [connectionToast, setConnectionToast] = useState<ConnectionToastData | null>(null);

  const dismissConnectionToast = useCallback(() => {
    setConnectionToast(null);
  }, []);

  const playNotificationChime = useCallback(() => {
    playUserJoinedSound();
  }, []);

  // Set of known online member IDs to detect transitions (0 -> 1 connected)
  const knownOnlineMembersRef = useRef<Set<string>>(new Set());

  // Data Collections (Backed by Firestore in cloud + localStorage for instant offline startup)
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

  // Studio Bank Details
  const [studioBank, setStudioBank] = useState<BankAccountDetails>(() => {
    return loadFromStorage(STORAGE_KEYS.STUDIO_INFO, DEFAULT_STUDIO_BANK);
  });

  const updateStudioBank = useCallback((bank: BankAccountDetails) => {
    setStudioBank(bank);
    saveToStorage(STORAGE_KEYS.STUDIO_INFO, bank);
    FirestoreService.saveStudioBank(bank);
  }, []);

  // Individual User Bank Accounts (Nacho, Fede, Willy)
  const [userBanks, setUserBanks] = useState<Record<string, BankAccountDetails>>(() => {
    return loadFromStorage(STORAGE_KEYS.USER_BANKS, DEFAULT_USER_BANKS);
  });

  const updateUserBank = useCallback((memberId: string, bank: BankAccountDetails) => {
    setUserBanks(prev => {
      const next = { ...prev, [memberId]: bank };
      saveToStorage(STORAGE_KEYS.USER_BANKS, next);
      FirestoreService.saveUserBanks(next);
      return next;
    });
  }, []);

  // Realtime Presence & Editing Collisions
  const [activePresences, setActivePresences] = useState<ActiveUserPresence[]>([]);
  const [currentEditingItem, setCurrentEditingItem] = useState<{ id: string; title: string } | null>(null);
  const [otherEditorWarning, setOtherEditorWarning] = useState<string | null>(null);

  // Sync initial local data to Firestore if cloud is newly initialized
  useEffect(() => {
    FirestoreService.syncLocalToCloudIfEmpty({
      clients: loadFromStorage(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS),
      projects: loadFromStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS),
      budgets: loadFromStorage(STORAGE_KEYS.BUDGETS, INITIAL_BUDGETS),
      postIts: loadFromStorage(STORAGE_KEYS.POSTITS, INITIAL_POSTITS),
      team: loadFromStorage(STORAGE_KEYS.TEAM, DEFAULT_TEAM),
      studioBank: loadFromStorage(STORAGE_KEYS.STUDIO_INFO, DEFAULT_STUDIO_BANK),
    });
  }, []);

  // --- FIRESTORE REALTIME SUBSCRIPTIONS (LIVE DATA FOR ALL USERS) ---
  useEffect(() => {
    // 1. Clients
    const unsubClients = FirestoreService.subscribeClients(cloudClients => {
      setClients(cloudClients);
      saveToStorage(STORAGE_KEYS.CLIENTS, cloudClients);
    });

    // 2. Projects
    const unsubProjects = FirestoreService.subscribeProjects(cloudProjects => {
      setProjects(cloudProjects);
      saveToStorage(STORAGE_KEYS.PROJECTS, cloudProjects);
    });

    // 3. Budgets
    const unsubBudgets = FirestoreService.subscribeBudgets(cloudBudgets => {
      setBudgets(cloudBudgets);
      saveToStorage(STORAGE_KEYS.BUDGETS, cloudBudgets);
    });

    // 4. Post-its
    const unsubPostIts = FirestoreService.subscribePostIts(cloudPostIts => {
      setPostIts(cloudPostIts);
      saveToStorage(STORAGE_KEYS.POSTITS, cloudPostIts);
    });

    // 5. Audit Logs
    const unsubAudit = FirestoreService.subscribeAuditLogs(cloudLogs => {
      setAuditLogs(cloudLogs);
      saveToStorage(STORAGE_KEYS.AUDIT_LOGS, cloudLogs);
    });

    // 6. Team Members
    const unsubTeam = FirestoreService.subscribeTeam(cloudTeam => {
      setTeam(cloudTeam);
      saveToStorage(STORAGE_KEYS.TEAM, cloudTeam);
    });

    // 7. Bank Settings
    const unsubBank = FirestoreService.subscribeStudioBank(cloudBank => {
      setStudioBank(cloudBank);
      saveToStorage(STORAGE_KEYS.STUDIO_INFO, cloudBank);
    });

    // 8. Individual User Banks
    const unsubUserBanks = FirestoreService.subscribeUserBanks(cloudUserBanks => {
      if (cloudUserBanks && Object.keys(cloudUserBanks).length > 0) {
        setUserBanks(cloudUserBanks as Record<string, BankAccountDetails>);
        saveToStorage(STORAGE_KEYS.USER_BANKS, cloudUserBanks);
      }
    });

    return () => {
      unsubClients();
      unsubProjects();
      unsubBudgets();
      unsubPostIts();
      unsubAudit();
      unsubTeam();
      unsubBank();
      unsubUserBanks();
    };
  }, []);

  // Notify when a new member connects
  const handleNewMemberConnected = useCallback((member: { id: string; name: string; initials: string; color: string }) => {
    if (!isAuthenticated || member.id === currentUser.id) return;
    
    // Play chime audio
    playUserJoinedSound();

    // Show visual banner/toast
    setConnectionToast({
      id: Date.now(),
      memberName: member.name,
      memberInitials: member.initials,
      memberColor: member.color,
      timestamp: Date.now(),
    });
  }, [isAuthenticated, currentUser.id]);

  // Realtime Presences Firestore subscription
  useEffect(() => {
    const unsubPresences = FirestoreService.subscribePresences(cloudPresences => {
      const now = Date.now();
      const valid = cloudPresences.filter(p => now - p.lastHeartbeat < 15000);
      setActivePresences(valid);

      // Check for newly joined teammates
      valid.forEach(p => {
        if (p.memberId !== currentUser.id && !knownOnlineMembersRef.current.has(p.memberId)) {
          knownOnlineMembersRef.current.add(p.memberId);
          handleNewMemberConnected({
            id: p.memberId,
            name: p.memberName,
            initials: p.memberInitials,
            color: p.memberColor,
          });
        }
      });

      // Collision check
      if (currentEditingItem) {
        const collision = valid.find(
          p => p.editingItemId === currentEditingItem.id && p.memberId !== currentUser.id
        );
        if (collision) {
          setOtherEditorWarning(
            `⚠️ ¡Atención! ${collision.memberName} también está editando "${currentEditingItem.title}". Coordinen para no pisar cambios.`
          );
        } else {
          setOtherEditorWarning(null);
        }
      }
    });

    return () => unsubPresences();
  }, [currentUser.id, currentEditingItem, handleNewMemberConnected]);

  // Sync presence heartbeat to Cloud Firestore
  const syncPresenceHeartbeat = useCallback(() => {
    if (!isAuthenticated) return;

    const currentPresence: ActiveUserPresence = {
      tabId: tabIdRef.current,
      memberId: currentUser.id,
      memberName: currentUser.name,
      memberInitials: currentUser.initials,
      memberColor: currentUser.avatarColor,
      currentView: activeTab,
      editingItemId: currentEditingItem?.id || null,
      editingItemTitle: currentEditingItem?.title || null,
      lastHeartbeat: Date.now(),
    };

    FirestoreService.savePresence(currentPresence);
  }, [isAuthenticated, currentUser, activeTab, currentEditingItem]);

  // Remove presence on logout or page close
  const removeMyPresence = useCallback(() => {
    if (currentUser?.id) {
      FirestoreService.removePresence(currentUser.id, tabIdRef.current);
    }
  }, [currentUser?.id]);

  // Periodic heartbeat timer (every 4s to cloud Firestore)
  useEffect(() => {
    if (!isAuthenticated) return;

    syncPresenceHeartbeat();
    const interval = setInterval(syncPresenceHeartbeat, 4000);

    const handleBeforeUnload = () => {
      removeMyPresence();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isAuthenticated, syncPresenceHeartbeat, removeMyPresence]);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!connectionToast) return;
    const timer = setTimeout(() => {
      setConnectionToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [connectionToast]);

  // Login
  const login = useCallback((memberId: string, passwordInput: string) => {
    const member = team.find(m => m.id === memberId);
    if (!member) {
      return { success: false, error: 'Usuario no encontrado.' };
    }

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

    // Save in sessionStorage (tab isolated) + localStorage
    try {
      sessionStorage.setItem('unke_session_current_user_id', member.id);
      sessionStorage.setItem('unke_session_auth', JSON.stringify(true));
    } catch {
      // ignore
    }

    setCurrentUserId(member.id);
    saveToStorage(STORAGE_KEYS.CURRENT_USER_ID, member.id);
    setIsAuthenticated(true);
    saveToStorage(STORAGE_KEYS.AUTH_SESSION, true);
    setInactivityLoggedOut(false);
    setActiveTab('dashboard');

    // Register presence in cloud
    const currentPresence: ActiveUserPresence = {
      tabId: tabIdRef.current,
      memberId: member.id,
      memberName: member.name,
      memberInitials: member.initials,
      memberColor: member.avatarColor,
      currentView: 'dashboard',
      editingItemId: null,
      editingItemTitle: null,
      lastHeartbeat: now,
    };
    FirestoreService.savePresence(currentPresence);

    return { success: true };
  }, [team]);

  // Logout
  const logout = useCallback(() => {
    removeMyPresence();
    try {
      sessionStorage.removeItem('unke_session_auth');
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    saveToStorage(STORAGE_KEYS.AUTH_SESSION, false);
    setActiveTab('dashboard');
  }, [removeMyPresence]);

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

    const interval = setInterval(() => {
      const storedLastActivity = loadFromStorage<number>(STORAGE_KEYS.LAST_ACTIVITY, lastActivityRef.current);
      const effectiveLastActivity = Math.max(lastActivityRef.current, storedLastActivity);

      if (Date.now() - effectiveLastActivity >= INACTIVITY_TIMEOUT_MS) {
        setInactivityLoggedOut(true);
        logout();
      }
    }, 4000);

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
    FirestoreService.saveTeamMember(updated);
  }, []);

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
    FirestoreService.saveAuditLog(newLog);
  }, [currentUser]);

  // Start / Stop Editing Item helpers
  const startEditingItem = useCallback((id: string, title: string) => {
    setCurrentEditingItem({ id, title });

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
      const next = [newClient, ...prev.filter(c => c.id !== newClient.id)];
      saveToStorage(STORAGE_KEYS.CLIENTS, next);
      return next;
    });
    FirestoreService.saveClient(newClient);
    addAuditLog('creó', 'cliente', newClient.id, `Creó el cliente "${newClient.name}"`);
    return newClient;
  }, [currentUser, addAuditLog]);

  const updateClient = useCallback((id: string, clientData: Partial<Client>) => {
    const existing = clients.find(c => c.id === id);
    if (!existing) return;

    const updated: Client = {
      ...existing,
      ...clientData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };
    setClients(prev => {
      const next = prev.map(c => (c.id === id ? updated : c));
      saveToStorage(STORAGE_KEYS.CLIENTS, next);
      return next;
    });
    FirestoreService.saveClient(updated);
    addAuditLog('editó', 'cliente', id, `Actualizó datos del cliente`);
  }, [clients, currentUser, addAuditLog]);

  const deleteClient = useCallback((id: string) => {
    const target = clients.find(c => c.id === id);
    setClients(prev => {
      const next = prev.filter(c => c.id !== id);
      saveToStorage(STORAGE_KEYS.CLIENTS, next);
      return next;
    });
    FirestoreService.deleteClient(id);
    if (target) {
      addAuditLog('eliminó', 'cliente', id, `Eliminó el cliente "${target.name}"`);
    }
  }, [clients, addAuditLog]);

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
      const next = [newProject, ...prev.filter(p => p.id !== newProject.id)];
      saveToStorage(STORAGE_KEYS.PROJECTS, next);
      return next;
    });

    FirestoreService.saveProject(newProject);
    addAuditLog(
      'creó',
      'proyecto',
      newProject.id,
      `Creó el ${newProject.type === 'mantenimiento' ? 'abono' : 'proyecto'} "${newProject.title}" para ${newProject.clientName}`
    );
    return newProject;
  }, [currentUser, projects.length, addAuditLog]);

  const updateProject = useCallback((id: string, projectData: Partial<Project>) => {
    const existing = projects.find(p => p.id === id);
    if (!existing) return;

    const updated: Project = {
      ...existing,
      ...projectData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };
    setProjects(prev => {
      const next = prev.map(p => (p.id === id ? updated : p));
      saveToStorage(STORAGE_KEYS.PROJECTS, next);
      return next;
    });
    FirestoreService.saveProject(updated);
    addAuditLog('editó', 'proyecto', id, `Actualizó proyecto`);
  }, [projects, currentUser, addAuditLog]);

  const deleteProject = useCallback((id: string) => {
    const target = projects.find(p => p.id === id);
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id);
      saveToStorage(STORAGE_KEYS.PROJECTS, next);
      return next;
    });
    FirestoreService.deleteProject(id);
    if (target) {
      addAuditLog('eliminó', 'proyecto', id, `Eliminó el proyecto "${target.title}"`);
    }
  }, [projects, addAuditLog]);

  const toggleDeliverable = useCallback((projectId: string, deliverableId: string) => {
    const p = projects.find(proj => proj.id === projectId);
    if (!p) return;

    const nextDeliverables = p.deliverables.map(d =>
      d.id === deliverableId ? { ...d, done: !d.done } : d
    );
    const updated: Project = {
      ...p,
      deliverables: nextDeliverables,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };
    setProjects(prev => {
      const next = prev.map(proj => (proj.id === projectId ? updated : proj));
      saveToStorage(STORAGE_KEYS.PROJECTS, next);
      return next;
    });
    FirestoreService.saveProject(updated);
  }, [projects, currentUser]);

  const recordPayment = useCallback((projectId: string, amount: number, method: string, notes?: string) => {
    const p = projects.find(proj => proj.id === projectId);
    if (!p) return;

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

    const updated: Project = {
      ...p,
      paidAmount: newPaid,
      paymentStatus: newStatus as Project['paymentStatus'],
      paymentsHistory: [newRecord, ...(p.paymentsHistory || [])],
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };
    setProjects(prev => {
      const next = prev.map(proj => (proj.id === projectId ? updated : proj));
      saveToStorage(STORAGE_KEYS.PROJECTS, next);
      return next;
    });
    FirestoreService.saveProject(updated);
    addAuditLog('registró pago', 'proyecto', projectId, `Registró pago por $ ${amount.toLocaleString('es-AR')}`);
  }, [projects, currentUser, addAuditLog]);

  const toggleMonthlyPayment = useCallback((projectId: string, monthYear: string) => {
    const p = projects.find(proj => proj.id === projectId);
    if (!p) return;

    const isCurrentlyPaidForMonth = p.lastMonthlyPaymentDate === monthYear;
    const nextLastDate = isCurrentlyPaidForMonth ? '' : monthYear;
    const nextStatus = isCurrentlyPaidForMonth ? 'pendiente' : 'al_dia';

    const updated: Project = {
      ...p,
      lastMonthlyPaymentDate: nextLastDate,
      paymentStatus: nextStatus as Project['paymentStatus'],
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };
    setProjects(prev => {
      const next = prev.map(proj => (proj.id === projectId ? updated : proj));
      saveToStorage(STORAGE_KEYS.PROJECTS, next);
      return next;
    });
    FirestoreService.saveProject(updated);
  }, [projects, currentUser]);

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
      const next = [newBudget, ...prev.filter(b => b.id !== newBudget.id)];
      saveToStorage(STORAGE_KEYS.BUDGETS, next);
      return next;
    });
    FirestoreService.saveBudget(newBudget);
    addAuditLog('creó', 'presupuesto', newBudget.id, `Creó el presupuesto ${newBudget.number} para ${newBudget.clientName}`);
    return newBudget;
  }, [currentUser, budgets.length, addAuditLog]);

  const updateBudget = useCallback((id: string, budgetData: Partial<Budget>) => {
    const existing = budgets.find(b => b.id === id);
    if (!existing) return;

    const updated: Budget = {
      ...existing,
      ...budgetData,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };
    setBudgets(prev => {
      const next = prev.map(b => (b.id === id ? updated : b));
      saveToStorage(STORAGE_KEYS.BUDGETS, next);
      return next;
    });
    FirestoreService.saveBudget(updated);
    addAuditLog('editó', 'presupuesto', id, `Actualizó presupuesto`);
  }, [budgets, currentUser, addAuditLog]);

  const deleteBudget = useCallback((id: string) => {
    const target = budgets.find(b => b.id === id);
    setBudgets(prev => {
      const next = prev.filter(b => b.id !== id);
      saveToStorage(STORAGE_KEYS.BUDGETS, next);
      return next;
    });
    FirestoreService.deleteBudget(id);
    if (target) {
      addAuditLog('eliminó', 'presupuesto', id, `Eliminó el presupuesto ${target.number}`);
    }
  }, [budgets, addAuditLog]);

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
      const next = [duplicated, ...prev.filter(b => b.id !== duplicated.id)];
      saveToStorage(STORAGE_KEYS.BUDGETS, next);
      return next;
    });
    FirestoreService.saveBudget(duplicated);
    addAuditLog('creó', 'presupuesto', duplicated.id, `Duplicó presupuesto ${original.number} como ${duplicated.number}`);
    return duplicated;
  }, [budgets, currentUser, addAuditLog]);

  const convertBudgetToProject = useCallback((budgetId: string): Project | null => {
    const budget = budgets.find(b => b.id === budgetId);
    if (!budget) return null;

    const deliverables = budget.items.map(item => ({
      id: generateId('del'),
      title: item.description,
      done: false,
    }));

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
      monthlyBillingDay: budget.projectType === 'mantenimiento' || budget.projectType === 'hibrido' ? 5 : undefined,
      startDate: new Date().toISOString().split('T')[0],
      deliveryDate,
      tags: [
        budget.projectType === 'mantenimiento'
          ? 'Abono Mensual'
          : budget.projectType === 'hibrido'
          ? 'Puntual + Abono'
          : 'Proyecto Puntual',
      ],
      deliverables,
      paymentsHistory: [],
      createdBy: currentUser.name,
      createdAt: new Date().toISOString(),
      updatedBy: currentUser.name,
      updatedAt: new Date().toISOString(),
    };

    const updatedBudget: Budget = {
      ...budget,
      status: 'aprobado' as Budget['status'],
      convertedToProjectId: newProject.id,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    setProjects(prev => {
      const next = [newProject, ...prev.filter(p => p.id !== newProject.id)];
      saveToStorage(STORAGE_KEYS.PROJECTS, next);
      return next;
    });

    setBudgets(prev => {
      const next = prev.map(b => (b.id === budgetId ? updatedBudget : b));
      saveToStorage(STORAGE_KEYS.BUDGETS, next);
      return next;
    });

    FirestoreService.saveProject(newProject);
    FirestoreService.saveBudget(updatedBudget);

    addAuditLog(
      'aprobó presupuesto',
      'presupuesto',
      budgetId,
      `Aprobó presupuesto ${budget.number} y lo convirtió en el proyecto activo ${code}`
    );
    return newProject;
  }, [budgets, projects.length, currentUser, addAuditLog]);

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
      const next = [newNote, ...prev.filter(n => n.id !== newNote.id)];
      saveToStorage(STORAGE_KEYS.POSTITS, next);
      return next;
    });
    FirestoreService.savePostIt(newNote);
    addAuditLog('creó', 'nota', newNote.id, `Agregó la nota rápida "${newNote.title}"`);
    return newNote;
  }, [currentUser, addAuditLog]);

  const updatePostIt = useCallback((id: string, data: Partial<PostIt>) => {
    const existing = postIts.find(n => n.id === id);
    if (!existing) return;

    const updated: PostIt = {
      ...existing,
      ...data,
      updatedAt: new Date().toISOString(),
    };
    setPostIts(prev => {
      const next = prev.map(n => (n.id === id ? updated : n));
      saveToStorage(STORAGE_KEYS.POSTITS, next);
      return next;
    });
    FirestoreService.savePostIt(updated);
  }, [postIts]);

  const deletePostIt = useCallback((id: string) => {
    setPostIts(prev => {
      const next = prev.filter(n => n.id !== id);
      saveToStorage(STORAGE_KEYS.POSTITS, next);
      return next;
    });
    FirestoreService.deletePostIt(id);
  }, []);

  // BACKUP & RESTORE
  const exportDataJSON = useCallback(() => {
    const bundle = {
      app: 'UNKE Dashboard',
      version: '5.0_cloud',
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser.name,
      clients,
      projects,
      budgets,
      postIts,
      team,
      studioBank,
      userBanks,
      auditLogs,
    };
    return JSON.stringify(bundle, null, 2);
  }, [currentUser, clients, projects, budgets, postIts, team, studioBank, userBanks, auditLogs]);

  const importDataJSON = useCallback((jsonString: string): boolean => {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.clients)) {
        data.clients.forEach((c: Client) => FirestoreService.saveClient(c));
      }
      if (Array.isArray(data.projects)) {
        data.projects.forEach((p: Project) => FirestoreService.saveProject(p));
      }
      if (Array.isArray(data.budgets)) {
        data.budgets.forEach((b: Budget) => FirestoreService.saveBudget(b));
      }
      if (Array.isArray(data.postIts)) {
        data.postIts.forEach((post: PostIt) => FirestoreService.savePostIt(post));
      }
      if (Array.isArray(data.team)) {
        data.team.forEach((t: TeamMember) => FirestoreService.saveTeamMember(t));
      }
      if (data.studioBank) {
        FirestoreService.saveStudioBank(data.studioBank);
      }
      if (data.userBanks) {
        FirestoreService.saveUserBanks(data.userBanks);
      }
      if (Array.isArray(data.auditLogs)) {
        data.auditLogs.forEach((log: AuditLogItem) => FirestoreService.saveAuditLog(log));
      }
      return true;
    } catch (e) {
      console.error('Error importing backup JSON:', e);
      return false;
    }
  }, []);

  const resetToSampleData = useCallback(() => {
    clients.forEach(c => FirestoreService.deleteClient(c.id));
    projects.forEach(p => FirestoreService.deleteProject(p.id));
    budgets.forEach(b => FirestoreService.deleteBudget(b.id));
    postIts.forEach(post => FirestoreService.deletePostIt(post.id));
    DEFAULT_TEAM.forEach(t => FirestoreService.saveTeamMember(t));
    FirestoreService.saveStudioBank(DEFAULT_STUDIO_BANK);
    FirestoreService.saveUserBanks(DEFAULT_USER_BANKS);
  }, [clients, projects, budgets, postIts]);

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
        connectionToast,
        dismissConnectionToast,
        playNotificationChime,
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
        userBanks,
        updateUserBank,
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
