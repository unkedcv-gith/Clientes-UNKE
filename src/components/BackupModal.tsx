import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  CreditCard,
  Check,
  X,
  ShieldCheck,
  HardDrive,
  FolderKanban,
  FileText,
  Users,
  StickyNote,
} from 'lucide-react';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({ isOpen, onClose }) => {
  const {
    exportDataJSON,
    importDataJSON,
    resetToSampleData,
    studioBank,
    updateStudioBank,
    clients,
    projects,
    budgets,
    postIts,
  } = useStudio();

  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Bank Form State
  const [bankName, setBankName] = useState(studioBank.bank);
  const [accountHolder, setAccountHolder] = useState(studioBank.accountHolder);
  const [cbu, setCbu] = useState(studioBank.cbu);
  const [alias, setAlias] = useState(studioBank.alias);
  const [cuit, setCuit] = useState(studioBank.cuit);
  const [bankSavedMessage, setBankSavedMessage] = useState(false);

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
    updateStudioBank({
      bank: bankName,
      accountHolder,
      cbu,
      alias,
      cuit,
    });
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
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Almacenamiento & Respaldo de Datos
              </h2>
              <p className="text-xs text-[#888888]">
                Guardado automático permanente y exportación segura
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

        {/* Persistence Status Badge */}
        <div className="p-3 bg-[#141414] rounded-xl border border-emerald-500/30 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-white block">Guardado Automático Activo</span>
            <span className="text-[#888888]">
              Cada cliente, proyecto, presupuesto, cobro y nota se guarda inmediatamente en el almacenamiento local de tu navegador y se sincroniza en tiempo real.
            </span>
          </div>
        </div>

        {/* Storage Stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-[#141414] p-2.5 rounded-xl border border-[#777777]/20 text-center">
            <FolderKanban className="w-4 h-4 text-[#34877c] mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{projects.length}</div>
            <div className="text-[10px] text-[#777777]">Proyectos</div>
          </div>
          <div className="bg-[#141414] p-2.5 rounded-xl border border-[#777777]/20 text-center">
            <FileText className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{budgets.length}</div>
            <div className="text-[10px] text-[#777777]">Presupuestos</div>
          </div>
          <div className="bg-[#141414] p-2.5 rounded-xl border border-[#777777]/20 text-center">
            <Users className="w-4 h-4 text-sky-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{clients.length}</div>
            <div className="text-[10px] text-[#777777]">Clientes</div>
          </div>
          <div className="bg-[#141414] p-2.5 rounded-xl border border-[#777777]/20 text-center">
            <StickyNote className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <div className="text-sm font-bold text-white">{postIts.length}</div>
            <div className="text-[10px] text-[#777777]">Notas</div>
          </div>
        </div>

        {/* Backup / Export Section */}
        <div className="space-y-2.5">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
              Copias de Seguridad (Descargar / Restaurar)
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
              <span>Exportar Backup</span>
            </button>

            <label className="flex items-center justify-center gap-2 p-2.5 bg-[#141414] hover:bg-[#272727] border border-[#777777]/30 hover:border-emerald-500 rounded-xl text-xs font-bold text-white cursor-pointer transition-all shadow-xs">
              <Upload className="w-4 h-4 text-emerald-400" />
              <span>Importar Backup</span>
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

        {/* Bank Account Settings for Invoicing */}
        <form onSubmit={handleSaveBank} className="space-y-3 pt-3 border-t border-[#777777]/20">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#34877c]" />
              <span>Datos Bancarios para Presupuestos</span>
            </h3>
            {bankSavedMessage && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Guardado</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">Banco</label>
              <input
                type="text"
                value={bankName}
                onChange={e => setBankName(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">Titular</label>
              <input
                type="text"
                value={accountHolder}
                onChange={e => setAccountHolder(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">CUIT / CUIL</label>
              <input
                type="text"
                value={cuit}
                onChange={e => setCuit(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#141414] border border-[#777777]/30 rounded-xl text-white font-mono outline-none focus:border-[#34877c]"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">ALIAS</label>
              <input
                type="text"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
              />
            </div>

            <div className="col-span-full">
              <label className="block text-slate-300 mb-1">CBU</label>
              <input
                type="text"
                value={cbu}
                onChange={e => setCbu(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#141414] border border-[#777777]/30 rounded-xl text-white font-mono outline-none focus:border-[#34877c]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
          >
            Actualizar Datos Bancarios
          </button>
        </form>

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
