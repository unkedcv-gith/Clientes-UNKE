import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { TeamMember } from '../types';
import { Users, Check, Edit2, Shield, X, Lock, LogOut, Eye, EyeOff } from 'lucide-react';

interface TeamLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TeamLoginModal: React.FC<TeamLoginModalProps> = ({ isOpen, onClose }) => {
  const { team, currentUser, login, logout, updateTeamMember } = useStudio();

  const [switchingToMember, setSwitchingToMember] = useState<TeamMember | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('');

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
                Sesión activa y cambio de integrante
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#777777] hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Switch password prompt */}
        {switchingToMember ? (
          <form onSubmit={handleConfirmSwitch} className="space-y-4">
            <div className="bg-[#141414] p-3.5 rounded-xl border border-[#777777]/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#34877c] flex items-center justify-center text-xs font-bold text-white">
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
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777777] hover:text-white transition-colors focus-visible:outline-none"
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
                className="px-3.5 py-1.5 text-xs text-[#888888] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#34877c] hover:bg-[#2a6d63] text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
              >
                Confirmar Cambio
              </button>
            </div>
          </form>
        ) : !editingMember ? (
          <>
            {/* Team Members List */}
            <div className="space-y-2.5">
              {team.map(member => {
                const isCurrent = member.id === currentUser.id;
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
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-xs ${
                          isCurrent ? 'bg-[#34877c] text-white' : 'bg-[#444444] text-[#aaaaaa]'
                        }`}
                      >
                        {member.initials}
                      </div>
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          <span>{member.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-[#34877c] text-white px-2 py-0.2 rounded-full font-bold">
                              Activo
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#888888]">{member.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={e => handleStartEdit(e, member)}
                        className="p-1.5 text-[#777777] hover:text-white rounded-lg hover:bg-[#282828] transition-colors"
                        title="Editar datos de perfil"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Logout Action */}
            <div className="pt-3 border-t border-[#777777]/20 flex items-center justify-between">
              <span className="text-xs text-[#777777]">¿Querés cerrar tu sesión actual?</span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors"
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
                className="px-3 py-1.5 text-xs text-[#888888] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#34877c] text-white rounded-xl text-xs font-semibold shadow-sm hover:bg-[#2a6d63]"
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
