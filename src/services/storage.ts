import {
  Budget,
  Client,
  PostIt,
  Project,
  TeamMember,
  AuditLogItem,
} from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'unke_clients_v3',
  PROJECTS: 'unke_projects_v3',
  BUDGETS: 'unke_budgets_v3',
  POSTITS: 'unke_postits_v3',
  TEAM: 'unke_team_members_v3',
  CURRENT_USER_ID: 'unke_current_user_id_v3',
  AUDIT_LOGS: 'unke_audit_logs_v3',
  STUDIO_INFO: 'unke_studio_info_v3',
  DARK_MODE: 'unke_dark_mode_v3',
  AUTH_SESSION: 'unke_auth_session_v3',
  LAST_ACTIVITY: 'unke_last_activity_v3',
};

// Official 3 members of UNKE Studio
export const DEFAULT_TEAM: TeamMember[] = [
  {
    id: 'member_nacho',
    name: 'Nacho Bieski',
    role: 'Dirección de Arte & Identidad',
    email: 'nacho@unke.com.ar',
    avatarColor: '#34877c',
    initials: 'NB',
    password: 'nachounke',
  },
  {
    id: 'member_fede',
    name: 'Fede Messina',
    role: 'Estrategia, Contenido & Comunicación',
    email: 'fede@unke.com.ar',
    avatarColor: '#0284c7',
    initials: 'FM',
    password: 'fedeunke',
  },
  {
    id: 'member_willy',
    name: 'Willy Morinigo',
    role: 'Diseño Web, UI/UX & Sistemas',
    email: 'willy@unke.com.ar',
    avatarColor: '#e11d48',
    initials: 'WM',
    password: 'willyunke',
  },
];

