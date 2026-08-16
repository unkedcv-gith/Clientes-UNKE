import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { Client } from '../types';
import { formatARS, formatDateAR } from '../utils/currency';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  CreditCard,
  Edit2,
  Trash2,
  FolderKanban,
  FileText,
  X,
  ExternalLink,
  ChevronRight,
  Globe,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  Server,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const ClientsView: React.FC = () => {
  const {
    clients,
    projects,
    budgets,
    addClient,
    updateClient,
    deleteClient,
    setActiveTab,
  } = useStudio();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'inactivo' | 'potencial'>('all');
  const [webFilter, setWebFilter] = useState<'all' | 'with_web' | 'no_web'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formCompany, setFormCompany] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formCuit, setFormCuit] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'activo' | 'inactivo' | 'potencial'>('activo');

  // Web Access Form State
  const [formHasWeb, setFormHasWeb] = useState(false);
  const [formWebUrl, setFormWebUrl] = useState('');
  const [formWebAdminUrl, setFormWebAdminUrl] = useState('');
  const [formWebUser, setFormWebUser] = useState('');
  const [formWebPassword, setFormWebPassword] = useState('');
  const [formWebHostingNotes, setFormWebHostingNotes] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);

  // Detail Modal UI states
  const [showDetailPassword, setShowDetailPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormName('');
    setFormCompany('');
    setFormEmail('');
    setFormPhone('');
    setFormCuit('');
    setFormAddress('');
    setFormNotes('');
    setFormStatus('activo');
    setFormHasWeb(false);
    setFormWebUrl('');
    setFormWebAdminUrl('');
    setFormWebUser('');
    setFormWebPassword('');
    setFormWebHostingNotes('');
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setFormName(client.name);
    setFormCompany(client.company || '');
    setFormEmail(client.email);
    setFormPhone(client.phone || '');
    setFormCuit(client.cuitOrDni || '');
    setFormAddress(client.address || '');
    setFormNotes(client.notes || '');
    setFormStatus(client.status);
    setFormHasWeb(!!client.hasWeb);
    setFormWebUrl(client.webUrl || '');
    setFormWebAdminUrl(client.webAdminUrl || '');
    setFormWebUser(client.webUser || '');
    setFormWebPassword(client.webPassword || '');
    setFormWebHostingNotes(client.webHostingNotes || '');
    setShowFormPassword(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();

    const clientPayload: Partial<Client> = {
      name: formName.trim(),
      company: formCompany.trim(),
      email: formEmail.trim(),
      phone: formPhone.trim(),
      cuitOrDni: formCuit.trim(),
      address: formAddress.trim(),
      notes: formNotes.trim(),
      status: formStatus,
      hasWeb: formHasWeb,
      webUrl: formHasWeb ? formWebUrl.trim() : '',
      webAdminUrl: formHasWeb ? formWebAdminUrl.trim() : '',
      webUser: formHasWeb ? formWebUser.trim() : '',
      webPassword: formHasWeb ? formWebPassword.trim() : '',
      webHostingNotes: formHasWeb ? formWebHostingNotes.trim() : '',
    };

    if (editingClient) {
      updateClient(editingClient.id, clientPayload);
      if (selectedClientDetail && selectedClientDetail.id === editingClient.id) {
        setSelectedClientDetail({
          ...selectedClientDetail,
          ...clientPayload,
        } as Client);
      }
    } else {
      addClient(clientPayload as any);
    }
    handleCloseModal();
  };

  const confirmDeleteClient = () => {
    if (!clientToDelete) return;
    deleteClient(clientToDelete.id);
    if (selectedClientDetail?.id === clientToDelete.id) {
      setSelectedClientDetail(null);
    }
    setClientToDelete(null);
  };

  const filteredClients = clients.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.cuitOrDni && c.cuitOrDni.includes(searchTerm)) ||
      (c.webUrl && c.webUrl.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchWeb =
      webFilter === 'all' ||
      (webFilter === 'with_web' && c.hasWeb) ||
      (webFilter === 'no_web' && !c.hasWeb);

    return matchSearch && matchStatus && matchWeb;
  });

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-[#34877c]" />
            <span>Directorio de Clientes</span>
          </h1>
          <p className="text-xs text-[#888888]">
            Base de contactos comerciales, datos de facturación CUIT, accesos a sitios web y proyectos asociados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 bg-[#34877c] hover:bg-[#2a6d63] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#202020] p-3.5 sm:p-4 rounded-2xl border border-[#777777]/20 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, empresa, email, CUIT o web..."
            className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-white placeholder-[#777777] outline-none focus:border-[#34877c] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-slate-200 outline-none focus:border-[#34877c]"
          >
            <option value="all">Todos los Estados</option>
            <option value="activo">Activos</option>
            <option value="potencial">Potenciales</option>
            <option value="inactivo">Inactivos</option>
          </select>

          {/* Web Access Filter */}
          <select
            value={webFilter}
            onChange={e => setWebFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-slate-200 outline-none focus:border-[#34877c]"
          >
            <option value="all">Sitio Web (Todos)</option>
            <option value="with_web">🌐 Con Web / Accesos</option>
            <option value="no_web">Sin Web</option>
          </select>
        </div>
      </div>

      {/* Grid of Clients */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(client => {
          const clientProjects = projects.filter(p => p.clientId === client.id);
          const totalBilled = clientProjects.reduce((acc, p) => acc + (p.totalAmount || 0), 0);

          return (
            <div
              key={client.id}
              className="bg-[#202020] rounded-2xl border border-[#777777]/20 p-5 shadow-lg hover:border-[#34877c]/60 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header card info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          client.status === 'activo'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                            : client.status === 'potencial'
                            ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                            : 'bg-[#141414] text-[#888888] border border-[#777777]/20'
                        }`}
                      >
                        {client.status}
                      </span>

                      {client.hasWeb && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#34877c]/20 text-[#34877c] border border-[#34877c]/40 flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          <span>Web</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-black text-white mt-2 leading-tight">
                      {client.name}
                    </h2>
                    {client.company && (
                      <div className="text-xs text-[#888888] flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-[#777777]" />
                        <span>{client.company}</span>
                      </div>
                    )}
                  </div>

                  {/* Quick action buttons on card */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(client)}
                      className="p-1.5 text-[#888888] hover:text-white rounded-lg hover:bg-[#141414] transition-colors"
                      title="Editar cliente y accesos"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setClientToDelete(client)}
                      className="p-1.5 text-[#888888] hover:text-rose-400 rounded-lg hover:bg-rose-950/30 transition-colors"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Contact info */}
                <div className="text-xs text-[#aaaaaa] space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.cuitOrDni && (
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#777777] shrink-0" />
                      <span className="font-mono">CUIT: {client.cuitOrDni}</span>
                    </div>
                  )}

                  {/* Web Quick Link */}
                  {client.hasWeb && client.webUrl && (
                    <div className="flex items-center gap-1.5 text-xs text-[#34877c] pt-0.5">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <a
                        href={client.webUrl.startsWith('http') ? client.webUrl : `https://${client.webUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline truncate font-mono text-[11px] flex items-center gap-1"
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="truncate">{client.webUrl.replace(/^https?:\/\//, '')}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Footer & Detail button */}
              <div className="pt-3 border-t border-[#777777]/20 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-[#777777]">Total contratado</div>
                  <div className="font-bold text-white">
                    {formatARS(totalBilled)}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedClientDetail(client)}
                  className="flex items-center gap-1 text-xs font-bold text-[#34877c] hover:text-[#45b2a3] transition-colors"
                >
                  <span>Ver ficha & accesos</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredClients.length === 0 && (
          <div className="col-span-full py-12 text-center bg-[#202020] rounded-2xl border border-[#777777]/20 text-[#888888] space-y-3">
            <Users className="w-10 h-10 text-[#555555] mx-auto" />
            <p className="text-sm font-medium">No se encontraron clientes con los filtros aplicados.</p>
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear nuevo cliente</span>
            </button>
          </div>
        )}
      </div>

      {/* Client Detail Modal */}
      {selectedClientDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#202020] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#777777]/25 space-y-5 my-8 text-white">
            <div className="flex items-center justify-between border-b border-[#777777]/20 pb-3">
              <div>
                <span className="text-xs font-bold text-[#34877c] uppercase tracking-wider">
                  Ficha de Cliente
                </span>
                <h2 className="text-xl font-black text-white">
                  {selectedClientDetail.name}
                </h2>
                {selectedClientDetail.company && (
                  <p className="text-xs text-[#888888]">{selectedClientDetail.company}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedClientDetail(null)}
                className="p-1 rounded-lg text-[#777777] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Contact Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#141414] p-4 rounded-xl border border-[#777777]/20 text-xs">
              <div>
                <span className="text-[#777777] font-medium block">Email de contacto:</span>
                <p className="font-semibold text-white mt-0.5">
                  {selectedClientDetail.email}
                </p>
              </div>
              <div>
                <span className="text-[#777777] font-medium block">Teléfono / WhatsApp:</span>
                <p className="font-semibold text-white mt-0.5">
                  {selectedClientDetail.phone || '-'}
                </p>
              </div>
              <div>
                <span className="text-[#777777] font-medium block">CUIT / CUIL / DNI:</span>
                <p className="font-semibold text-white mt-0.5 font-mono">
                  {selectedClientDetail.cuitOrDni || '-'}
                </p>
              </div>
              <div>
                <span className="text-[#777777] font-medium block">Dirección / Ubicación:</span>
                <p className="font-semibold text-white mt-0.5">
                  {selectedClientDetail.address || '-'}
                </p>
              </div>
              {selectedClientDetail.notes && (
                <div className="col-span-full pt-1 border-t border-[#777777]/15">
                  <span className="text-[#777777] font-medium block">Notas internas:</span>
                  <p className="text-slate-300 mt-0.5 whitespace-pre-wrap">
                    {selectedClientDetail.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Web Access & Credentials Box */}
            {selectedClientDetail.hasWeb ? (
              <div className="bg-[#141414] p-4 rounded-xl border border-[#34877c]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#34877c]" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Datos de Acceso a la Web
                    </h3>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                    Accesos Activos
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {/* Web URL */}
                  {selectedClientDetail.webUrl && (
                    <div className="bg-[#202020] p-2.5 rounded-lg border border-[#777777]/20 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#777777] block">Sitio Web</span>
                        <a
                          href={selectedClientDetail.webUrl.startsWith('http') ? selectedClientDetail.webUrl : `https://${selectedClientDetail.webUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#34877c] hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <span className="truncate">{selectedClientDetail.webUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedClientDetail.webUrl!, 'webUrl')}
                        className="p-1 text-[#777777] hover:text-white"
                        title="Copiar URL"
                      >
                        {copiedField === 'webUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Admin URL */}
                  {selectedClientDetail.webAdminUrl && (
                    <div className="bg-[#202020] p-2.5 rounded-lg border border-[#777777]/20 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#777777] block">Panel / Admin URL</span>
                        <a
                          href={selectedClientDetail.webAdminUrl.startsWith('http') ? selectedClientDetail.webAdminUrl : `https://${selectedClientDetail.webAdminUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-amber-400 hover:underline flex items-center gap-1 truncate max-w-[200px]"
                        >
                          <span className="truncate">{selectedClientDetail.webAdminUrl}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </a>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedClientDetail.webAdminUrl!, 'webAdminUrl')}
                        className="p-1 text-[#777777] hover:text-white"
                        title="Copiar Admin URL"
                      >
                        {copiedField === 'webAdminUrl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Username / Email */}
                  {selectedClientDetail.webUser && (
                    <div className="bg-[#202020] p-2.5 rounded-lg border border-[#777777]/20 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#777777] block">Usuario / Email</span>
                        <span className="font-bold text-white font-mono">{selectedClientDetail.webUser}</span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(selectedClientDetail.webUser!, 'webUser')}
                        className="p-1 text-[#777777] hover:text-white"
                        title="Copiar Usuario"
                      >
                        {copiedField === 'webUser' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {/* Password */}
                  {selectedClientDetail.webPassword && (
                    <div className="bg-[#202020] p-2.5 rounded-lg border border-[#777777]/20 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#777777] block">Contraseña de Acceso</span>
                        <span className="font-bold text-emerald-300 font-mono tracking-wider">
                          {showDetailPassword ? selectedClientDetail.webPassword : '••••••••••••'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowDetailPassword(!showDetailPassword)}
                          className="p-1 text-[#777777] hover:text-white"
                          title={showDetailPassword ? 'Ocultar' : 'Mostrar'}
                        >
                          {showDetailPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(selectedClientDetail.webPassword!, 'webPassword')}
                          className="p-1 text-[#777777] hover:text-white"
                          title="Copiar Contraseña"
                        >
                          {copiedField === 'webPassword' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Hosting / Notes */}
                  {selectedClientDetail.webHostingNotes && (
                    <div className="col-span-full bg-[#202020] p-2.5 rounded-lg border border-[#777777]/20">
                      <span className="text-[10px] text-[#777777] block flex items-center gap-1 mb-0.5">
                        <Server className="w-3 h-3" />
                        <span>Hosting / Proveedor / Notas Técnicas</span>
                      </span>
                      <p className="text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                        {selectedClientDetail.webHostingNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[#141414] border border-[#777777]/20 text-xs text-[#777777] flex items-center justify-between">
                <span>Este cliente no tiene sitio web o accesos registrados.</span>
                <button
                  onClick={() => handleOpenEdit(selectedClientDetail)}
                  className="text-xs font-bold text-[#34877c] hover:underline"
                >
                  + Cargar accesos web
                </button>
              </div>
            )}

            {/* Projects with this client */}
            <div>
              <h3 className="text-xs font-bold text-white uppercase mb-2 flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-[#34877c]" />
                <span>Trabajos & Abonos del Cliente</span>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {projects.filter(p => p.clientId === selectedClientDetail.id).length === 0 ? (
                  <p className="text-xs text-[#777777] italic bg-[#141414] p-3 rounded-xl">
                    No hay proyectos registrados para este cliente aún.
                  </p>
                ) : (
                  projects
                    .filter(p => p.clientId === selectedClientDetail.id)
                    .map(p => (
                      <div
                        key={p.id}
                        className="p-3 bg-[#141414] rounded-xl border border-[#777777]/20 flex items-center justify-between text-xs hover:border-[#34877c]/40 transition-colors"
                      >
                        <div>
                          <span className="font-mono text-[#34877c] font-bold mr-2">{p.code}</span>
                          <span className="font-bold text-white">{p.title}</span>
                          <div className="text-[10px] text-[#777777] capitalize">{p.type} • {p.status.replace('_', ' ')}</div>
                        </div>
                        <div className="font-bold text-white">
                          {formatARS(p.totalAmount)}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#777777]/20 pt-3 text-xs">
              <button
                type="button"
                onClick={() => setClientToDelete(selectedClientDetail)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar Cliente</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClientDetail(null)}
                  className="px-3.5 py-1.5 bg-[#141414] hover:bg-[#272727] text-[#cccccc] rounded-xl font-semibold border border-[#777777]/20"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEdit(selectedClientDetail);
                  }}
                  className="px-4 py-1.5 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl font-bold transition-all shadow-xs"
                >
                  Editar Datos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#202020] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#777777]/25 space-y-4 my-8 text-white">
            <div className="flex items-center justify-between border-b border-[#777777]/20 pb-3">
              <h2 className="text-base font-bold text-white">
                {editingClient ? `Editar ${editingClient.name}` : 'Nuevo Cliente'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-[#777777] hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre o Marca del Cliente *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Ej. Bodega Los Alerces"
                  required
                  className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Razón Social / Empresa
                </label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={e => setFormCompany(e.target.value)}
                  placeholder="Ej. Los Alerces Wines S.A."
                  className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email de Contacto *
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="contacto@cliente.com"
                    required
                    className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+54 9 11 ..."
                    className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    CUIT / CUIL / DNI
                  </label>
                  <input
                    type="text"
                    value={formCuit}
                    onChange={e => setFormCuit(e.target.value)}
                    placeholder="30-XXXXXXXX-X"
                    className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estado Comercial
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as 'activo' | 'inactivo' | 'potencial')}
                    className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                  >
                    <option value="activo">Activo</option>
                    <option value="potencial">Potencial</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dirección / Localidad
                </label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={e => setFormAddress(e.target.value)}
                  placeholder="Ciudad, Provincia..."
                  className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              {/* WEBSITE ACCESS CHECKBOX SECTION */}
              <div className="pt-2 border-t border-[#777777]/20">
                <label className="flex items-center gap-2.5 cursor-pointer select-none p-3 rounded-xl bg-[#141414] border border-[#777777]/25 hover:border-[#34877c]/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formHasWeb}
                    onChange={e => setFormHasWeb(e.target.checked)}
                    className="w-4 h-4 rounded text-[#34877c] accent-[#34877c] bg-[#202020] border-[#777777]/40 focus:ring-0 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#34877c]" />
                      <span>¿Tiene sitio web o tienda online?</span>
                    </span>
                    <span className="text-[11px] text-[#888888] block">
                      Habilitar para guardar credenciales, URLs de administración y datos de hosting.
                    </span>
                  </div>
                </label>

                {/* Extended Web Access Inputs when checkbox is true */}
                {formHasWeb && (
                  <div className="mt-3 p-3.5 rounded-xl bg-[#141414] border border-[#34877c]/40 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#34877c]">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Datos y Credenciales de Acceso Web</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          URL del Sitio Web
                        </label>
                        <input
                          type="text"
                          value={formWebUrl}
                          onChange={e => setFormWebUrl(e.target.value)}
                          placeholder="https://cliente.com"
                          className="w-full text-xs px-2.5 py-1.5 bg-[#202020] border border-[#777777]/30 rounded-lg text-white outline-none focus:border-[#34877c]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          URL de Panel / Admin
                        </label>
                        <input
                          type="text"
                          value={formWebAdminUrl}
                          onChange={e => setFormWebAdminUrl(e.target.value)}
                          placeholder="https://cliente.com/wp-admin"
                          className="w-full text-xs px-2.5 py-1.5 bg-[#202020] border border-[#777777]/30 rounded-lg text-white outline-none focus:border-[#34877c]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Usuario / Email de Acceso
                        </label>
                        <input
                          type="text"
                          value={formWebUser}
                          onChange={e => setFormWebUser(e.target.value)}
                          placeholder="admin / info@cliente.com"
                          className="w-full text-xs px-2.5 py-1.5 bg-[#202020] border border-[#777777]/30 rounded-lg text-white outline-none focus:border-[#34877c]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Contraseña de Acceso
                        </label>
                        <div className="relative">
                          <input
                            type={showFormPassword ? 'text' : 'password'}
                            value={formWebPassword}
                            onChange={e => setFormWebPassword(e.target.value)}
                            placeholder="Clave de acceso..."
                            className="w-full text-xs pl-2.5 pr-8 py-1.5 bg-[#202020] border border-[#777777]/30 rounded-lg text-white outline-none focus:border-[#34877c]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowFormPassword(!showFormPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[#777777] hover:text-white"
                          >
                            {showFormPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="col-span-full">
                        <label className="block text-[11px] text-slate-300 mb-1">
                          Hosting / Proveedor / Notas de Acceso
                        </label>
                        <textarea
                          value={formWebHostingNotes}
                          onChange={e => setFormWebHostingNotes(e.target.value)}
                          rows={2}
                          placeholder="Ej: DonWeb / Tiendanube / Cloudflare / DNS / Accesos FTP..."
                          className="w-full text-xs px-2.5 py-1.5 bg-[#202020] border border-[#777777]/30 rounded-lg text-white outline-none focus:border-[#34877c]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notas adicionales
                </label>
                <textarea
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  rows={2}
                  placeholder="Anotaciones sobre preferencias, horarios o forma de trabajo..."
                  className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#777777]/20">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {editingClient ? 'Guardar Cambios' : 'Crear Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#202020] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-500/30 space-y-4 text-white animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-950/60 rounded-xl border border-rose-800/60 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Cliente?</h3>
                <p className="text-xs text-[#888888]">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              ¿Estás seguro de que deseás eliminar el cliente{' '}
              <strong className="text-white font-bold">"{clientToDelete.name}"</strong>?
              {clientToDelete.hasWeb && ' Se borrarán también sus datos de acceso web guardados.'}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#777777]/20">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteClient}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
