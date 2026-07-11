import type { ApiResponse } from '../types';
import { apiDelete, apiGet, apiPost } from './client';
import type { ChatMessage, Conversation, DocumentItem } from '../types';

export async function fetchConversations() {
  const res = await apiGet<ApiResponse<{ conversations: Conversation[] }>>('/conversations');
  return res.data?.conversations ?? [];
}

export async function fetchConversation(id: string) {
  const res = await apiGet<
    ApiResponse<{ conversation: Conversation; messages: Array<{ _id: string; role: string; content: string; createdAt: string }> }>
  >(`/conversations/${id}`);
  const messages: ChatMessage[] =
    res.data?.messages.map((m) => ({
      id: m._id,
      role: m.role as ChatMessage['role'],
      content: m.content,
      createdAt: m.createdAt,
    })) ?? [];
  return { conversation: res.data?.conversation, messages };
}

export async function createConversation(title?: string) {
  const res = await apiPost<ApiResponse<Conversation>>('/conversations', { title });
  return res.data!;
}

export async function deleteConversation(id: string) {
  await apiDelete(`/conversations/${id}`);
}

export async function fetchDocuments() {
  const res = await apiGet<ApiResponse<{ documents: DocumentItem[] }>>('/documents');
  return res.data?.documents ?? [];
}

export async function summarizeDocument(id: string) {
  const res = await apiPost<ApiResponse<{ summary: string; model: string }>>(`/documents/${id}/summarize`);
  return res.data!;
}

export async function askDocument(id: string, question: string) {
  const res = await apiPost<ApiResponse<{ answer: string; model: string }>>(`/documents/${id}/ask`, {
    question,
  });
  return res.data!;
}
