'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define conversation message types
export interface ConversationMessage {
  sender: 'user' | 'agent' | 'system';
  timestamp: string;
  content: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  category?: string;
  resolved?: boolean;
  tags?: string[];
  [key: string]: unknown;
}

// Define conversation data structure
export interface Conversation {
  id: string;
  customer_id?: string;
  agent_id?: string;
  start_time: string;
  end_time?: string;
  channel: 'chat' | 'email' | 'phone' | 'social' | 'other';
  messages: ConversationMessage[];
  resolved: boolean;
  topic?: string;
  satisfaction_score?: number;
  [key: string]: unknown;
}

export interface ConversationContextType {
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
  activeConversations: Conversation[];
  historicalConversations: Conversation[];
  getConversationById: (id: string) => Conversation | undefined;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Helper methods for working with conversations
  const activeConversations = conversations.filter(c => !c.end_time || new Date(c.end_time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const historicalConversations = conversations.filter(c => c.end_time && new Date(c.end_time) <= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  
  const getConversationById = (id: string) => {
    return conversations.find(c => c.id === id);
  };

  return (
    <ConversationContext.Provider value={{ 
      conversations, 
      setConversations, 
      activeConversations, 
      historicalConversations,
      getConversationById
    }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
} 