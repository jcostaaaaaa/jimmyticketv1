'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Ticket {
  number?: string;
  short_description?: string;
  description?: string;
  priority?: string | number;
  status?: string;
  state?: string;
  category?: string;
  subcategory?: string;
  assigned_to?: string;
  created_at?: string;
  created?: string;
  closed_at?: string;
  satisfaction?: {
    score?: number;
    comments?: string;
  };
  time_metrics?: {
    response_time_minutes?: number;
    resolution_time_minutes?: number;
  };
  software?: {
    name?: string;
    version?: string;
  };
  hardware?: {
    model?: string;
    type?: string;
  };
  network?: {
    type?: string;
  };
  [key: string]: any;
}

interface TicketContextType {
  tickets: Ticket[];
  setTickets: (tickets: Ticket[]) => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  return (
    <TicketContext.Provider value={{ tickets, setTickets }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error('useTickets must be used within a TicketProvider');
  }
  return context;
} 