import React, { useState, useMemo } from 'react';
import { useStudio } from '../context/StudioContext';
import { formatARS, formatDateAR } from '../utils/currency';
import { Receipt, Plus, Trash2, Edit2, Search } from 'lucide-react';
import { Expense } from '../types';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, updateExpense, deleteExpense } = useStudio();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  
  // Form State
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter(e => e.description.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleOpenNew = () => {
    setEditingExpense(null);
    setFormDesc('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setFormDesc(expense.description);
    setFormAmount(expense.amount.toString());
    setFormDate(expense.date);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc || !formAmount || !formDate) return;
    
    const amountNum = parseFloat(formAmount);

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        description: formDesc,
        amount: amountNum,
        date: formDate,
      });
    } else {
      addExpense({
        description: formDesc,
        amount: amountNum,
        date: formDate,
      });
    }
    
    setIsModalOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#34877c]" />
            Gastos
          </h1>
          <p className="text-sm text-[#888888] mt-1">
            Gestión de gastos operativos del estudio
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 bg-[#34877c] hover:bg-[#2b7268] text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-[#34877c]/20"
        >
          <Plus className="w-4 h-4" />
          Registrar Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#141414] p-5 rounded-2xl border border-[#777777]/20 flex flex-col justify-center">
          <p className="text-xs text-[#888888] font-semibold mb-1">Total Filtrado</p>
          <p className="text-2xl font-black text-white">{formatARS(totalExpenses)}</p>
        </div>
        <div className="md:col-span-2 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[#777777]" />
          </div>
          <input
            type="text"
            placeholder="Buscar gasto por descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-full min-h-[80px] pl-10 pr-4 bg-[#141414] border border-[#777777]/20 rounded-2xl text-white focus:outline-none focus:border-[#34877c]/50 transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#141414] rounded-2xl border border-[#777777]/20 overflow-hidden">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-[#888888]">
            <Receipt className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No se encontraron gastos registrados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#777777]/20">
                  <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider">Descripción</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider text-right">Monto</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#888888] uppercase tracking-wider text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#777777]/10">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[#1a1a1a] transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {formatDateAR(expense.date)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-white text-right">
                      {formatARS(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleOpenEdit(expense)}
                          className="p-1.5 text-[#aaaaaa] hover:text-white hover:bg-[#282828] rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Eliminar gasto "${expense.description}"?`)) {
                              deleteExpense(expense.id);
                            }
                          }}
                          className="p-1.5 text-[#aaaaaa] hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#202020] rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#777777]/20">
            <h3 className="text-xl font-bold text-white mb-6">
              {editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <input
                  type="text"
                  required
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#34877c] transition-colors"
                  placeholder="Ej: Suscripción Adobe CC"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Monto (ARS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#34877c] transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#888888] uppercase tracking-wider mb-1.5">
                  Fecha
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full bg-[#141414] border border-[#777777]/30 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-[#34877c] transition-colors"
                />
              </div>

              <div className="flex gap-3 pt-4 mt-2 border-t border-[#777777]/20">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-[#aaaaaa] hover:text-white bg-[#141414] hover:bg-[#282828] border border-[#777777]/20 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-[#34877c] hover:bg-[#2b7268] rounded-xl transition-colors shadow-lg shadow-[#34877c]/20"
                >
                  {editingExpense ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
