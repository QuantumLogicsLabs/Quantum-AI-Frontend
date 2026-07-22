import { useState, type ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import type { ChatMessage } from '../types';
import { safeMarkdownUrl } from '../utils/safeUrl';

interface Props {
  message: ChatMessage;
  isLastAssistant?: boolean;
  isLastUser?: boolean;
  streaming?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
  onRetry?: () => void;
  onEdit?: () => void;
  onDownload?: (message: ChatMessage) => void;
  onRequestChanges?: (message: ChatMessage) => void;
}

const TERMINAL_LANGS = new Set([
  'bash',
  'sh',
  'shell',
  'zsh',
  'powershell',
  'ps1',
  'console',
  'terminal',
  'cmd',
  'dos',
]);

function CodeBlock({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const lang = /language-(\w+)/.exec(className || '')?.[1]?.toLowerCase() ?? '';
  const isTerminal = TERMINAL_LANGS.has(lang);
  const text = String(children ?? '').replace(/\n$/, '');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`code-block${isTerminal ? ' code-block--terminal' : ''}`}>
      <div className="code-block-header">
        <span>{isTerminal ? 'Terminal' : lang || 'code'}</span>
        <button type="button" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className={className}>
        {isTerminal ? <span className="terminal-prompt" aria-hidden="true">$</span> : null}
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
}

export function MessageBubble({
  message,
  isLastAssistant,
  isLastUser,
  streaming,
  onCopy,
  onRegenerate,
  onRetry,
  onEdit,
  onDownload,
  onRequestChanges,
}: Props) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      onCopy?.();
    } catch {
      // ignore
    }
  };

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? 'You' : <img src="/logo.png" alt="Quantum AI" />}
      </div>
      <div className={`bubble-wrap ${isUser ? 'user' : 'assistant'}`}>
        <div className={`bubble ${isUser ? 'user' : 'assistant'}`}>
          {isUser ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
          ) : message.content ? (
            <ReactMarkdown
              urlTransform={safeMarkdownUrl}
              rehypePlugins={[rehypeSanitize, rehypeHighlight]}
              components={{
                pre: ({ children }) => <>{children}</>,
                code: ({ className, children, ...props }) => {
                  const isBlock = Boolean(className) || String(children).includes('\n');
                  if (!isBlock) {
                    return (
                      <code className="inline-code" {...props}>
                        {children}
                      </code>
                    );
                  }
                  return <CodeBlock className={className}>{children}</CodeBlock>;
                },
                a: ({ href, children, ...props }) => {
                  const safe = safeMarkdownUrl(href || '');
                  if (!safe) {
                    return <span>{children}</span>;
                  }
                  return (
                    <a href={safe} target="_blank" rel="noopener noreferrer" {...props}>
                      {children}
                    </a>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="typing" aria-label="Assistant is typing">
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {message.content && !streaming && (
          <div className="message-actions">
            <button type="button" onClick={handleCopy} title="Copy message">
              {copied ? 'Copied' : 'Copy'}
            </button>
            {isUser && isLastUser && onEdit && (
              <button type="button" onClick={onEdit} title="Edit prompt">
                Edit
              </button>
            )}
            {!isUser && isLastAssistant && onRegenerate && (
              <button type="button" onClick={onRegenerate} title="Regenerate response">
                Regenerate
              </button>
            )}
            {!isUser && isLastAssistant && onRetry && (
              <button type="button" onClick={onRetry} title="Retry response">
                Retry
              </button>
            )}
          </div>
        )}
        {message.downloadable && (
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={() => onDownload?.(message)}
              style={{
                padding: '6px 12px',
                background: '#2563EB',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ⬇ Download
            </button>
            <button
              type="button"
              onClick={() => onRequestChanges?.(message)}
              style={{
                padding: '6px 12px',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ✏️ Request Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
