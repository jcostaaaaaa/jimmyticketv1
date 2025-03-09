'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Ticket {
  number?: string;
  short_description?: string;
  description?: string;
  priority?: string | number;
  state?: string;
  category?: string;
  assigned_to?: string;
  created?: string;
  closed_at?: string;
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