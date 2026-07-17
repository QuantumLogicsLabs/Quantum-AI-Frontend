import { useEffect, useRef, useState } from 'react';
import type { DocumentItem } from '../types';
import { CameraCapture } from './CameraCapture';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop?: () => void;
  disabled?: boolean;
  loading?: boolean;
  attachedDocs: DocumentItem[];
  onAttach: (files: FileList | File[]) => void;
  onRemoveDoc: (id: string) => void;
  webSearch?: boolean;
  onWebSearchChange?: (enabled: boolean) => void;
}

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onStop,
  disabled,
  loading,
  attachedDocs,
  onAttach,
  onRemoveDoc,
  webSearch = false,
  onWebSearchChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [listening, setListening] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [voiceSupported] = useState(() => Boolean(getSpeechRecognition()));

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !loading && value.trim()) onSend();
    }
  };

  const toggleVoice = () => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) return;

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let interim = '';
      let finalText = '';
      for (let i = 0; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) finalText += result[0].transcript;
        else interim += result[0].transcript;
      }
      if (finalText) {
        onChange(`${value}${value && !value.endsWith(' ') ? ' ' : ''}${finalText}`.trimStart());
      } else if (interim) {
        const base = value.replace(/\s*\[listening…\]$/, '');
        onChange(`${base}${base && !base.endsWith(' ') ? ' ' : ''}${interim}`);
      }
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
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
          placeholder={
            listening
              ? 'Listening… speak now'
              : webSearch
                ? 'Ask with live Google, YouTube & Reddit search…'
                : 'Ask Quantum AI anything…'
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled && !loading}
        />
        <div className="input-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={() => fileRef.current?.click()}
            title="Upload documents"
            disabled={loading}
          >
            📎
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setCameraOpen(true)}
            title="Take a photo"
            disabled={loading}
            aria-label="Take a photo"
          >
            📷
          </button>
          {onWebSearchChange && (
            <button
              type="button"
              className={`icon-btn ${webSearch ? 'search-active' : ''}`}
              onClick={() => onWebSearchChange(!webSearch)}
              title={webSearch ? 'Live search on' : 'Search Google, YouTube & Reddit'}
              disabled={loading}
              aria-pressed={webSearch}
              aria-label="Toggle live web search"
            >
              🔍
            </button>
          )}
          {voiceSupported && (
            <button
              type="button"
              className={`icon-btn ${listening ? 'listening' : ''}`}
              onClick={toggleVoice}
              title={listening ? 'Stop voice typing' : 'Voice typing'}
              disabled={loading}
            >
              {listening ? '⏹' : '🎤'}
            </button>
          )}
          {loading ? (
            <button type="button" className="icon-btn stop" onClick={onStop} title="Stop generation">
              ■
            </button>
          ) : (
            <button
              type="button"
              className="icon-btn send"
              onClick={onSend}
              disabled={disabled || !value.trim()}
              title="Send message"
            >
              ➤
            </button>
          )}
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

      <CameraCapture
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={(file) => onAttach([file])}
      />
    </div>
  );
}
