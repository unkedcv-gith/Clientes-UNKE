import React, { useState } from 'react';
import { useStudio } from '../context/StudioContext';
import { PostIt, PostItColor } from '../types';
import { formatDateAR } from '../utils/currency';
import {
  StickyNote,
  Plus,
  Pin,
  Trash2,
  Edit2,
  Search,
  Check,
  X,
  Sparkles,
  Tag,
  AlertTriangle,
} from 'lucide-react';

const COLOR_MAP: Record<
  PostItColor,
  { bg: string; border: string; text: string; darkBg: string; darkBorder: string; darkText: string }
> = {
  yellow: {
    bg: 'bg-amber-100/90',
    border: 'border-amber-300',
    text: 'text-amber-950',
    darkBg: 'dark:bg-amber-950/40',
    darkBorder: 'dark:border-amber-800',
    darkText: 'dark:text-amber-200',
  },
  teal: {
    bg: 'bg-teal-100/90',
    border: 'border-teal-300',
    text: 'text-teal-950',
    darkBg: 'dark:bg-teal-950/40',
    darkBorder: 'dark:border-teal-800',
    darkText: 'dark:text-teal-200',
  },
  coral: {
    bg: 'bg-rose-100/90',
    border: 'border-rose-300',
    text: 'text-rose-950',
    darkBg: 'dark:bg-rose-950/40',
    darkBorder: 'dark:border-rose-800',
    darkText: 'dark:text-rose-200',
  },
  purple: {
    bg: 'bg-purple-100/90',
    border: 'border-purple-300',
    text: 'text-purple-950',
    darkBg: 'dark:bg-purple-950/40',
    darkBorder: 'dark:border-purple-800',
    darkText: 'dark:text-purple-200',
  },
  mint: {
    bg: 'bg-emerald-100/90',
    border: 'border-emerald-300',
    text: 'text-emerald-950',
    darkBg: 'dark:bg-emerald-950/40',
    darkBorder: 'dark:border-emerald-800',
    darkText: 'dark:text-emerald-200',
  },
  blue: {
    bg: 'bg-sky-100/90',
    border: 'border-sky-300',
    text: 'text-sky-950',
    darkBg: 'dark:bg-sky-950/40',
    darkBorder: 'dark:border-sky-800',
    darkText: 'dark:text-sky-200',
  },
};

