import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { TeamMember } from '../types';
import { Users, Check, Edit2, Shield, X, Lock, LogOut, Eye, EyeOff, Volume2, Radio } from 'lucide-react';

interface TeamLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamLoginModal: React.FC<TeamLoginModalProps> = ({ isOpen, onClose }) => {
  const {
    team,
    currentUser,
    login,
    logout,
    updateTeamMember,
    activePresences,
    playNotificationChime,
    isAuthenticated,
  } = useStudio();

  const [switchingToMember, setSwitchingToMember] = useState<TeamMember | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');
  const [soundPlayedNotice, setSoundPlayedNotice] = useState(false);

  if (!isOpen) return null;

  const handleStartSwitch = (member: TeamMember) => {
    if (member.id === currentUser.id) {
      onClose();
      return;
    }
    setSwitchingToMember(member);
    setPasswordInput('');
    setPasswordError(null);
  };

  const handleConfirmSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!switchingToMember) return;

    const res = login(switchingToMember.id, passwordInput);
    if (res.success) {
      setSwitchingToMember(null);
      setPasswordInput('');
      setPasswordError(null);
      onClose();
    } else {
      setPasswordError(res.error || 'Contraseña incorrecta');
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleTestSound = () => {
    playNotificationChime();
    setSoundPlayedNotice(true);
    setTimeout(() => setSoundPlayedNotice(false), 2000);
  };

  const handleStartEdit = (e: React.MouseEvent, member: TeamMember) => {
    e.stopPropagation();
    setEditingMember(member);
    setFormName(member.name);
    setFormRole(member.role);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !formName.trim()) return;

    const initials = formName
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();

    updateTeamMember({
      ...editingMember,
      name: formName.trim(),
      role: formRole.trim() || editingMember.role,
      initials: initials || editingMember.initials,
    });

    setEditingMember(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#202020] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#777777]/20 space-y-5 my-8 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#777777]/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#34877c]/15 text-[#34877c]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Equipo UNKE
              </h2>
              <p className="text-xs text-[#888888]">
                Sesión activa, presencia en vivo y cambio de usuario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#777777] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switch password prompt */}
        {switchingToMember ? (
          <form onSubmit={handleConfirmSwitch} className="space-y-4">
            <div className="bg-[#141414] p-3.5 rounded-xl border border-[#777777]/20 flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                  switchingToMember.id === 'member_nacho'
                    ? 'bg-[#27655d]'
                    : switchingToMember.id === 'member_fede'
                    ? 'bg-[#34877c]'
                    : 'bg-[#5d9f96]'
                }`}
              >
                {switchingToMember.initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  Cambiar a {switchingToMember.name}
                </div>
                <div className="text-[10px] text-[#888888] truncate">
                  {switchingToMember.role}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#aaaaaa] mb-1.5">
                Ingresá la contraseña de {switchingToMember.name.split(' ')[0]}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#777777]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={e => {
                    setPasswordInput(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  autoFocus
                  placeholder="Contraseña"
                  className="w-full pl-9 pr-10 py-2 bg-[#141414] border border-[#777777]/30 focus:border-[#34877c] rounded-xl text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777777] hover:text-white transition-colors focus-visible:outline-none cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-rose-400 mt-1.5">{passwordError}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSwitchingToMember(null)}
                className="px-3.5 py-1.5 text-xs text-[#888888] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Confirmar Cambio
              </button>
            </div>
          </form>
        ) : !editingMember ? (
          <>
            {/* Team Members List */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-[#888888] uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Integrantes ({team.length})</span>
                <span className="text-emerald-400 font-mono text-[10px]">
                  {activePresences.length + (isAuthenticated ? 1 : 0) > 0 ? '🟢 Sincronización en vivo' : ''}
                </span>
              </div>

              {team.map(member => {
                const isCurrent = member.id === currentUser.id && isAuthenticated;
                const now = Date.now();
                const presence = activePresences.find(
                  p => p.memberId === member.id && (now - p.lastHeartbeat < 10000)
                );
                const isOnline = isCurrent || !!presence;
                const currentView = presence?.currentView || (isCurrent ? 'Sesión local' : null);

                return (
                  <div
                    key={member.id}
                    onClick={() => handleStartSwitch(member)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isCurrent
                        ? 'border-[#34877c] bg-[#34877c]/10 ring-1 ring-[#34877c]'
                        : 'border-[#777777]/20 hover:border-[#777777]/40 bg-[#141414]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs text-white ${
                            member.id === 'member_nacho'
                              ? 'bg-[#27655d]'
                              : member.id === 'member_fede'
                              ? 'bg-[#34877c]'
                              : 'bg-[#5d9f96]'
                          } ${isCurrent ? 'ring-2 ring-white/70' : 'opacity-90'}`}
                        >
                          {member.initials}
                        </div>
                        {isOnline ? (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#202020] animate-pulse"
                            title="En línea"
                          />
                        ) : (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#555555] border-2 border-[#202020]"
                            title="Desconectado"
                          />
                        )}
                      </div>

                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-[#34877c] text-white px-2 py-0.2 rounded-full font-bold">
                              Tu Sesión
                            </span>
                          )}
                          {!isCurrent && isOnline && (
                            <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.2 rounded-full font-bold">
                              En línea
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#888888]">
                          {member.role}
                          {isOnline && currentView && !isCurrent && (
                            <span className="text-[#34877c] font-medium ml-1">
                              • Viendo {currentView}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={e => handleStartEdit(e, member)}
                        className="p-1.5 text-[#777777] hover:text-white rounded-lg hover:bg-[#282828] transition-colors cursor-pointer"
                        title="Editar datos de perfil"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sound Notice & Test Action */}
            <div className="bg-[#141414] p-3 rounded-xl border border-[#777777]/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-[#aaaaaa]">
                <Volume2 className="w-4 h-4 text-[#34877c] shrink-0" />
                <span className="text-[11px]">
                  Aviso sonoro activado al conectarse un integrante
                </span>
              </div>
              <button
                type="button"
                onClick={handleTestSound}
                className="px-2.5 py-1 text-[11px] font-semibold bg-[#282828] hover:bg-[#34877c] hover:text-white text-[#cccccc] rounded-lg transition-colors border border-[#777777]/30 cursor-pointer whitespace-nowrap"
              >
                {soundPlayedNotice ? '✓ Sonando...' : 'Probar sonido'}
              </button>
            </div>

            {/* Logout Action */}
            <div className="pt-3 border-t border-[#777777]/20 flex items-center justify-between">
              <span className="text-xs text-[#777777]">¿Querés cerrar tu sesión actual?</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </>
        ) : (
          /* Member Edit Form */
          <form onSubmit={handleSaveMember} className="space-y-3.5">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Editar Datos de {editingMember.name}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">
                Nombre y Apellido
              </label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#aaaaaa] mb-1">
                Rol / Especialidad en UNKE
              </label>
              <input
                type="text"
                value={formRole}
                onChange={e => setFormRole(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#777777]/20">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="px-3 py-1.5 text-xs text-[#888888] hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#34877c] text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-[#2a6d63] cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
