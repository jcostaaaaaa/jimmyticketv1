import './globals.css';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { TicketProvider } from '@/context/TicketContext';
import { ConversationProvider } from '@/context/ConversationContext';
import { NotificationProvider } from '@/context/NotificationContext';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ServiceNow Ticket Analysis',
  description: 'Analyze and visualize ServiceNow ticket data for better IT service management',
};

// Add custom styles for Samsung Internet browser
export function generateViewport() {
  return {
    viewport: 'width=device-width, initial-scale=1',
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `
          @media screen and (max-width: 768px) {
            /* Direct Samsung browser targeting */
            @supports (-webkit-touch-callout: none) {
              .orange-bg { background-color: #FF8000 !important; }
              .orange-bg:hover { background-color: #F76B00 !important; }
              .orange-text { color: #FF8000 !important; }
              .orange-border { border-left-color: #FF8000 !important; }
              .orange-gradient { 
                background: #FF8000 !important;
                background-image: none !important;
                -webkit-text-fill-color: transparent !important;
                -webkit-background-clip: text !important;
              }
            }
          }
        `}} />
      </head>
      <body className={`min-h-screen font-sans ${inter.className}`}>
        <TicketProvider>
          <ConversationProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ConversationProvider>
        </TicketProvider>
      </body>
    </html>
  );
}

