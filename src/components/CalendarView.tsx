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
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Calendario de Entregas & Cobros
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Cronograma visual de fechas límite de proyectos y días de cobro de abonos mensuales.
          </p>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[140px] text-center">
            {monthNames[currentMonth]} {currentYear}
          </span>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 text-center text-xs font-bold text-slate-400 bg-slate-50 dark:bg-slate-800/40 py-2.5">
          <span>LUN</span>
          <span>MAR</span>
          <span>MIÉ</span>
          <span>JUE</span>
          <span>VIE</span>
          <span>SÁB</span>
          <span>DOM</span>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 dark:divide-slate-800">
          {/* Empty starting padding days */}
          {Array.from({ length: startingDay }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="min-h-[110px] p-2 bg-slate-50/40 dark:bg-slate-900/30 text-slate-300 dark:text-slate-700 select-none"
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
                className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between ${
                  isToday
                    ? 'bg-teal-50/30 dark:bg-teal-950/20 ring-1 ring-inset ring-[#34877c]/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-[#34877c] text-white'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold text-[#34877c] uppercase">Hoy</span>
                  )}
                </div>

                {/* Events list */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {deliveries.map(proj => (
                    <div
                      key={proj.id}
                      className="p-1 rounded bg-[#34877c]/10 dark:bg-[#34877c]/20 border border-[#34877c]/30 text-[10px] font-semibold text-[#276961] dark:text-[#52bfb2] truncate cursor-pointer hover:opacity-80"
                      title={`Entrega: ${proj.title} (${proj.clientName})`}
                    >
                      📦 {proj.clientName}
                    </div>
                  ))}

                  {retainersBillingToday.map(ret => (
                    <div
                      key={ret.id}
                      className="p-1 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[10px] font-semibold text-amber-800 dark:text-amber-300 truncate"
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
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#34877c]" />
          <span>Próximos compromisos agendados para este mes</span>
        </h2>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {projects
            .filter(p => p.deliveryDate && p.deliveryDate.startsWith(monthString))
            .sort((a, b) => new Date(a.deliveryDate).getTime() - new Date(b.deliveryDate).getTime())
            .map(proj => {
              const badge = getDeadlineBadge(proj.deliveryDate, proj.status);
              return (
                <div key={proj.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-700 dark:text-slate-300 w-24">
                      {formatDateAR(proj.deliveryDate)}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white mr-2">
                        {proj.title}
                      </span>
                      <span className="text-slate-500">({proj.clientName})</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full border text-[11px] ${badge.colorClass}`}>
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
