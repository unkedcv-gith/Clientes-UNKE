import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Client,
  Project,
  Budget,
  PostIt,
  AuditLogItem,
  TeamMember,
  ActiveUserPresence,
} from '../types';

// Collection references
const CLIENTS_COLLECTION = 'clients';
const PROJECTS_COLLECTION = 'projects';
const BUDGETS_COLLECTION = 'budgets';
const POSTITS_COLLECTION = 'postits';
const AUDIT_LOGS_COLLECTION = 'audit_logs';
const TEAM_COLLECTION = 'team';
const PRESENCES_COLLECTION = 'presences';
const SETTINGS_COLLECTION = 'settings';

/**
 * Strips undefined properties recursively so Firestore does not reject the document write
 */
function sanitizeForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj as any)) {
      if (value !== undefined) {
        cleaned[key] = sanitizeForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

export const FirestoreService = {
  // --- REALTIME SUBSCRIBERS ---

  subscribeClients(callback: (clients: Client[]) => void) {
    return onSnapshot(
      collection(db, CLIENTS_COLLECTION),
      snapshot => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Client));
        callback(items);
      },
      error => console.error('Error in clients snapshot:', error)
    );
  },

  subscribeProjects(callback: (projects: Project[]) => void) {
    return onSnapshot(
      collection(db, PROJECTS_COLLECTION),
      snapshot => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Project));
        callback(items);
      },
      error => console.error('Error in projects snapshot:', error)
    );
  },

  subscribeBudgets(callback: (budgets: Budget[]) => void) {
    return onSnapshot(
      collection(db, BUDGETS_COLLECTION),
      snapshot => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Budget));
        callback(items);
      },
      error => console.error('Error in budgets snapshot:', error)
    );
  },

  subscribePostIts(callback: (postits: PostIt[]) => void) {
    return onSnapshot(
      collection(db, POSTITS_COLLECTION),
      snapshot => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PostIt));
        callback(items);
      },
      error => console.error('Error in postits snapshot:', error)
    );
  },

  subscribeAuditLogs(callback: (logs: AuditLogItem[]) => void) {
    return onSnapshot(
      collection(db, AUDIT_LOGS_COLLECTION),
      snapshot => {
        const items = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() } as AuditLogItem))
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 100);
        callback(items);
      },
      error => console.error('Error in audit logs snapshot:', error)
    );
  },

  subscribeTeam(callback: (team: TeamMember[]) => void) {
    return onSnapshot(
      collection(db, TEAM_COLLECTION),
      snapshot => {
        if (!snapshot.empty) {
          const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TeamMember));
          callback(items);
        }
      },
      error => console.error('Error in team snapshot:', error)
    );
  },

  subscribePresences(callback: (presences: ActiveUserPresence[]) => void) {
    return onSnapshot(
      collection(db, PRESENCES_COLLECTION),
      snapshot => {
        const now = Date.now();
        const items = snapshot.docs
          .map(d => ({ ...d.data() } as ActiveUserPresence))
          .filter(p => p.lastHeartbeat && now - p.lastHeartbeat < 15000);
        callback(items);
      },
      error => console.error('Error in presences snapshot:', error)
    );
  },

  subscribeStudioBank(callback: (bank: any) => void) {
    return onSnapshot(
      doc(db, SETTINGS_COLLECTION, 'bank_details'),
      snapshot => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        }
      },
      error => console.error('Error in bank details snapshot:', error)
    );
  },

  subscribeUserBanks(callback: (userBanks: Record<string, any>) => void) {
    return onSnapshot(
      doc(db, SETTINGS_COLLECTION, 'user_banks'),
      snapshot => {
        if (snapshot.exists()) {
          callback(snapshot.data());
        }
      },
      error => console.error('Error in user banks snapshot:', error)
    );
  },

  // --- WRITE OPERATIONS ---

  async saveClient(client: Client) {
    try {
      const sanitized = sanitizeForFirestore(client);
      await setDoc(doc(db, CLIENTS_COLLECTION, client.id), sanitized);
    } catch (err) {
      console.error('Error saving client to Firestore:', err);
    }
  },

  async deleteClient(id: string) {
    try {
      await deleteDoc(doc(db, CLIENTS_COLLECTION, id));
    } catch (err) {
      console.error('Error deleting client from Firestore:', err);
    }
  },

  async saveProject(project: Project) {
    try {
      const sanitized = sanitizeForFirestore(project);
      await setDoc(doc(db, PROJECTS_COLLECTION, project.id), sanitized);
    } catch (err) {
      console.error('Error saving project to Firestore:', err);
    }
  },

  async deleteProject(id: string) {
    try {
      await deleteDoc(doc(db, PROJECTS_COLLECTION, id));
    } catch (err) {
      console.error('Error deleting project from Firestore:', err);
    }
  },

  async saveBudget(budget: Budget) {
    try {
      const sanitized = sanitizeForFirestore(budget);
      await setDoc(doc(db, BUDGETS_COLLECTION, budget.id), sanitized);
    } catch (err) {
      console.error('Error saving budget to Firestore:', err);
    }
  },

  async deleteBudget(id: string) {
    try {
      await deleteDoc(doc(db, BUDGETS_COLLECTION, id));
    } catch (err) {
      console.error('Error deleting budget from Firestore:', err);
    }
  },

  async savePostIt(postIt: PostIt) {
    try {
      const sanitized = sanitizeForFirestore(postIt);
      await setDoc(doc(db, POSTITS_COLLECTION, postIt.id), sanitized);
    } catch (err) {
      console.error('Error saving post-it to Firestore:', err);
    }
  },

  async deletePostIt(id: string) {
    try {
      await deleteDoc(doc(db, POSTITS_COLLECTION, id));
    } catch (err) {
      console.error('Error deleting post-it from Firestore:', err);
    }
  },

  async saveAuditLog(log: AuditLogItem) {
    try {
      const sanitized = sanitizeForFirestore(log);
      await setDoc(doc(db, AUDIT_LOGS_COLLECTION, log.id), sanitized);
    } catch (err) {
      console.error('Error saving audit log to Firestore:', err);
    }
  },

  async saveTeamMember(member: TeamMember) {
    try {
      const sanitized = sanitizeForFirestore(member);
      await setDoc(doc(db, TEAM_COLLECTION, member.id), sanitized);
    } catch (err) {
      console.error('Error saving team member to Firestore:', err);
    }
  },

  async saveStudioBank(bank: any) {
    try {
      const sanitized = sanitizeForFirestore(bank);
      await setDoc(doc(db, SETTINGS_COLLECTION, 'bank_details'), sanitized);
    } catch (err) {
      console.error('Error saving bank details to Firestore:', err);
    }
  },

  async saveUserBanks(userBanks: Record<string, any>) {
    try {
      const sanitized = sanitizeForFirestore(userBanks);
      await setDoc(doc(db, SETTINGS_COLLECTION, 'user_banks'), sanitized);
    } catch (err) {
      console.error('Error saving user banks to Firestore:', err);
    }
  },

  async savePresence(presence: ActiveUserPresence) {
    try {
      const sanitized = sanitizeForFirestore(presence);
      const docId = `${presence.memberId}_${presence.tabId || 'tab'}`;
      await setDoc(doc(db, PRESENCES_COLLECTION, docId), sanitized);
    } catch (err) {
      console.error('Error saving presence to Firestore:', err);
    }
  },

  async removePresence(memberId: string, tabId: string) {
    try {
      const docId = `${memberId}_${tabId || 'tab'}`;
      await deleteDoc(doc(db, PRESENCES_COLLECTION, docId));
    } catch (err) {
      console.error('Error removing presence from Firestore:', err);
    }
  },

  // --- MIGRATION / SEED FROM LOCAL DATA TO CLOUD ---
  async syncLocalToCloudIfEmpty(localData: {
    clients: Client[];
    projects: Project[];
    budgets: Budget[];
    postIts: PostIt[];
    team: TeamMember[];
    studioBank: any;
  }) {
    try {
      const snapshot = await getDocs(collection(db, CLIENTS_COLLECTION));
      // If Firestore is already populated, don't overwrite
      if (!snapshot.empty) return;

      // Firestore is brand new/empty -> batch upload local items
      const batch = writeBatch(db);

      localData.clients.forEach(c => {
        batch.set(doc(db, CLIENTS_COLLECTION, c.id), sanitizeForFirestore(c));
      });

      localData.projects.forEach(p => {
        batch.set(doc(db, PROJECTS_COLLECTION, p.id), sanitizeForFirestore(p));
      });

      localData.budgets.forEach(b => {
        batch.set(doc(db, BUDGETS_COLLECTION, b.id), sanitizeForFirestore(b));
      });

      localData.postIts.forEach(post => {
        batch.set(doc(db, POSTITS_COLLECTION, post.id), sanitizeForFirestore(post));
      });

      localData.team.forEach(t => {
        batch.set(doc(db, TEAM_COLLECTION, t.id), sanitizeForFirestore(t));
      });

      if (localData.studioBank) {
        batch.set(doc(db, SETTINGS_COLLECTION, 'bank_details'), sanitizeForFirestore(localData.studioBank));
      }

      await batch.commit();
      console.log('Successfully initialized Firestore with initial team data!');
    } catch (err) {
      console.error('Error migrating local data to Firestore:', err);
    }
  },
};