export const PostItBoardView: React.FC = () => {
  const { postIts, currentUser, team, addPostIt, updatePostIt, deletePostIt } = useStudio();

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>('all');

  // Modal / Inline Create State
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<PostIt | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<PostIt | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<PostItColor>('yellow');
  const [pinned, setPinned] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const handleStartCreate = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('yellow');
    setPinned(false);
    setTagInput('');
    setIsCreating(true);
  };

  const handleStartEdit = (note: PostIt) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setPinned(note.pinned);
    setTagInput(note.tags ? note.tags.join(', ') : '');
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    if (editingNote) {
      updatePostIt(editingNote.id, {
        title: title.trim() || 'Nota sin título',
        content: content.trim(),
        color,
        pinned,
        tags,
      });
    } else {
      addPostIt({
        title: title.trim() || 'Nota de estudio',
        content: content.trim(),
        color,
        pinned,
        tags,
      });
    }

    setIsCreating(false);
    setEditingNote(null);
  };

  const handleDelete = (note: PostIt) => {
    setNoteToDelete(note);
  };

  const confirmDeleteNote = () => {
    if (!noteToDelete) return;
    deletePostIt(noteToDelete.id);
    if (editingNote?.id === noteToDelete.id) {
      setIsCreating(false);
      setEditingNote(null);
    }
    setNoteToDelete(null);
  };

  const filteredNotes = postIts
    .filter(note => {
      const matchSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (note.tags && note.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));

      const matchAuthor = selectedAuthorId === 'all' || note.authorId === selectedAuthorId;
      return matchSearch && matchAuthor;
    })
    .sort((a, b) => {
      // Pinned first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const colorOptions: PostItColor[] = ['yellow', 'teal', 'coral', 'purple', 'mint', 'blue'];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Tablero de Notas & Post-Its del Equipo
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Espacio colaborativo para dejar recordatorios, ideas, avisos de imprenta o comentarios para los demás integrantes.
          </p>
        </div>

        <button
          onClick={handleStartCreate}
          className="flex items-center gap-2 bg-[#34877c] hover:bg-[#276961] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#34877c]"
        >
          <Plus className="w-4 h-4" />
          <span>Pegar Nuevo Post-It</span>
        </button>
      </div>

      {/* Filter & Search */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar en notas por texto o etiqueta..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAuthorId}
            onChange={e => setSelectedAuthorId(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#34877c]"
          >
            <option value="all">Todos los Integrantes</option>
            {team.map(m => (
              <option key={m.id} value={m.id}>
                Notas de {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Post-it Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredNotes.map(note => {
          const colors = COLOR_MAP[note.color] || COLOR_MAP.yellow;

          return (
            <div
              key={note.id}
              className={`p-5 rounded-2xl border shadow-sm transition-all transform hover:-translate-y-0.5 relative flex flex-col justify-between min-h-[220px] ${colors.bg} ${colors.border} ${colors.text} ${colors.darkBg} ${colors.darkBorder} ${colors.darkText}`}
            >
              {/* Pin indicator */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {note.pinned && (
                    <Pin className="w-3.5 h-3.5 fill-current text-rose-600 rotate-12 shrink-0" />
                  )}
                  <h3 className="line-clamp-2">{note.title}</h3>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
                  <button
                    onClick={() => updatePostIt(note.id, { pinned: !note.pinned })}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                    title={note.pinned ? 'Desfijar' : 'Fijar arriba'}
                  >
                    <Pin className={`w-3 h-3 ${note.pinned ? 'text-rose-600 fill-current' : ''}`} />
                  </button>
                  <button
                    onClick={() => handleStartEdit(note)}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
                    title="Editar nota"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(note)}
                    className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 hover:text-rose-600"
                    title="Eliminar nota"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <p className="text-xs whitespace-pre-wrap leading-relaxed flex-1 opacity-90 my-2 font-normal">
                {note.content}
              </p>

              {/* Tags */}
              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-semibold"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Footer Stamp */}
              <div className="pt-2 border-t border-black/10 dark:border-white/10 flex items-center justify-between text-[10px] opacity-75">
                <span className="font-semibold">por {note.authorName}</span>
                <span>{formatDateAR(note.createdAt)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Creating or Editing Post-It */}
      {isCreating && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#777777]/20 space-y-4 text-white">
            <div className="flex items-center justify-between border-b border-[#777777]/20 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#34877c]/15 text-[#34877c] flex items-center justify-center font-bold">
                  <StickyNote className="w-4 h-4" />
                </div>
                <h2 className="text-base font-bold text-white">
                  {editingNote ? 'Editar Post-It' : 'Nuevo Post-It del Estudio'}
                </h2>
              </div>
              <button
                onClick={() => setIsCreating(false)}
                className="text-[#777777] hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {/* Color Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Color de la etiqueta
                </label>
                <div className="flex items-center gap-2">
                  {colorOptions.map(c => {
                    const mapped = COLOR_MAP[c];
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center cursor-pointer ${
                          mapped.bg
                        } ${
                          color === c
                            ? 'scale-110 ring-2 ring-offset-2 ring-offset-[#1a1a1a] ring-[#34877c]'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        {color === c && <Check className="w-3.5 h-3.5 text-slate-900" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Título / Asunto
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej: 🎨 Pruebas de imprenta Los Alerces"
                  className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mensaje o Recordatorio *
                </label>
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={4}
                  required
                  placeholder="Escribí lo que los demás integrantes deben tener en cuenta..."
                  className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Imprenta, Reunión, Urgente..."
                  className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinnedCheck"
                  checked={pinned}
                  onChange={e => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-[#34877c] accent-[#34877c] bg-[#141414] border-[#777777]/40 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="pinnedCheck" className="text-xs text-slate-300 cursor-pointer select-none">
                  Fijar este post-it al principio del tablero 📌
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#777777]/20">
                {editingNote ? (
                  <button
                    type="button"
                    onClick={() => handleDelete(editingNote)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors font-semibold cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Nota</span>
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#34877c] hover:bg-[#276961] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {editingNote ? 'Guardar Cambios' : 'Pegar Nota'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Note */}
      {noteToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#202020] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-500/30 space-y-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-950/60 rounded-xl border border-rose-800/60 text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¿Eliminar Nota?</h3>
                <p className="text-xs text-[#888888]">Esta acción no se puede deshacer</p>
              </div>
            </div>

            <div className="bg-[#141414] p-3.5 rounded-xl border border-[#777777]/20 space-y-1 text-xs">
              <div className="font-bold text-white text-sm">{noteToDelete.title}</div>
              <div className="text-slate-300 line-clamp-3 text-xs leading-relaxed">{noteToDelete.content}</div>
              <div className="text-[10px] text-[#777777] pt-1">
                Por {noteToDelete.authorName} • {formatDateAR(noteToDelete.createdAt)}
              </div>
            </div>

            <p className="text-xs text-slate-300">
              ¿Estás seguro de que deseás despegar y eliminar esta nota del tablero?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#777777]/20">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteNote}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors"
              >
                Sí, Eliminar Nota
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
