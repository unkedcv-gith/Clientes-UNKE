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
  Tag,
  AlertTriangle,
  Send,
  Copy,
  ExternalLink,
} from 'lucide-react';

const WHATSAPP_GROUP_URL = 'https://chat.whatsapp.com/GUAfXmKIFlD3z9BgNjuFok?s=cl&p=i&mlu=4&amv=2';

// WhatsApp icon SVG component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="0"
    fill="currentColor"
    className={className}
  >
    <path d="M12.031 2C6.496 2 2 6.496 2 12.031c0 1.768.461 3.493 1.336 5.011L2 22l5.127-1.345c1.472.803 3.13 1.226 4.804 1.226 5.535 0 10.031-4.496 10.031-10.031C21.962 6.496 17.466 2 12.031 2zm5.86 14.195c-.244.686-1.42 1.261-1.956 1.341-.536.08-1.226.113-3.568-.857-2.822-1.168-4.636-4.041-4.778-4.23-.141-.189-1.144-1.523-1.144-2.905 0-1.382.724-2.062.981-2.345.257-.283.565-.353.754-.353.189 0 .377.002.54.01.173.008.406-.066.634.48.236.565.803 1.956.874 2.1.071.144.118.312.024.499-.094.189-.141.307-.283.471-.141.165-.297.368-.424.495-.141.141-.288.293-.124.575.165.283.731 1.205 1.568 1.95 1.077.958 1.984 1.256 2.267 1.397.283.141.448.118.613-.071.165-.189.707-.824.896-1.107.189-.283.377-.236.634-.141.257.094 1.626.767 1.908.908.283.141.471.212.542.33.071.118.071.686-.173 1.372z" />
  </svg>
);

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
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);

  // Copy feedback state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatNoteForWhatsApp = (noteData: {
    title: string;
    content: string;
    authorName: string;
    tags?: string[];
    pinned?: boolean;
  }) => {
    const nowStr = new Date().toLocaleString('es-AR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    const tagsStr =
      noteData.tags && noteData.tags.length > 0
        ? noteData.tags.map(t => `#${t.trim().replace(/\s+/g, '_')}`).join(' ')
        : '';

    let msg = `📌 *POST-IT / NOTA DEL ESTUDIO - UNKE*\n`;
    msg += `👤 *Cargado por:* ${noteData.authorName || currentUser.name}\n`;
    if (noteData.title) msg += `🏷️ *Asunto:* ${noteData.title}\n`;
    msg += `----------------------------------------\n`;
    msg += `📝 *Mensaje:*\n${noteData.content}\n`;
    msg += `----------------------------------------\n`;
    if (tagsStr) msg += `🔖 *Etiquetas:* ${tagsStr}\n`;
    if (noteData.pinned) msg += `📌 *Estado:* Fijado como prioritario\n`;
    msg += `📅 *Fecha:* ${nowStr}`;

    return msg;
  };

  const sendWhatsAppNotification = (noteData: {
    title: string;
    content: string;
    authorName: string;
    tags?: string[];
    pinned?: boolean;
  }) => {
    const text = formatNoteForWhatsApp(noteData);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyNoteText = (note: PostIt) => {
    const text = formatNoteForWhatsApp({
      title: note.title,
      content: note.content,
      authorName: note.authorName,
      tags: note.tags,
      pinned: note.pinned,
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(note.id);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  const handleStartCreate = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setColor('yellow');
    setPinned(false);
    setTagInput('');
    setNotifyWhatsApp(true);
    setIsCreating(true);
  };

  const handleStartEdit = (note: PostIt) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color);
    setPinned(note.pinned);
    setTagInput(note.tags ? note.tags.join(', ') : '');
    setNotifyWhatsApp(false); // Default to false when just editing, user can check if needed
    setIsCreating(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const tags = tagInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const notePayload = {
      title: title.trim() || 'Nota del Estudio',
      content: content.trim(),
      color,
      pinned,
      tags,
    };

    if (editingNote) {
      updatePostIt(editingNote.id, notePayload);
    } else {
      addPostIt(notePayload);
    }

    // Trigger WhatsApp notification if requested
    if (notifyWhatsApp) {
      sendWhatsAppNotification({
        title: notePayload.title,
        content: notePayload.content,
        authorName: editingNote ? editingNote.authorName : currentUser.name,
        tags: notePayload.tags,
        pinned: notePayload.pinned,
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
    <div className="space-y-6 pb-12 text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <StickyNote className="w-6 h-6 text-[#34877c]" />
            <span>Tablero de Notas & Post-Its del Equipo</span>
          </h1>
          <p className="text-xs text-[#888888]">
            Espacio colaborativo con avisos, ideas y sincronización automática vía WhatsApp con el grupo de UNKE.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quick link to UNKE WhatsApp Group */}
          <a
            href={WHATSAPP_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] border border-[#25D366]/30 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer"
            title="Abrir grupo de WhatsApp de UNKE Estudio"
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Grupo UNKE</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>

          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 bg-[#34877c] hover:bg-[#2a6d63] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Pegar Nuevo Post-It</span>
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-[#202020] p-3.5 sm:p-4 rounded-2xl border border-[#777777]/20 shadow-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#777777]" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar en notas por texto o etiqueta..."
            className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-white placeholder-[#777777] outline-none focus:border-[#34877c] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedAuthorId}
            onChange={e => setSelectedAuthorId(e.target.value)}
            className="px-3 py-2 bg-[#141414] border border-[#777777]/25 rounded-xl text-xs text-slate-200 outline-none focus:border-[#34877c]"
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
        {filteredNotes.length === 0 ? (
          <div className="col-span-full bg-[#202020] border border-[#777777]/20 rounded-2xl p-12 text-center text-[#777777] shadow-lg">
            <StickyNote className="w-10 h-10 mx-auto mb-2 opacity-40 text-[#555555]" />
            <p className="text-sm font-medium text-[#888888]">No hay notas con los filtros seleccionados.</p>
            <button
              onClick={handleStartCreate}
              className="mt-3 text-xs text-[#34877c] hover:underline font-bold cursor-pointer"
            >
              + Pegar la primera nota en el tablero
            </button>
          </div>
        ) : (
          filteredNotes.map(note => {
            const colors = COLOR_MAP[note.color] || COLOR_MAP.yellow;

            return (
              <div
                key={note.id}
                className={`p-5 rounded-2xl border shadow-md transition-all transform hover:-translate-y-0.5 relative flex flex-col justify-between min-h-[240px] ${colors.bg} ${colors.border} ${colors.text} ${colors.darkBg} ${colors.darkBorder} ${colors.darkText}`}
              >
                {/* Pin indicator & top controls */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-sm">
                      {note.pinned && (
                        <Pin className="w-3.5 h-3.5 fill-current text-rose-600 rotate-12 shrink-0" />
                      )}
                      <h3 className="line-clamp-2 leading-tight">{note.title}</h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 opacity-80 hover:opacity-100">
                      <button
                        onClick={() => updatePostIt(note.id, { pinned: !note.pinned })}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title={note.pinned ? 'Desfijar' : 'Fijar arriba'}
                      >
                        <Pin className={`w-3.5 h-3.5 ${note.pinned ? 'text-rose-600 fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleStartEdit(note)}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer"
                        title="Editar nota"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(note)}
                        className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Eliminar nota"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <p className="text-xs whitespace-pre-wrap leading-relaxed opacity-90 my-2 font-normal">
                    {note.content}
                  </p>

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-black/10 dark:bg-white/10 font-semibold font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Stamp & WhatsApp notification bar */}
                <div className="space-y-2 pt-2 border-t border-black/10 dark:border-white/10">
                  <div className="flex items-center justify-between text-[10px] opacity-80">
                    <span className="font-bold">por {note.authorName}</span>
                    <span>{formatDateAR(note.createdAt)}</span>
                  </div>

                  {/* Quick Action: Share to WhatsApp & Copy */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      onClick={() =>
                        sendWhatsAppNotification({
                          title: note.title,
                          content: note.content,
                          authorName: note.authorName,
                          tags: note.tags,
                          pinned: note.pinned,
                        })
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-950 dark:text-emerald-300 border border-emerald-500/30 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
                      title="Abrir WhatsApp con esta nota lista para enviar al grupo"
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-[#25D366]" />
                      <span>Notificar WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleCopyNoteText(note)}
                      className="p-1.5 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                      title="Copiar texto formateado"
                    >
                      {copiedId === note.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 opacity-75" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
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
                <div>
                  <h2 className="text-base font-bold text-white">
                    {editingNote ? 'Editar Post-It' : 'Nuevo Post-It del Estudio'}
                  </h2>
                  <p className="text-[11px] text-[#888888]">
                    Publicado como <strong>{currentUser.name}</strong>
                  </p>
                </div>
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
                  placeholder="Imprenta, Reunión, Urgente, Presupuesto..."
                  className="w-full text-xs px-3 py-2 bg-[#141414] border border-[#777777]/30 rounded-xl text-white outline-none focus:border-[#34877c]"
                />
              </div>

              {/* Pin Checkbox */}
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

              {/* WhatsApp Notification Option */}
              <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notifyWhatsAppCheck"
                    checked={notifyWhatsApp}
                    onChange={e => setNotifyWhatsApp(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 bg-[#141414] border-emerald-700 focus:ring-0 cursor-pointer"
                  />
                  <label
                    htmlFor="notifyWhatsAppCheck"
                    className="text-xs font-bold text-emerald-300 cursor-pointer select-none flex items-center gap-1.5"
                  >
                    <WhatsAppIcon className="w-3.5 h-3.5 fill-current text-[#25D366]" />
                    <span>Notificar automáticamente al grupo de WhatsApp</span>
                  </label>
                </div>
                <p className="text-[11px] text-emerald-200/70 pl-6 leading-normal">
                  Al guardar, se abrirá WhatsApp con el mensaje estructurado para enviarlo al grupo con 1 solo toque.
                </p>
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
                    className="flex items-center gap-1.5 px-5 py-2 bg-[#34877c] hover:bg-[#276961] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {notifyWhatsApp && <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />}
                    <span>{editingNote ? 'Guardar Cambios' : 'Pegar Nota'}</span>
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#888888] hover:text-white hover:bg-[#141414] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteNote}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors cursor-pointer"
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
