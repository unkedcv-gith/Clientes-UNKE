import React, { useState, useRef } from 'react';
import { useStudio } from '../context/StudioContext';
import { UnkeLogo } from './UnkeLogo';
import { ParticleBackground } from './ParticleBackground';
import { Lock, ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff, UserCheck } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { team, login, inactivityLoggedOut, clearInactivityNotice } = useStudio();

  // No user selected by default
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  const selectedMember = team.find(m => m.id === selectedMemberId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedMemberId) {
      setError('Por favor seleccioná tu usuario antes de continuar.');
      return;
    }

    if (!password.trim()) {
      setError('Por favor ingresá tu contraseña.');
      passwordInputRef.current?.focus();
      return;
    }

    setIsLoading(true);
    setError(null);

    setTimeout(() => {
      const res = login(selectedMemberId, password);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Credenciales inválidas');
      }
    }, 200);
  };

  const handleSelectUser = (id: string) => {
    setSelectedMemberId(id);
    setPassword('');
    setError(null);
    clearInactivityNotice();
    // Auto focus password input after picking user
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="relative min-h-screen bg-[#141414] text-[#ffffff] flex flex-col items-center justify-center p-4 selection:bg-[#34877c] selection:text-white overflow-hidden">
      {/* Animated Brand Particles in Background */}
      <ParticleBackground />

      {/* Background Subtle Radial Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,135,124,0.08)_0,transparent_75%)] pointer-events-none z-0" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Card / Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center">
            <UnkeLogo className="h-10 sm:h-12 w-auto text-white drop-shadow-md" />
          </div>
          <p className="text-xs text-[#777777] font-medium tracking-wide">
            Estudio de Diseño & Comunicación • Acceso de Equipo
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-[#202020]/90 backdrop-blur-md border border-[#777777]/20 rounded-2xl p-6 sm:p-7 shadow-2xl space-y-6">
          {inactivityLoggedOut && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <span className="font-bold block text-white">Sesión cerrada por inactividad</span>
                <span>Por seguridad, la sesión se cerró tras 5 minutos sin actividad. Ingresá tu contraseña para continuar.</span>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-[#888888]">
                Seleccioná tu usuario
              </label>
              {selectedMember && (
                <span className="text-[11px] font-medium text-[#34877c] flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  {selectedMember.name}
                </span>
              )}
            </div>

            {/* 3 Users Selector - None pre-selected */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {team.map(member => {
                const isSelected = member.id === selectedMemberId;
                return (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => handleSelectUser(member.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center group cursor-pointer ${
                      isSelected
                        ? 'border-[#34877c] bg-[#34877c]/15 text-white ring-2 ring-[#34877c] shadow-lg shadow-[#34877c]/20 scale-[1.02]'
                        : 'border-[#777777]/20 bg-[#141414]/60 text-[#888888] hover:border-[#34877c]/50 hover:bg-[#1a1a1a] hover:text-slate-200'
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold transition-all mb-2 shadow-sm ${
                        isSelected
                          ? 'bg-[#34877c] text-white ring-2 ring-teal-300'
                          : 'bg-[#2a2a2a] text-[#aaaaaa] group-hover:bg-[#34877c]/20 group-hover:text-white'
                      }`}
                    >
                      {member.initials}
                    </div>
                    <span className="text-xs font-bold leading-tight block line-clamp-1">
                      {member.name.split(' ')[0]}
                    </span>
                    <span className="text-[10px] text-[#777777] block mt-0.5">
                      {member.name.split(' ')[1] || ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#aaaaaa] mb-1.5">
                Contraseña {selectedMember ? `de ${selectedMember.name.split(' ')[0]}` : ''}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#777777]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder={selectedMember ? "Ingresá tu contraseña" : "Primero elegí tu usuario arriba"}
                  className="w-full pl-9 pr-10 py-2.5 bg-[#141414] border border-[#777777]/30 focus:border-[#34877c] focus:ring-1 focus:ring-[#34877c] rounded-xl text-xs sm:text-sm text-white placeholder-[#555555] outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#777777] hover:text-white transition-colors focus-visible:outline-none"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-[#34877c] hover:bg-[#2a6d63] disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-[#34877c]/25 active:scale-[0.99] cursor-pointer"
            >
              <span>{isLoading ? 'Accediendo...' : 'Ingresar al Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Security & Multi-user notice */}
        <div className="flex items-center justify-center gap-2 text-center text-[11px] text-[#777777]">
          <ShieldCheck className="w-4 h-4 text-[#34877c]" />
          <span>Sesión segura por integrante • Sincronización en tiempo real</span>
        </div>
      </div>
    </div>
  );
};
