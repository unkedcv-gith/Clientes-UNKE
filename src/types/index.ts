export interface BankAccountDetails {
  bank: string;
  accountHolder: string;
  cbu: string;
  alias: string;
  cuit: string;
}

export interface UserBankAccounts {
  [memberId: string]: BankAccountDetails;
}

export type ProjectType = 'proyecto' | 'mantenimiento' | 'hibrido';

export type ProjectStatus =
  | 'prospecto'
  | 'en_progreso'
  | 'en_revision'
  | 'completado'
  | 'entregado'
  | 'pausado';

export type PaymentStatus =
  | 'pendiente'
  | 'parcial'
  | 'al_dia'
  | 'facturado'
  | 'pagado'
  | 'en_mora';

export type BudgetStatus = 'borrador' | 'enviado' | 'aprobado' | 'rechazado';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatarColor: string;
  initials: string;
  password?: string;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  cuitOrDni?: string;
  address?: string;
  notes?: string;
  status: 'activo' | 'inactivo' | 'potencial';
  hasWeb?: boolean;
  webUrl?: string;
  webAdminUrl?: string;
  webUser?: string;
  webPassword?: string;
  webHostingNotes?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface Deliverable {
  id: string;
  title: string;
  done: boolean;
  dueDate?: string;
}

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  notes?: string;
  method: string;
  recordedBy: string;
}

export interface Project {
  id: string;
  code: string;
  title: string;
  description?: string;
  clientId: string;
  clientName: string;
  type: ProjectType; // 'proyecto' (puntual) | 'mantenimiento' (mensual)
  status: ProjectStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number; // in ARS (if 'mantenimiento', this is the monthly fee)
  paidAmount: number;
  monthlyBillingDay?: number; // 1-31 (e.g. 5th of each month for retainer)
  lastMonthlyPaymentDate?: string; // YYYY-MM
  startDate: string; // YYYY-MM-DD
  deliveryDate: string; // YYYY-MM-DD (fecha límite o de entrega de entregable)
  tags: string[];
  deliverables: Deliverable[];
  paymentsHistory: PaymentRecord[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  isMonthly?: boolean; // For hybrid budgets: indicates whether this concept is a monthly recurring fee or punctual implementation
}

export interface Budget {
  id: string;
  number: string;
  title: string;
  clientId: string;
  clientName: string;
  clientContact?: string;
  date: string; // YYYY-MM-DD
  validUntilDate: string; // YYYY-MM-DD
  projectType: ProjectType;
  items: BudgetItem[];
  deliverablesClarification?: string;
  subtotal: number;
  discountPercentage?: number;
  totalAmount: number;
  notesAndTerms: string;
  status: BudgetStatus;
  selectedMemberBankId?: string; // e.g. member_nacho, member_fede, member_willy
  bankDetails: BankAccountDetails;
  convertedToProjectId?: string;
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
}

export type PostItColor = 'yellow' | 'teal' | 'coral' | 'purple' | 'mint' | 'blue';

export interface PostIt {
  id: string;
  title: string;
  content: string;
  color: PostItColor;
  authorId: string;
  authorName: string;
  pinned: boolean;
  isResolved?: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  memberId: string;
  memberName: string;
  action: 'creó' | 'editó' | 'eliminó' | 'cambió estado' | 'aprobó presupuesto' | 'registró pago';
  entityType: 'proyecto' | 'cliente' | 'presupuesto' | 'nota' | 'abono';
  entityId: string;
  details: string;
}

export interface ActiveUserPresence {
  tabId?: string;
  memberId: string;
  memberName: string;
  memberInitials: string;
  memberColor: string;
  currentView: string;
  editingItemId?: string | null;
  editingItemTitle?: string | null;
  lastHeartbeat: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category?: string; // Optional, maybe we don't need it if simple
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}
