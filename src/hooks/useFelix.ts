import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAgency } from '@/hooks/useAgency';

interface FelixMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  queryType?: string;
  dataAccessed?: string[];
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useFelix() {
  const [messages, setMessages] = useState<FelixMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { agency } = useAgency();

  // Load conversation list
  const loadConversations = useCallback(async () => {
    if (!agency?.id) return;
    const { data } = await supabase
      .from('coach_pbf_conversations')
      .select('id, title, created_at, updated_at')
      .eq('agency_id', agency.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [agency?.id]);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoadingHistory(true);
    const { data } = await supabase
      .from('coach_pbf_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data.map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date(m.created_at),
        queryType: m.query_type || undefined,
        dataAccessed: (m.data_accessed as string[]) || undefined,
      })));
    }
    setActiveConversationId(conversationId);
    setIsLoadingHistory(false);
  }, []);

  // Create a new conversation
  const createConversation = useCallback(async (title?: string): Promise<string | null> => {
    if (!agency?.id || !user?.id) return null;
    const { data, error } = await supabase
      .from('coach_pbf_conversations')
      .insert({ agency_id: agency.id, user_id: user.id, title: title || 'New Conversation' })
      .select('id')
      .single();
    if (error || !data) return null;
    await loadConversations();
    return data.id;
  }, [agency?.id, user?.id, loadConversations]);

  // Save a message to DB
  const saveMessage = useCallback(async (
    conversationId: string,
    role: 'user' | 'assistant',
    content: string,
    queryType?: string,
    dataAccessed?: string[]
  ) => {
    await supabase.from('coach_pbf_messages').insert({
      conversation_id: conversationId,
      role,
      content,
      query_type: queryType || null,
      data_accessed: dataAccessed || [],
    });
    const shortTitle = role === 'user' ? (content.length > 60 ? content.substring(0, 57) + '...' : content) : undefined;
    await supabase
      .from('coach_pbf_conversations')
      .update({ ...(shortTitle ? { title: shortTitle } : {}), updated_at: new Date().toISOString() })
      .eq('id', conversationId);
  }, []);

  // Start a new chat
  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
  }, []);

  // Select an existing conversation
  const selectConversation = useCallback(async (conversationId: string) => {
    await loadMessages(conversationId);
  }, [loadMessages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const sendQuery = useCallback(async (
    query: string,
    queryType: 'analytics' | 'comparison' | 'recommendation' | 'forecast' | 'report' | 'general' = 'general'
  ) => {
    if (!agency?.id || !user?.id) {
      toast.error('Please log in to use Coach PBF.');
      return null;
    }

    let convId = activeConversationId;
    if (!convId) {
      convId = await createConversation(query.length > 60 ? query.substring(0, 57) + '...' : query);
      if (!convId) return null;
      setActiveConversationId(convId);
    }

    const userMessage: FelixMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    await saveMessage(convId, 'user', query);

    setIsLoading(true);
    setError(null);

    try {
      const historyForContext = messages.slice(-20).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error: fnError } = await supabase.functions.invoke('ai-felix-query', {
        body: {
          query,
          agencyId: agency.id,
          userId: user.id,
          queryType,
          conversationHistory: historyForContext,
        }
      });

      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);

      const assistantMessage: FelixMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        queryType: data.queryType,
        dataAccessed: data.dataAccessed
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      await saveMessage(convId, 'assistant', data.response, data.queryType, data.dataAccessed);
      await loadConversations();
      return data.response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process query';
      setError(message);
      
      const errorMessage: FelixMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      await saveMessage(convId, 'assistant', errorMessage.content);
      
      if (message.includes('Rate limit')) {
        toast.error('Too many requests. Please wait a moment before trying again.');
      } else if (message.includes('credits')) {
        toast.error('AI Credits Exhausted. Please add credits to continue using Coach PBF.');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [agency?.id, user?.id, activeConversationId, createConversation, saveMessage, messages, loadConversations]);

  const deleteConversation = useCallback(async (conversationId: string) => {
    await supabase.from('coach_pbf_conversations').delete().eq('id', conversationId);
    if (activeConversationId === conversationId) {
      startNewChat();
    }
    await loadConversations();
  }, [activeConversationId, startNewChat, loadConversations]);

  const getQuickInsight = useCallback(async (insightType: 'daily_summary' | 'top_performers' | 'alerts') => {
    const queries = {
      daily_summary: "Give me a quick summary of today's agency performance. What are the key metrics I should know?",
      top_performers: "Who are my top performing creators and chatters this week? What's making them successful?",
      alerts: "Are there any issues or concerns I should be aware of? Any performance drops or missed targets?"
    };
    return sendQuery(queries[insightType], insightType === 'alerts' ? 'recommendation' : 'analytics');
  }, [sendQuery]);

  return {
    messages,
    conversations,
    activeConversationId,
    isLoading,
    isLoadingHistory,
    error,
    sendQuery,
    getQuickInsight,
    startNewChat,
    selectConversation,
    deleteConversation,
  };
}
