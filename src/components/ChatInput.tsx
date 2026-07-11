import { useRef } from 'react';
import type { DocumentItem } from '../types';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  attachedDocs: DocumentItem[];
  onAttach: (files: FileList) => void;
  onRemoveDoc: (id: string) => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  attachedDocs,
  onAttach,
  onRemoveDoc,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  };

  return (
    <div className="chat-input-area">
      {attachedDocs.length > 0 && (
        <div className="attached-docs">
          {attachedDocs.map((doc) => (
            <span key={doc._id} className="chip">
              📎 {doc.originalName}
              <button type="button" onClick={() => onRemoveDoc(doc._id)} aria-label="Remove">
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="input-box">
        <textarea
          rows={1}
          placeholder="Ask Quantum AI anything…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="input-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileRef.current?.click()}
            title="Upload documents"
            disabled={disabled}
          >
            📎
          </button>
          <button
            type="button"
            className="icon-btn send"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            title="Send message"
          >
            ➤
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        className="hidden-input"
        type="file"
        multiple
        accept=".pdf,.docx,.doc,.txt,.md,.markdown,.csv,.xlsx,.xls,.json,.jpg,.jpeg,.png,.gif,.webp"
        onChange={(e) => {
          if (e.target.files?.length) onAttach(e.target.files);
          e.target.value = '';
        }}
      />
    </div>
  );
}
