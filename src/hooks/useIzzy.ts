import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Suggestion {
  text: string;
  intent: string;
  confidence: number;
}

interface UseIzzyOptions {
  creatorId: string;
  accountId?: string;
  fanId?: string;
}

export function useIzzy({ creatorId, accountId, fanId }: UseIzzyOptions) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  const getSuggestions = useCallback(async (
    fanMessage: string,
    conversationHistory: Message[] = [],
    suggestionType: 'reply' | 'ppv_price' | 'upsell' = 'reply'
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-izzy-suggest', {
        body: {
          fanMessage,
          conversationHistory,
          creatorId,
          fanId,
          accountId,
          suggestionType
        }
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setSuggestions(data.suggestions || []);
      return data.suggestions;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get suggestions';
      setError(message);
      
      if (message.includes('Rate limit')) {
        toast.error('Too many requests', {
          description: 'Please wait a moment before trying again.',
        });
      } else if (message.includes('credits')) {
        toast.error('AI Credits Exhausted', {
          description: 'Please add credits to continue using Marylin Monroe.',
        });
      }
      
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [creatorId, accountId, fanId]);

  const logSelection = useCallback(async (
    selectedIndex: number | null,
    finalMessage: string,
    wasEdited: boolean,
    chatId?: string
  ) => {
    try {
      await (supabase.from('ai_suggestions_log') as any).insert({
        creator_id: creatorId,
        of_chat_id: chatId,
        suggestion_type: 'reply',
        suggestions: suggestions,
        selected_index: selectedIndex,
        was_edited: wasEdited,
        final_message: finalMessage
      });
    } catch (err) {
      console.error('Failed to log suggestion selection:', err);
    }
  }, [creatorId, suggestions]);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    getSuggestions,
    logSelection,
    clearSuggestions
  };
}
