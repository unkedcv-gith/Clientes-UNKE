import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { formatDateAR, getDeadlineBadge, formatARS } from '../utils/currency';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Repeat,
  Layers,
  CheckCircle2,
} from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { projects, setActiveTab } = useStudio();

  const [currentDate, setCurrentDate] = useState(() => new Date(2026, 7, 1)); // August 2026

  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Days in current month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday

  // Convert to Monday-start (0 = Monday, 6 = Sunday)
  const startingDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  // Gather deliveries in this month
  const monthString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="space-y-6 pb-12 text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 text-[#34877c]" />
            <span>Calendario de Entregas & Cobros</span>
          </h1>
          <p className="text-xs text-[#888888]">
            Cronograma visual de fechas límite de proyectos y días de cobro de abonos mensuales.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3 bg-[#202020] p-1.5 rounded-2xl border border-[#777777]/20 shadow-lg">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl text-[#777777] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-white min-w-[140px] text-center uppercase tracking-wide">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl text-[#777777] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#202020] rounded-2xl border border-[#777777]/20 shadow-lg overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-[#777777]/15 text-center text-xs font-bold text-[#888888] bg-[#141414] py-3 tracking-wider">
          <span>LUN</span>
          <span>MAR</span>
          <span>MIÉ</span>
          <span>JUE</span>
          <span>VIE</span>
          <span>SÁB</span>
          <span>DOM</span>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#777777]/15">
          {/* Empty starting padding days */}
          {Array.from({ length: startingDay }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[110px] p-2 bg-[#171717] text-slate-700 select-none"
            />
          ))}

          {/* Days */}
          {daysArray.map(day => {
            const dateStr = `${monthString}-${String(day).padStart(2, '0')}`;

            // Find projects with delivery date matching this day
            const deliveries = projects.filter(p => p.deliveryDate === dateStr);

            // Find monthly retainers whose billing day is today
            const retainersBillingToday = projects.filter(
              p => p.type === 'mantenimiento' && p.monthlyBillingDay === day
            );

            const isToday =
              day === 16 && currentMonth === 7 && currentYear === 2026; // Current simulation day

            return (
              <div
                key={day}
                className={`min-h-[110px] p-2.5 transition-colors flex flex-col justify-between ${
                  isToday
                    ? 'bg-teal-950/20 ring-1 ring-inset ring-[#34877c]/40'
                    : 'hover:bg-[#181818]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center font-mono ${
                      isToday
                        ? 'bg-[#34877c] text-white shadow-xs'
                        : 'text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold text-[#34877c] uppercase tracking-wider">Hoy</span>
                  )}
                </div>

                {/* Events list */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {deliveries.map(proj => (
                    <div
                      key={proj.id}
                      onClick={() => setActiveTab('projects')}
                      className="p-1.5 rounded-lg bg-[#34877c]/20 border border-[#34877c]/35 text-[10px] font-semibold text-[#52bfb2] truncate cursor-pointer hover:bg-[#34877c]/30 transition-colors"
                      title={`Entrega: ${proj.title} (${proj.clientName})`}
                    >
                      📦 {proj.clientName}
                    </div>
                  ))}

                  {retainersBillingToday.map(ret => (
                    <div
                      key={ret.id}
                      onClick={() => setActiveTab('projects')}
                      className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-800/80 text-[10px] font-semibold text-amber-300 truncate cursor-pointer hover:bg-amber-950/60 transition-colors"
                      title={`Cobro abono mensual: ${ret.clientName}`}
                    >
                      💰 Cobro {ret.clientName}
                    </div>
                  ))}
                </div>

                <div className="h-1" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Agenda Summary below calendar */}
      <div className="bg-[#202020] rounded-2xl border border-[#777777]/20 p-5 sm:p-6 shadow-lg">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#34877c]" />
          <span>Próximos compromisos agendados para este mes</span>
        </h2>

        <div className="divide-y divide-[#777777]/15">
          {projects
            .filter(p => p.deliveryDate && p.deliveryDate.startsWith(monthString))
            .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
            .map(proj => {
              const badge = getDeadlineBadge(proj.deliveryDate, proj.status);
              return (
                <div key={proj.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-300 w-24 font-mono">
                      {formatDateAR(proj.deliveryDate)}
                    </span>
                    <div>
                      <span className="font-bold text-white mr-2">
                        {proj.title}
                      </span>
                      <span className="text-[#888888]">({proj.clientName})</span>
                    </div>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-medium ${badge.colorClass}`}>
                    {badge.label}
                  </span>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};
