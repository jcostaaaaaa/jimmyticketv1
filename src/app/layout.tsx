import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { TicketProvider } from '@/context/TicketContext';
import { ConversationProvider } from '@/context/ConversationContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ServiceNow Ticket Analysis',
  description: 'Analyze and visualize ServiceNow ticket data for better IT service management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className={`min-h-screen font-sans ${inter.className}`}>
        <TicketProvider>
          <ConversationProvider>
            {children}
          </ConversationProvider>
        </TicketProvider>
      </body>
    </html>
  );
}