export const DEFAULT_STUDIO_BANK = {
  bank: 'Banco Galicia',
  accountHolder: 'UNKE ESTUDIO DCV S.H.',
  cbu: '0070142820000012894567',
  alias: 'UNKE.ESTUDIO.DCV',
  cuit: '30-71829304-9',
};

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli_1',
    name: 'Bodega Los Alerces',
    company: 'Los Alerces Wines S.A.',
    email: 'contacto@losalerceswines.com.ar',
    phone: '+54 9 261 489-1234',
    cuitOrDni: '30-68945612-4',
    address: 'Luján de Cuyo, Mendoza',
    notes: 'Cliente de identidad y etiquetas de vino. Pago puntual vía transferencia.',
    status: 'activo',
    hasWeb: true,
    webUrl: 'https://losalerceswines.com.ar',
    webAdminUrl: 'https://losalerceswines.com.ar/wp-admin',
    webUser: 'admin_alerces',
    webPassword: 'Wines2026!Secure',
    webHostingNotes: 'Hosting en DonWeb con cPanel. DNS administrado en Cloudflare.',
    createdAt: '2026-01-10T10:00:00Z',
    createdBy: 'Nacho Bieski',
    updatedAt: '2026-02-01T14:30:00Z',
    updatedBy: 'Nacho Bieski',
  },
  {
    id: 'cli_2',
    name: 'Kroma Tech',
    company: 'Kroma Soluciones Digitales',
    email: 'marketing@kromatech.io',
    phone: '+54 9 11 5566-7788',
    cuitOrDni: '30-74581290-8',
    address: 'Palermo, CABA',
    notes: 'Abono mensual de redes + mantenimiento gráfico web.',
    status: 'activo',
    hasWeb: true,
    webUrl: 'https://kromatech.io',
    webAdminUrl: 'https://kromatech.io/admin',
    webUser: 'unke_studio',
    webPassword: 'KromaDevPass2026#',
    webHostingNotes: 'Vercel + Supabase',
    createdAt: '2026-01-15T11:00:00Z',
    createdBy: 'Fede Messina',
    updatedAt: '2026-02-12T09:15:00Z',
    updatedBy: 'Fede Messina',
  },
  {
    id: 'cli_3',
    name: 'Café Raíces',
    company: 'Raíces Especialidad SRL',
    email: 'hola@caferaices.com',
    phone: '+54 9 11 4321-9876',
    cuitOrDni: '30-76123456-1',
    address: 'Colegiales, CABA',
    notes: 'Cafetería de especialidad. Proyectos de packaging, cartas y merch.',
    status: 'activo',
    hasWeb: false,
    createdAt: '2026-02-02T16:00:00Z',
    createdBy: 'Willy Morinigo',
    updatedAt: '2026-02-10T18:00:00Z',
    updatedBy: 'Nacho Bieski',
  },
  {
    id: 'cli_4',
    name: 'Estudio Jurídico Albarracín',
    company: 'Albarracín & Asociados',
    email: 'info@albarracinlegal.com.ar',
    phone: '+54 9 11 6789-0123',
    cuitOrDni: '30-65432109-7',
    address: 'San Nicolás, CABA',
    notes: 'Abono mensual institucional y newsletter quincenal.',
    status: 'activo',
    hasWeb: false,
    createdAt: '2026-02-05T12:00:00Z',
    createdBy: 'Fede Messina',
    updatedAt: '2026-02-05T12:00:00Z',
    updatedBy: 'Fede Messina',
  },
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_1',
    code: 'UNK-2026-01',
    title: 'Rediseño de Identidad & Packaging Línea Reserva',
    description: 'Manual de marca actualizado, diseño de 3 etiquetas para línea premium y estuches de madera.',
    clientId: 'cli_1',
    clientName: 'Bodega Los Alerces',
    type: 'proyecto',
    status: 'en_progreso',
    paymentStatus: 'parcial',
    totalAmount: 1850000,
    paidAmount: 925000,
    startDate: '2026-08-01',
    deliveryDate: '2026-08-20',
    tags: ['Branding', 'Packaging', 'Editorial'],
    deliverables: [
      { id: 'del_1', title: 'Exploración tipográfica y universo visual', done: true },
      { id: 'del_2', title: 'Propuesta de etiquetas de vino (3 varietales)', done: true },
      { id: 'del_3', title: 'Arte final para imprenta con hot stamping', done: false, dueDate: '2026-08-20' },
    ],
    paymentsHistory: [
      {
        id: 'pay_1',
        date: '2026-08-02',
        amount: 925000,
        notes: 'Anticipo 50% al inicio',
        method: 'Transferencia Bancaria',
        recordedBy: 'Nacho Bieski',
      },
    ],
    createdBy: 'Nacho Bieski',
    createdAt: '2026-08-01T10:00:00Z',
    updatedBy: 'Nacho Bieski',
    updatedAt: '2026-08-14T11:20:00Z',
  },
  {
    id: 'proj_2',
    code: 'UNK-2026-02',
    title: 'Abono Mensual: Comunicación Digital, Reels & Creatividades',
    description: 'Gestión mensual: 12 posts estáticos/carruseles, 6 reels editados, stories diarias y anuncios de performance.',
    clientId: 'cli_2',
    clientName: 'Kroma Tech',
    type: 'mantenimiento',
    status: 'en_progreso',
    paymentStatus: 'al_dia',
    totalAmount: 480000, // Monthly fee
    paidAmount: 480000,
    monthlyBillingDay: 5,
    lastMonthlyPaymentDate: '2026-08',
    startDate: '2026-01-01',
    deliveryDate: '2026-08-31',
    tags: ['Social Media', 'Reels', 'Contenido Mensual'],
    deliverables: [
      { id: 'del_4', title: 'Parrilla de contenidos Agosto', done: true },
      { id: 'del_5', title: 'Edición de 6 videos verticales Reels', done: true },
      { id: 'del_6', title: 'Reporte mensual de métricas y alcance', done: false, dueDate: '2026-08-31' },
    ],
    paymentsHistory: [
      {
        id: 'pay_2',
        date: '2026-08-05',
        amount: 480000,
        notes: 'Abono Agosto 2026 abonado en fecha',
        method: 'Transferencia Bancaria',
        recordedBy: 'Fede Messina',
      },
    ],
    createdBy: 'Fede Messina',
    createdAt: '2026-01-01T09:00:00Z',
    updatedBy: 'Fede Messina',
    updatedAt: '2026-08-05T15:10:00Z',
  },
  {
    id: 'proj_3',
    code: 'UNK-2026-03',
    title: 'Diseño Editorial Carta Menú & Bolsas Kraft Takeaway',
    description: 'Carta desplegable formato tabloide, cartelería de mostrador y diseño para bolsas serigrafiadas.',
    clientId: 'cli_3',
    clientName: 'Café Raíces',
    type: 'proyecto',
    status: 'en_revision',
    paymentStatus: 'pendiente',
    totalAmount: 640000,
    paidAmount: 0,
    startDate: '2026-08-08',
    deliveryDate: '2026-08-25',
    tags: ['Editorial', 'Packaging', 'Cartelería'],
    deliverables: [
      { id: 'del_7', title: 'Diagramación de Carta 2026', done: true },
      { id: 'del_8', title: 'Muestras de color para serigrafía de bolsas', done: true },
      { id: 'del_9', title: 'Entrega de originales de imprenta', done: false, dueDate: '2026-08-25' },
    ],
    paymentsHistory: [],
    createdBy: 'Willy Morinigo',
    createdAt: '2026-08-08T12:00:00Z',
    updatedBy: 'Willy Morinigo',
    updatedAt: '2026-08-15T17:00:00Z',
  },
  {
    id: 'proj_4',
    code: 'UNK-2026-04',
    title: 'Abono Mensual: Comunicación Institucional & Newsletter',
    description: 'Creación y despacho de 2 newsletters mensuales, diseño de piezas para LinkedIn y soporte gráfico.',
    clientId: 'cli_4',
    clientName: 'Estudio Jurídico Albarracín',
    type: 'mantenimiento',
    status: 'en_progreso',
    paymentStatus: 'pendiente',
    totalAmount: 350000, // Monthly fee
    paidAmount: 0,
    monthlyBillingDay: 10,
    lastMonthlyPaymentDate: '2026-07',
    startDate: '2026-02-01',
    deliveryDate: '2026-08-30',
    tags: ['Newsletter', 'LinkedIn', 'Abono Mensual'],
    deliverables: [
      { id: 'del_10', title: 'Edición 1 Newsletter Agosto', done: true },
      { id: 'del_11', title: 'Edición 2 Newsletter Agosto', done: false, dueDate: '2026-08-28' },
    ],
    paymentsHistory: [],
    createdBy: 'Fede Messina',
    createdAt: '2026-02-01T10:00:00Z',
    updatedBy: 'Fede Messina',
    updatedAt: '2026-08-10T11:00:00Z',
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'bud_1',
    number: 'PRES-2026-042',
    title: 'Desarrollo de Sitio Web Institucional & Portfolio Responsivo',
    clientId: 'cli_1',
    clientName: 'Bodega Los Alerces',
    clientContact: 'contacto@losalerceswines.com.ar',
    date: '2026-08-10',
    validUntilDate: '2026-08-30',
    projectType: 'proyecto',
    items: [
      {
        id: 'bi_1',
        description: 'Arquitectura de información, wireframes y diseño UI/UX (Figma)',
        quantity: 1,
        unitPrice: 850000,
        total: 850000,
      },
      {
        id: 'bi_2',
        description: 'Maquetación frontend responsiva con animaciones de marca',
        quantity: 1,
        unitPrice: 950000,
        total: 950000,
      },
      {
        id: 'bi_3',
        description: 'Módulo de catálogo de vinos con fichas técnicas descargables',
        quantity: 1,
        unitPrice: 400000,
        total: 400000,
      },
    ],
    deliverablesClarification:
      '**Alcance & Formatos de Entrega:**\n' +
      '• Archivos editables Figma con componentes y guía de estilos de UI.\n' +
      '• Código fuente frontend optimizado para mobile y desktop con deployment inicial.\n' +
      '• *Aclaración:* Incluye hasta **2 instancias de revisión**. No incluye costo de hosting ni dominio web anual.',
    subtotal: 2200000,
    discountPercentage: 5,
    totalAmount: 2090000,
    notesAndTerms: 'Forma de pago: 50% anticipo al inicio y 50% contra entrega final y publicación. Incluye 2 rondas de correcciones. Plazo estimado de ejecución: 4 semanas.',
    status: 'enviado',
    bankDetails: DEFAULT_STUDIO_BANK,
    createdBy: 'Willy Morinigo',
    createdAt: '2026-08-10T14:00:00Z',
    updatedBy: 'Willy Morinigo',
    updatedAt: '2026-08-10T14:00:00Z',
  },
  {
    id: 'bud_2',
    number: 'PRES-2026-043',
    title: 'Abono Mensual: Estrategia de Contenidos y Fotografía Gastronómica',
    clientId: 'cli_3',
    clientName: 'Café Raíces',
    clientContact: 'hola@caferaices.com',
    date: '2026-08-12',
    validUntilDate: '2026-08-31',
    projectType: 'mantenimiento',
    items: [
      {
        id: 'bi_4',
        description: '1 Jornada mensual de producción fotográfica y video en locación',
        quantity: 1,
        unitPrice: 220000,
        total: 220000,
      },
      {
        id: 'bi_5',
        description: 'Planificación, diseño y redacción de 12 publicaciones + stories',
        quantity: 1,
        unitPrice: 260000,
        total: 260000,
      },
    ],
    deliverablesClarification:
      '**Detalle del Servicio Mensual:**\n' +
      '• 12 piezas gráficas / carruseles adaptados para Feed & Stories.\n' +
      '• Cobertura mensual fotográfica en tienda y edición en alta calidad.\n' +
      '• *Entrega:* Calendario entregado los primeros 3 días hábiles de cada mes.',
    subtotal: 480000,
    discountPercentage: 0,
    totalAmount: 480000,
    notesAndTerms: 'Facturación mensual por mes adelantado del 1 al 5 de cada mes. Contrato mínimo sugerido de 3 meses.',
    status: 'aprobado',
    bankDetails: DEFAULT_STUDIO_BANK,
    createdBy: 'Fede Messina',
    createdAt: '2026-08-12T16:20:00Z',
    updatedBy: 'Nacho Bieski',
    updatedAt: '2026-08-13T10:15:00Z',
  },
];

