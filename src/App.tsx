import { useCallback, useEffect, useRef, useState } from 'react';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import {
  deleteConversation,
  fetchConversation,
  fetchConversations,
  fetchDocuments,
} from './api/conversations';
import { streamChat, uploadDocuments, downloadPresentation } from './api/client';
import type { ChatMessage, Conversation, DocumentItem } from './types';

const LOGO_SRC = '/logo.png';

const SUGGESTIONS = [
  'Explain quantum computing in simple terms',
  'Help me study for a biology exam',
  'Summarize key points from my uploaded PDF',
  'Create lesson objectives for photosynthesis',
];

type SidebarTab = 'chats' | 'documents';

export default function App() {
  const [tab, setTab] = useState<SidebarTab>('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [attachedDocs, setAttachedDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  const threadRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  const activeTitle =
    conversations.find((c) => c._id === activeConversationId)?.title ?? 'New conversation';

  const loadConversations = useCallback(async () => {
    try {
      const list = await fetchConversations();
      setConversations(list);
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const list = await fetchDocuments();
      setDocuments(list);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadConversations();
    loadDocuments();
  }, [loadConversations, loadDocuments]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;

    const onScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < 100;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const el = threadRef.current;
    if (!el || !shouldAutoScrollRef.current) return;
    el.scrollTo({ top: el.scrollHeight, behavior: loading ? 'auto' : 'smooth' });
  }, [messages, loading]);

  const openConversation = async (id: string) => {
    setActiveConversationId(id);
    setError(null);
    try {
      const { messages: history } = await fetchConversation(id);
      setMessages(history);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load conversation');
    }
  };

  const startNewChat = () => {
    abortRef.current?.abort();
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
    setAttachedDocs([]);
    setError(null);
  };

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || loading) return;

    setInput('');
    setError(null);
    setLoading(true);

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: message,
    };
    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: 'assistant', content: '' }]);

    abortRef.current = new AbortController();

    try {
      let convId = activeConversationId ?? undefined;

      await streamChat({
        message,
        conversationId: convId,
        documentIds: attachedDocs.map((d) => d._id),
        signal: abortRef.current.signal,
        onStart: (id) => {
          convId = id;
          if (!activeConversationId) setActiveConversationId(id);
        },
        onChunk: (chunk) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
          );
        },
        onError: (msg) => setError(msg),
      });

      await loadConversations();
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError(e instanceof Error ? e.message : 'Failed to send message');
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (files: FileList) => {
    setError(null);
    try {
      const res = await uploadDocuments(files);
      const uploadedIds = new Set(res.data.documents.map((d) => d.id));
      const all = await fetchDocuments();
      setDocuments(all);
      const newDocs = all.filter((d) => uploadedIds.has(d._id));
      setAttachedDocs((prev) => [...prev, ...newDocs.filter((n) => !prev.some((p) => p._id === n._id))]);
      setTab('documents');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    }
  };

  const handleDeleteConversation = async (id: string) => {
    await deleteConversation(id);
    if (activeConversationId === id) startNewChat();
    await loadConversations();
  };

  const handleDocAction = async (doc: DocumentItem, action: 'summarize' | 'ppt' | 'attach') => {
    if (action === 'attach') {
      setAttachedDocs((prev) => (prev.some((d) => d._id === doc._id) ? prev : [...prev, doc]));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (action === 'summarize') {
        setAttachedDocs([doc]);
        await handleSend(`Please provide a comprehensive summary of "${doc.originalName}".`);
      } else {
        const { blob, filename } = await downloadPresentation(doc._id);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">
            <img src={LOGO_SRC} alt="Quantum AI" className="brand-logo" />
            <div>
              <h1>Quantum AI</h1>
              <p>Powered by Groq</p>
            </div>
          </div>
        </div>

        <div className="sidebar-actions">
          <button type="button" className="btn btn-primary" onClick={startNewChat}>
            + New chat
          </button>
        </div>

        <div className="sidebar-tabs">
          <button
            type="button"
            className={`tab ${tab === 'chats' ? 'active' : ''}`}
            onClick={() => setTab('chats')}
          >
            Chats
          </button>
          <button
            type="button"
            className={`tab ${tab === 'documents' ? 'active' : ''}`}
            onClick={() => setTab('documents')}
          >
            Documents
          </button>
        </div>

        <div className="sidebar-list">
          {tab === 'chats' ? (
            conversations.length === 0 ? (
              <p style={{ color: '#64748b', fontSize: '0.8rem', padding: '0.5rem' }}>No conversations yet</p>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv._id}
                  type="button"
                  className={`list-item ${activeConversationId === conv._id ? 'active' : ''}`}
                  onClick={() => openConversation(conv._id)}
                >
                  <span className="list-item-title">{conv.title}</span>
                  <span className="list-item-meta">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                    {' · '}
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conv._id);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handleDeleteConversation(conv._id)}
                      style={{ color: '#f87171' }}
                    >
                      Delete
                    </span>
                  </span>
                </button>
              ))
            )
          ) : documents.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.8rem', padding: '0.5rem' }}>
              Upload PDFs, DOCX, TXT, and more from the chat input
            </p>
          ) : (
            documents.map((doc) => (
              <div key={doc._id} className="list-item">
                <span className="list-item-title">📄 {doc.originalName}</span>
                <span className="list-item-meta">
                  {(doc.wordCount ?? 0).toLocaleString()} words
                  {doc.pageCount ? ` · ${doc.pageCount} pages` : ''}
                </span>
                <div className="doc-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => handleDocAction(doc, 'attach')}>
                    Use in chat
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => handleDocAction(doc, 'summarize')}>
                    Summarize
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => handleDocAction(doc, 'ppt')}>
                    PPT
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          {online ? '● API connected' : '○ API offline — start backend on port 5001'}
        </div>
      </aside>

      <main className="main-panel">
        <header className="chat-header">
          <div className="chat-header-brand">
            <img src={LOGO_SRC} alt="Quantum AI" />
            <div>
              <h2>{activeTitle}</h2>
              <p>
                <span className="status-dot" />
                Groq · llama-3.3-70b-versatile
                {attachedDocs.length > 0 && ` · ${attachedDocs.length} document(s) attached`}
              </p>
            </div>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <div className="chat-thread" ref={threadRef}>
          {messages.length === 0 ? (
            <div className="empty-state">
              <img src="/logo.png" alt="Quantum AI" className="brand-logo-lg" />
              <h3>How can I help you today?</h3>
              <p>
                Chat with Quantum AI, upload documents for analysis, or generate student-friendly
                PowerPoint presentations from PDFs.
              </p>
              <div className="suggestion-grid">
                {SUGGESTIONS.map((s) => (
                  <button key={s} type="button" className="suggestion" onClick={() => handleSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <MessageBubble key={m.id} message={m} />)
          )}
        </div>

        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => handleSend()}
          disabled={loading}
          attachedDocs={attachedDocs}
          onAttach={handleUpload}
          onRemoveDoc={(id) => setAttachedDocs((prev) => prev.filter((d) => d._id !== id))}
        />
      </main>
    </div>
  );
}
