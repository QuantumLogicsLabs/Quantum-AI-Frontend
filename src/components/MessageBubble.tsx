import ReactMarkdown from 'react-markdown';
import type { ChatMessage } from '../types';

interface Props {
  message: ChatMessage;
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <div className={`message-row ${isUser ? 'user' : 'assistant'}`}>
      <div className={`avatar ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? (
          'You'
        ) : (
          <img src="/logo.png" alt="Quantum AI" />
        )}
      </div>
      <div className={`bubble ${isUser ? 'user' : 'assistant'}`}>
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
        ) : message.content ? (
          <ReactMarkdown>{message.content}</ReactMarkdown>
        ) : (
          <div className="typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
    </div>
  );
}
