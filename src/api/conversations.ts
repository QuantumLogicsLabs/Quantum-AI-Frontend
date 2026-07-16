import type { ApiResponse } from '../types';
import { apiDelete, apiGet, apiPatch, apiPost } from './client';
import type { ChatMessage, Conversation, DocumentItem } from '../types';

export type ListConversationsParams = {
  q?: string;
  archived?: boolean | 'all';
  limit?: number;
  skip?: number;
  cursor?: string;
};

export async function fetchConversations(params: ListConversationsParams = {}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.archived === 'all') sp.set('archived', 'all');
  else if (params.archived === true) sp.set('archived', 'true');
  else if (params.archived === false) sp.set('archived', 'false');
  if (params.limit != null) sp.set('limit', String(params.limit));
  if (params.skip != null) sp.set('skip', String(params.skip));
  if (params.cursor) sp.set('cursor', params.cursor);
  const qs = sp.toString();
  const res = await apiGet<
    ApiResponse<{ conversations: Conversation[]; total?: number }>
  >(`/conversations${qs ? `?${qs}` : ''}`);
  return res.data?.conversations ?? [];
}

export async function fetchConversationsPage(params: ListConversationsParams = {}) {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.archived === 'all') sp.set('archived', 'all');
  else if (params.archived != null) sp.set('archived', String(params.archived));
  sp.set('limit', String(params.limit ?? 50));
  if (params.cursor) sp.set('cursor', params.cursor);
  const res = await apiGet<
    ApiResponse<{ conversations: Conversation[]; total: number; nextCursor: string | null }>
  >(`/conversations?${sp}`);
  return {
    conversations: res.data?.conversations ?? [],
    total: res.data?.total ?? 0,
    nextCursor: res.data?.nextCursor ?? null,
  };
}

export async function fetchConversation(id: string) {
  const res = await apiGet<
    ApiResponse<{
      conversation: Conversation;
      messages: Array<{ _id: string; role: string; content: string; createdAt: string }>;
    }>
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

export async function updateConversation(
  id: string,
  patch: { title?: string; pinned?: boolean; archived?: boolean }
) {
  const res = await apiPatch<ApiResponse<Conversation>>(`/conversations/${id}`, patch);
  return res.data!;
}

export async function deleteConversation(id: string) {
  await apiDelete(`/conversations/${id}`);
}

export async function deleteLastMessages(id: string, count = 1) {
  const res = await apiPost<ApiResponse<{ deleted: number }>>(
    `/conversations/${id}/messages/delete-last`,
    { count }
  );
  return res.data!;
}

export async function truncateFromMessage(conversationId: string, messageId: string) {
  const res = await apiDelete<ApiResponse<{ deleted: number }>>(
    `/conversations/${conversationId}/messages/from/${messageId}`
  );
  return res.data!;
}

export async function fetchDocuments() {
  const res = await apiGet<ApiResponse<{ documents: DocumentItem[] }>>('/documents');
  return res.data?.documents ?? [];
}

export async function summarizeDocument(id: string) {
  const res = await apiPost<ApiResponse<{ summary: string; model: string }>>(
    `/documents/${id}/summarize`
  );
  return res.data!;
}

export async function askDocument(id: string, question: string) {
  const res = await apiPost<ApiResponse<{ answer: string; model: string }>>(
    `/documents/${id}/ask`,
    { question }
  );
  return res.data!;
}

export async function generateQuiz(
  id: string,
  options: { count?: number; difficulty?: 'easy' | 'medium' | 'hard'; gradeLevel?: string } = {}
) {
  const res = await apiPost<
    ApiResponse<{
      title: string;
      questions: Array<{
        question: string;
        options: string[];
        answerIndex: number;
        explanation: string;
      }>;
      model: string;
    }>
  >(`/documents/${id}/quiz`, {
    count: options.count ?? 10,
    difficulty: options.difficulty ?? 'medium',
    gradeLevel: options.gradeLevel,
  });
  return res.data!;
}

export async function generatePresentationPlan(
  id: string,
  options: { subject?: string; gradeLevel?: string; sloTopics?: string[] } = {}
) {
  const res = await apiPost<
    ApiResponse<{
      presentationTitle: string;
      subtitle?: string;
      slides: Array<{ type: string; title: string; bullets?: string[]; notes?: string }>;
    }>
  >(`/presentations/${id}/plan`, options);
  return res.data!;
}
