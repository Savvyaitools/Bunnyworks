import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

export function useFelix() {
  const [messages, setMessages] = useState<FelixMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { agency } = useAgency();

  const sendQuery = useCallback(async (
    query: string,
    queryType: 'analytics' | 'comparison' | 'recommendation' | 'forecast' | 'report' | 'general' = 'general'
  ) => {
    if (!agency?.id || !user?.id) {
      toast({
        title: 'Not authenticated',
        description: 'Please log in to use FELIX.',
        variant: 'destructive'
      });
      return null;
    }

    // Add user message immediately
    const userMessage: FelixMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-felix-query', {
        body: {
          query,
          agencyId: agency.id,
          userId: user.id,
          queryType
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: FelixMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        queryType: data.queryType,
        dataAccessed: data.dataAccessed
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      return data.response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process query';
      setError(message);
      
      // Add error message to chat
      const errorMessage: FelixMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `I apologize, but I encountered an error: ${message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      if (message.includes('Rate limit')) {
        toast({
          title: 'Too many requests',
          description: 'Please wait a moment before trying again.',
          variant: 'destructive'
        });
      } else if (message.includes('credits')) {
        toast({
          title: 'AI Credits Exhausted',
          description: 'Please add credits to continue using FELIX.',
          variant: 'destructive'
        });
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [agency?.id, user?.id, toast]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

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
    isLoading,
    error,
    sendQuery,
    clearMessages,
    getQuickInsight
  };
}
