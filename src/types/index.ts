export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt?: string;
}

export interface Conversation {
  _id: string;
  title: string;
  documentIds?: string[];
  updatedAt: string;
  createdAt: string;
}

export interface DocumentItem {
  _id: string;
  originalName: string;
  mimeType: string;
  size: number;
  wordCount?: number;
  pageCount?: number;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}
