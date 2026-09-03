import {
  BankAccountDetails,
  Budget,
  Client,
  PostIt,
  Project,
  TeamMember,
  AuditLogItem,
} from '../types';

export const STORAGE_KEYS = {
  CLIENTS: 'unke_clients_v4',
  PROJECTS: 'unke_projects_v4',
  BUDGETS: 'unke_budgets_v4',
  POSTITS: 'unke_postits_v4',
  EXPENSES: 'unke_expenses_v4',
  TEAM: 'unke_team_members_v4',
  CURRENT_USER_ID: 'unke_current_user_id_v4',
  AUDIT_LOGS: 'unke_audit_logs_v4',
  STUDIO_INFO: 'unke_studio_info_v4',
  USER_BANKS: 'unke_user_banks_v4',
  DARK_MODE: 'unke_dark_mode_v4',
  AUTH_SESSION: 'unke_auth_session_v4',
  LAST_ACTIVITY: 'unke_last_activity_v4',
  ACTIVE_PRESENCES: 'unke_active_presences_v4',
  DATA_SYNC_TIMESTAMP: 'unke_data_sync_timestamp_v4',
};

// Official 3 members of UNKE Studio
export const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'member_nacho',
    name: 'Nacho Bieski',
    role: 'Dirección de Arte & Identidad',
    email: 'nacho@unke.com.ar',
    avatarColor: '#27655d',
    initials: 'NB',
    password: 'nachounke',
  },
  {
    id: 'member_fede',
    name: 'Fede Messina',
    role: 'Estrategia, Contenido & Comunicación',
    email: 'fede@unke.com.ar',
    avatarColor: '#34877c',
    initials: 'FM',
    password: 'fedeunke',
  },
  {
    id: 'member_willy',
    name: 'Willy Morinigo',
    role: 'Diseño Web, UI/UX & Sistemas',
    email: 'willy@unke.com.ar',
    avatarColor: '#5d9f96',
    initials: 'WM',
    password: 'willyunke',
  },
];

export const DEFAULT_STUDIO_BANK: BankAccountDetails = {
  bank: 'Banco Galicia',
  accountHolder: 'UNKE ESTUDIO DCV S.H.',
  cbu: '0070142820000012894567',
  alias: 'UNKE.ESTUDIO.DCV',
  cuit: '30-71829304-9',
};

export const DEFAULT_USER_BANKS: Record<string, BankAccountDetails> = {
  member_nacho: {
    bank: 'Banco Santander',
    accountHolder: 'Ignacio Bieski',
    cbu: '0720023488000038491023',
    alias: 'NACHO.UNKE.DCV',
    cuit: '20-38491023-4',
  },
  member_fede: {
    bank: 'Banco Galicia',
    accountHolder: 'Federico Messina',
    cbu: '0070183988000049281742',
    alias: 'FEDE.UNKE.DCV',
    cuit: '20-37281742-9',
  },
  member_willy: {
    bank: 'Banco BBVA',
    accountHolder: 'Willy Morinigo',
    cbu: '0170092388000051928371',
    alias: 'WILLY.UNKE.DCV',
    cuit: '20-36928371-3',
  },
};

// Zero demo data: Start clean for real production usage by UNKE
export const INITIAL_CLIENTS: Client[] = [];
export const INITIAL_PROJECTS: Project[] = [];
export const INITIAL_BUDGETS: Budget[] = [];
export const INITIAL_POSTITS: PostIt[] = [];
export const INITIAL_EXPENSES: any[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [];

// Helper functions for loading and saving
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error loading key ${key} from storage:`, error);
    try {
      const backupItem = localStorage.getItem(`${key}_recovery`);
      if (backupItem) {
        return JSON.parse(backupItem);
      }
    } catch {
      // ignore
    }
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    try {
      localStorage.setItem(`${key}_recovery`, serialized);
    } catch {
      // ignore secondary storage error
    }
  } catch (error) {
    console.error(`Error saving key ${key} to storage:`, error);
  }
}
