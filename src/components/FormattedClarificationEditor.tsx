import React, { useState, useRef } from 'react';
import { Bold, Italic, List, Pilcrow, Eye, Edit3, Sparkles } from 'lucide-react';

interface FormattedClarificationEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
}

export const FormattedClarificationEditor: React.FC<FormattedClarificationEditorProps> = ({
  value,
  onChange,
  label = 'Aclaraciones / Alcance de entregables cotizados',
  placeholder = 'Ej: • Formatos de entrega en vectores (AI, PDF) y JPG/PNG alta resolución.\n• Incluye hasta 2 instancias de revisión.\n• No incluye costos de impresión de imprenta.',
  helperText = 'Podés resaltar texto con Negrita (**texto**), Cursiva (*texto*), Viñetas (•) o separar en Párrafos.',
}) => {
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Helper to wrap or insert formatting
  const applyFormat = (prefix: string, suffix: string = '', defaultPlaceholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText = '';
    let newCursorPos = 0;

    if (selectedText.length > 0) {
      newText = text.substring(0, start) + prefix + selectedText + suffix + text.substring(end);
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    } else {
      const insertion = defaultPlaceholder || 'texto';
      newText = text.substring(0, start) + prefix + insertion + suffix + text.substring(end);
      newCursorPos = start + prefix.length + insertion.length;
    }

    onChange(newText);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleBold = () => {
    applyFormat('**', '**', 'texto en negrita');
  };

  const handleItalic = () => {
    applyFormat('*', '*', 'texto en cursiva');
  };

  const handleBullet = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;

    // Check if on a new line or start of line
    const beforeCursor = text.substring(0, start);
    const afterCursor = text.substring(end);
    const isAtLineStart = beforeCursor.length === 0 || beforeCursor.endsWith('\n');

    const prefix = isAtLineStart ? '• ' : '\n• ';
    const selectedText = text.substring(start, end);

    if (selectedText.includes('\n')) {
      // Multi-line selection: prepend bullet to each line
      const bulleted = selectedText
        .split('\n')
        .map(line => (line.startsWith('• ') ? line : `• ${line}`))
        .join('\n');
      const newText = text.substring(0, start) + bulleted + afterCursor;
      onChange(newText);
    } else {
      const newText = beforeCursor + prefix + (selectedText || 'Entregable o especificación...') + afterCursor;
      onChange(newText);
    }

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
      }
    }, 0);
  };

  const handleParagraph = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;
    const newText = text.substring(0, start) + '\n\n' + text.substring(start);
    onChange(newText);

    setTimeout(() => {
      if (textarea) {
        textarea.focus();
        textarea.setSelectionRange(start + 2, start + 2);
      }
    }, 0);
  };

  const handleInsertSampleTemplate = () => {
    const template =
      '**Alcance & Especificaciones de Entrega:**\n' +
      '• Formatos finales: Master editable (AI / Figma) y exportaciones en PDF vector, PNG transparente y JPG.\n' +
      '• Revisiones: Se incluyen **2 rondas completas de ajustes** sobre las propuestas presentadas.\n' +
      '• Tiempos: Entrega de primera propuesta dentro de los 7 a 10 días hábiles posteriores a la confirmación.\n' +
      '• *Aclaración:* No incluye costos de impresión gráfica, registro de marca formal en INPI ni licencias tipográficas pagas.';

    onChange(value ? `${value}\n\n${template}` : template);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label}
        </label>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'editor'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Editar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
              activeTab === 'preview'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Vista Previa</span>
          </button>
        </div>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900 focus-within:ring-2 focus-within:ring-[#34877c]/50">
        {/* Rich Text Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleBold}
              title="Texto en Negrita (**texto**)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 text-xs transition-colors"
            >
              <Bold className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only text-[10px]">Negrita</span>
            </button>

            <button
              type="button"
              onClick={handleItalic}
              title="Texto en Cursiva (*texto*)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 italic flex items-center gap-1 text-xs transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only text-[10px]">Cursiva</span>
            </button>

            <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-0.5" />

            <button
              type="button"
              onClick={handleBullet}
              title="Lista de Viñetas (• punto)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 flex items-center gap-1 text-xs transition-colors"
            >
              <List className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only text-[10px]">Viñeta</span>
            </button>

            <button
              type="button"
              onClick={handleParagraph}
              title="Nuevo Párrafo (doble salto de línea)"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-200 flex items-center gap-1 text-xs transition-colors"
            >
              <Pilcrow className="w-3.5 h-3.5" />
              <span className="sr-only sm:not-sr-only text-[10px]">Párrafo</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleInsertSampleTemplate}
            title="Insertar plantilla sugerida de aclaración de entregables"
            className="flex items-center gap-1 text-[10px] font-semibold text-[#34877c] dark:text-[#44a598] hover:bg-[#34877c]/10 px-2 py-1 rounded transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>Plantilla Sugerida</span>
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'editor' ? (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            rows={4}
            placeholder={placeholder}
            className="w-full text-xs p-3 bg-transparent border-0 focus:outline-none focus:ring-0 text-slate-800 dark:text-slate-200 font-mono leading-relaxed placeholder-slate-400 resize-y min-h-[90px]"
          />
        ) : (
          <div className="p-3 min-h-[90px] bg-slate-50/50 dark:bg-slate-900/50">
            {value.trim() ? (
              <FormattedClarificationText text={value} />
            ) : (
              <div className="text-xs text-slate-400 italic py-2">
                No hay aclaraciones escritas todavía. Usá la pestaña "Editar" para redactar.
              </div>
            )}
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * Component to cleanly display formatted clarification text with bold, italic, bullets and paragraphs.
 */
export const FormattedClarificationText: React.FC<{
  text: string;
  className?: string;
  accentColor?: string;
}> = ({ text, className = '', accentColor = 'text-[#34877c]' }) => {
  if (!text || !text.trim()) return null;

  // Split into paragraph blocks separated by 2+ newlines
  const paragraphs = text.split(/\n{2,}/);

  return (
    <div className={`space-y-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300 ${className}`}>
      {paragraphs.map((para, pIdx) => {
        const lines = para.split('\n');
        const hasBullets = lines.some(l => /^\s*([•\-\*]|\d+\.)\s+/.test(l));

        if (hasBullets) {
          return (
            <div key={pIdx} className="space-y-1">
              {lines.map((line, lIdx) => {
                const bulletMatch = line.match(/^\s*([•\-\*]|\d+\.)\s*(.*)/);
                if (bulletMatch) {
                  return (
                    <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                      <span className={`${accentColor} font-bold select-none leading-tight shrink-0`}>
                        •
                      </span>
                      <div className="flex-1 leading-snug">
                        {renderInlineFormattedContent(bulletMatch[2])}
                      </div>
                    </div>
                  );
                }
                return (
                  <p key={lIdx} className="leading-snug">
                    {renderInlineFormattedContent(line)}
                  </p>
                );
              })}
            </div>
          );
        }

        return (
          <p key={pIdx} className="leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {lIdx > 0 && <br />}
                {renderInlineFormattedContent(line)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
};

function renderInlineFormattedContent(str: string): React.ReactNode {
  if (!str) return '';

  // Regex to match **bold**, *italic*, <b>bold</b>, <i>italic</i>
  const regex = /(\*\*([^*]+)\*\*|\*([^*]+)\*|<b>(.*?)<\/b>|<i>(.*?)<\/i>)/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      elements.push(str.slice(lastIndex, match.index));
    }

    if (match[2] !== undefined) {
      // **bold**
      elements.push(
        <strong key={match.index} className="font-bold text-slate-900 dark:text-white">
          {match[2]}
        </strong>
      );
    } else if (match[3] !== undefined) {
      // *italic*
      elements.push(
        <em key={match.index} className="italic text-slate-800 dark:text-slate-200">
          {match[3]}
        </em>
      );
    } else if (match[4] !== undefined) {
      // <b>bold</b>
      elements.push(
        <strong key={match.index} className="font-bold text-slate-900 dark:text-white">
          {match[4]}
        </strong>
      );
    } else if (match[5] !== undefined) {
      // <i>italic</i>
      elements.push(
        <em key={match.index} className="italic text-slate-800 dark:text-slate-200">
          {match[5]}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    elements.push(str.slice(lastIndex));
  }

  return elements.length > 0 ? elements : str;
}
