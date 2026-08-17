import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { BankAccountDetails } from '../types';
import {
  Settings,
  Download,
  Upload,
  RefreshCw,
  CreditCard,
  Check,
  X,
  ShieldCheck,
  FolderKanban,
  FileText,
  Users,
  StickyNote,
  User,
  Building,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    exportDataJSON,
    importDataJSON,
    resetToSampleData,
    studioBank,
    updateStudioBank,
    userBanks,
    updateUserBank,
    team,
    clients,
    projects,
    budgets,
    postIts,
  } = useStudio();

  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Selected Bank Tab in Settings: 'studio' | member_id (nacho, fede, willy)
  const [selectedBankTab, setSelectedBankTab] = useState<string>('studio');

  // Form states for the selected bank tab
  const activeBankData: BankAccountDetails =
    selectedBankTab === 'studio'
      ? studioBank
      : userBanks[selectedBankTab] || {
          bank: '',
          accountHolder: '',
          cbu: '',
          alias: '',
          cuit: '',
        };

  const [bankName, setBankName] = useState(activeBankData.bank || '');
  const [accountHolder, setAccountHolder] = useState(activeBankData.accountHolder || '');
  const [cbu, setCbu] = useState(activeBankData.cbu || '');
  const [alias, setAlias] = useState(activeBankData.alias || '');
  const [cuit, setCuit] = useState(activeBankData.cuit || '');
  const [bankSavedMessage, setBankSavedMessage] = useState(false);

  // Switch form values when changing tab
  const handleTabChange = (tabId: string) => {
    setSelectedBankTab(tabId);
    const data =
      tabId === 'studio'
        ? studioBank
        : userBanks[tabId] || {
            bank: '',
            accountHolder: '',
            cbu: '',
            alias: '',
            cuit: '',
          };
    setBankName(data.bank || '');
    setAccountHolder(data.accountHolder || '');
    setCbu(data.cbu || '');
    setAlias(data.alias || '');
    setCuit(data.cuit || '');
    setBankSavedMessage(false);
  };

  if (!isOpen) return null;

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UNKE_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const success = importDataJSON(content);
      if (success) {
        setImportStatus('✅ ¡Datos sincronizados y restaurados con éxito!');
      } else {
        setImportStatus('❌ El archivo seleccionado no tiene un formato JSON válido.');
      }
    };
    reader.readAsText(file);
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDetails: BankAccountDetails = {
      bank: bankName.trim(),
      accountHolder: accountHolder.trim(),
      cbu: cbu.trim(),
      alias: alias.trim(),
      cuit: cuit.trim(),
    };

    if (selectedBankTab === 'studio') {
      updateStudioBank(updatedDetails);
    } else {
      updateUserBank(selectedBankTab, updatedDetails);
    }

    setBankSavedMessage(true);
    setTimeout(() => setBankSavedMessage(false), 3000);
  };

  const handleReset = () => {
    if (
      window.confirm(
        '¿Deseás limpiar la base de datos para comenzar desde cero (0 proyectos, 0 presupuestos, 0 clientes) manteniendo los usuarios y datos bancarios oficiales de UNKE?'
      )
    ) {
      resetToSampleData();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-[#777777]/20 space-y-4 my-auto max-h-[94vh] overflow-y-auto text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#777777]/20 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#34877c]/15 text-[#34877c] flex items-center justify-center font-bold">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Configuración del Estudio
              </h2>
              <p className="text-xs text-[#888888]">
                Cuentas bancarias para presupuestos & copia de seguridad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#777777] hover:text-white p-1.5 rounded-lg hover:bg-[#282828] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Realtime Cloud Sync Status */}
        <div className="p-3 bg-[#141414] rounded-xl border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-white block">Sincronización en la Nube Activa</span>
            <span className="text-[#888888]">
              Los cambios en clientes, proyectos y cuentas bancarias se sincronizan automáticamente en tiempo real entre todos los integrantes del equipo.
            </span>
          </div>
        </div>

        {/* Bank Accounts Settings: 3 Members + Studio General */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#34877c]" />
              <span>Cuentas Bancarias para Presupuestos</span>
            </h3>
            {bankSavedMessage && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Guardado con éxito</span>
              </span>
            )}
          </div>
          <p className="text-xs text-[#888888]">
            Configurá los datos bancarios de cada integrante. Al emitir un presupuesto podés elegir qué cuenta bancaria incluir automáticamente.
          </p>

          {/* Member Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-[#141414] rounded-xl border border-[#777777]/25">
            <button
              type="button"
              onClick={() => handleTabChange('studio')}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedBankTab === 'studio'
                  ? 'bg-[#34877c] text-white shadow-sm'
                  : 'text-[#888888] hover:text-white hover:bg-[#222222]'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span className="truncate">UNKE Oficial</span>
            </button>

            {team.map(member => (
              <button
                key={member.id}
                type="button"
                onClick={() => handleTabChange(member.id)}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedBankTab === member.id
                    ? 'bg-[#34877c] text-white shadow-sm'
                    : 'text-[#888888] hover:text-white hover:bg-[#222222]'
                }`}
              >
                <div
                  style={{ backgroundColor: member.avatarColor }}
                  className="w-4 h-4 rounded-full text-[9px] font-black text-white flex items-center justify-center shrink-0"
                >
                  {member.initials}
                </div>
                <span className="truncate">{member.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Bank Form for active tab */}
          <form onSubmit={handleSaveBank} className="space-y-3 p-3.5 bg-[#141414] rounded-xl border border-[#777777]/20">
            <div className="flex items-center gap-2 pb-1 border-b border-[#777777]/15">
              <span className="text-[11px] font-bold text-[#34877c] uppercase">
                {selectedBankTab === 'studio'
                  ? 'Cuenta Oficial del Estudio'
                  : `Cuenta Personal de ${team.find(m => m.id === selectedBankTab)?.name || 'Integrante'}`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Banco / Billetera</label>
                <input
                  type="text"
                  placeholder="ej. Banco Santander, Galicia, MP..."
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#1e1e1e] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Titular de la Cuenta</label>
                <input
                  type="text"
                  placeholder="Nombre y Apellido o Razón Social"
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#1e1e1e] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">CUIT / CUIL / DNI</label>
                <input
                  type="text"
                  placeholder="20-xxxxxxxx-x"
                  value={cuit}
                  onChange={e => setCuit(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#1e1e1e] border border-[#777777]/30 rounded-xl text-white font-mono outline-none focus:border-[#34877c]"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">ALIAS</label>
                <input
                  type="text"
                  placeholder="ej. NOMBRE.UNKE.DCV"
                  value={alias}
                  onChange={e => setAlias(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#1e1e1e] border border-[#777777]/30 rounded-xl text-white font-mono outline-none focus:border-[#34877c]"
                />
              </div>

              <div className="col-span-full">
                <label className="block text-slate-300 mb-1">CBU / CVU (22 dígitos)</label>
                <input
                  type="text"
                  placeholder="0000000000000000000000"
                  value={cbu}
                  onChange={e => setCbu(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#1e1e1e] border border-[#777777]/30 rounded-xl text-white font-mono outline-none focus:border-[#34877c]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Guardar Datos de{' '}
              {selectedBankTab === 'studio'
                ? 'UNKE Oficial'
                : team.find(m => m.id === selectedBankTab)?.name.split(' ')[0] || 'esta cuenta'}
            </button>
          </form>
        </div>

        {/* Backup / Export Section */}
        <div className="space-y-2.5 pt-2 border-t border-[#777777]/20">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              Copias de Seguridad (Backup)
            </h3>
            <p className="text-xs text-[#888888]">
              Podés descargar un archivo <code className="text-[#34877c]">.json</code> de respaldo con todos los datos para tener una copia externa en Google Drive o tu computadora.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 p-2.5 bg-[#141414] hover:bg-[#272727] border border-[#777777]/30 hover:border-[#34877c] rounded-xl text-xs font-bold text-white transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#34877c]" />
              <span>Descargar Backup (.json)</span>
            </button>

            <label className="flex items-center justify-center gap-2 p-2.5 bg-[#141414] hover:bg-[#272727] border border-[#777777]/30 hover:border-emerald-500 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shadow-xs">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Restaurar Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {importStatus && (
            <p className="text-xs p-2.5 rounded-xl bg-teal-950/40 text-teal-200 border border-teal-800">
              {importStatus}
            </p>
          )}
        </div>

        {/* Reset & Close */}
        <div className="pt-2 border-t border-[#777777]/20 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 text-rose-400 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Limpiar / Vaciar base de datos</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#141414] hover:bg-[#282828] text-[#aaaaaa] hover:text-white rounded-xl font-medium border border-[#777777]/20 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