export const INITIAL_POSTITS: PostIt[] = [
  {
    id: 'note_1',
    title: '🍷 Imprenta Los Alerces',
    content: 'Revisar pruebas de color en papel Tintoretto antes del jueves. Llevar muestra de cuño seco.',
    color: 'teal',
    authorId: 'member_nacho',
    authorName: 'Nacho Bieski',
    pinned: true,
    tags: ['Bodega', 'Imprenta'],
    createdAt: '2026-08-14T09:30:00Z',
    updatedAt: '2026-08-14T09:30:00Z',
  },
  {
    id: 'note_2',
    title: '🚀 Reunión Kroma Tech',
    content: 'El martes a las 11hs tenemos la videollamada para presentar métricas de julio y proponer nuevos formatos.',
    color: 'yellow',
    authorId: 'member_fede',
    authorName: 'Fede Messina',
    pinned: true,
    tags: ['Reunión', 'Kroma'],
    createdAt: '2026-08-15T11:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z',
  },
  {
    id: 'note_3',
    title: '💡 Actualización de portfolio UNKE',
    content: 'Sumar el caso de Café Raíces al Behance del estudio apenas entreguemos los originales.',
    color: 'coral',
    authorId: 'member_willy',
    authorName: 'Willy Morinigo',
    pinned: false,
    tags: ['Estudio', 'Portfolio'],
    createdAt: '2026-08-15T15:20:00Z',
    updatedAt: '2026-08-15T15:20:00Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'log_1',
    timestamp: '2026-08-15T17:00:00Z',
    memberId: 'member_willy',
    memberName: 'Willy Morinigo',
    action: 'editó',
    entityType: 'proyecto',
    entityId: 'proj_3',
    details: 'Actualizó entregables de Café Raíces',
  },
  {
    id: 'log_2',
    timestamp: '2026-08-14T11:20:00Z',
    memberId: 'member_nacho',
    memberName: 'Nacho Bieski',
    action: 'registró pago',
    entityType: 'proyecto',
    entityId: 'proj_1',
    details: 'Registró anticipo de $ 925.000 de Bodega Los Alerces',
  },
  {
    id: 'log_3',
    timestamp: '2026-08-13T10:15:00Z',
    memberId: 'member_nacho',
    memberName: 'Nacho Bieski',
    action: 'aprobó presupuesto',
    entityType: 'presupuesto',
    entityId: 'bud_2',
    details: 'Marcó como Aprobado el presupuesto PRES-2026-043',
  },
];

// Helper functions for loading and saving
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) {
      // Automatic migration check from old v2 keys if needed
      const oldKey = key.replace('_v3', '_v2');
      if (oldKey !== key) {
        const oldItem = localStorage.getItem(oldKey);
        if (oldItem) {
          try {
            const parsed = JSON.parse(oldItem);
            // Save to new key
            localStorage.setItem(key, JSON.stringify(parsed));
            return parsed;
          } catch {
            // ignore
          }
        }
      }
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

export { STORAGE_KEYS };
