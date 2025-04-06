'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaSearch } from 'react-icons/fa';
import { useTickets } from '@/context/TicketContext';
import type { Ticket } from '@/context/TicketContext';

// Create a custom toast component since we're not using Chakra UI
const Toast = ({ title, description, status, onClose }: { 
  title: string; 
  description: string; 
  status: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
}) => {
  const bgColor = status === 'success' ? 'bg-green-500' : 
                  status === 'error' ? 'bg-red-500' : 
                  status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
  
  return (
    <div className={`p-4 rounded-md shadow-lg ${bgColor} text-white max-w-md mb-4 relative`}>
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-white hover:text-gray-200"
        aria-label="Close notification"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <div>
        <h3 className="font-bold">{title}</h3>
        <p>{description}</p>
      </div>
    </div>
  );
};

// Custom hook for toast functionality
const useToast = () => {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: 'success' | 'error' | 'info' | 'warning';
    timeoutId?: NodeJS.Timeout;
  }>>([]);
  
  // Function to add a toast
  const toast = ({ 
    title, 
    description, 
    status
  }: { 
    title: string; 
    description: string; 
    status: 'success' | 'error' | 'info' | 'warning';
  }) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // Remove any existing toasts with the same title
    setToasts(prev => {
      const filtered = prev.filter(t => t.title !== title);
      
      // Create a timeout to auto-dismiss after 5 seconds
      const timeoutId = setTimeout(() => {
        console.log(`Auto-dismissing toast with id: ${id}`);
        closeToast(id);
      }, 5000);
      
      return [...filtered, { id, title, description, status, timeoutId }];
    });
  };
  
  // Function to close a toast
  const closeToast = (id: string) => {
    console.log(`Closing toast with id: ${id}`);
    setToasts(prev => {
      // Clear the timeout for the toast being removed
      const toastToRemove = prev.find(t => t.id === id);
      if (toastToRemove?.timeoutId) {
        console.log(`Clearing timeout for toast id: ${id}`);
        clearTimeout(toastToRemove.timeoutId);
      }
      
      const newToasts = prev.filter(toast => toast.id !== id);
      console.log(`Removed toast. Previous count: ${prev.length}, New count: ${newToasts.length}`);
      return newToasts;
    });
  };
  
  // Cleanup timeouts when component unmounts
  useEffect(() => {
    return () => {
      toasts.forEach(t => {
        if (t.timeoutId) {
          clearTimeout(t.timeoutId);
        }
      });
    };
  }, [toasts]);
  
  // Toast container component
  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 flex flex-col items-end">
      {toasts.map(t => (
        <Toast 
          key={t.id} 
          title={t.title} 
          description={t.description} 
          status={t.status}
          onClose={() => closeToast(t.id)}
        />
      ))}
    </div>
  );
  
  return { toast, ToastContainer };
};

interface JournalEntry {
  id: string;
  date: string;
  originalDate: Date;
  content: string;
  tags: string[];
  ticketNumber?: string;
  source: 'description' | 'resolution' | 'manual' | 'ai';
}

export default function JournalPage() {
  const router = useRouter();
  const { tickets } = useTickets();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  // Custom toast hook
  const { toast, ToastContainer } = useToast();

  // Function to extract keywords as tags from text
  const extractKeywordsAsTags = useCallback((text: string): string[] => {
    // Hardware components
    const hardwareComponents = [
      'printer', 'laptop', 'desktop', 'monitor', 'keyboard', 'mouse', 'server',
      'network', 'router', 'switch', 'access point', 'firewall', 'hard drive',
      'ssd', 'ram', 'memory', 'cpu', 'processor', 'motherboard', 'battery',
      'power supply', 'ups', 'scanner', 'projector', 'camera', 'microphone',
      'headset', 'dock', 'docking station', 'cable', 'adapter', 'port'
    ];
    
    // Software applications
    const softwareApplications = [
      'windows', 'office', 'word', 'excel', 'powerpoint', 'outlook', 'teams',
      'sharepoint', 'onedrive', 'chrome', 'firefox', 'edge', 'browser',
      'adobe', 'acrobat', 'photoshop', 'illustrator', 'indesign', 'premiere',
      'zoom', 'skype', 'slack', 'discord', 'vpn', 'antivirus', 'security',
      'database', 'sql', 'oracle', 'mysql', 'postgresql', 'mongodb', 'api',
      'cloud', 'aws', 'azure', 'google cloud', 'saas', 'erp', 'crm'
    ];
    
    // Issue types
    const issueTypes = [
      'login', 'password', 'authentication', 'access', 'permission', 'error',
      'crash', 'freeze', 'slow', 'performance', 'update', 'upgrade', 'install',
      'uninstall', 'configuration', 'settings', 'backup', 'restore', 'data loss',
      'connectivity', 'internet', 'wifi', 'bluetooth', 'driver', 'firmware',
      'boot', 'startup', 'shutdown', 'blue screen', 'bsod', 'virus', 'malware',
      'spam', 'phishing', 'security breach', 'data breach', 'encryption'
    ];
    
    const allKeywords = [...hardwareComponents, ...softwareApplications, ...issueTypes];
    const tags: string[] = [];
    
    // Check for each keyword in the text
    allKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        // Avoid duplicates
        if (!tags.includes(keyword)) {
          tags.push(keyword);
        }
      }
    });
    
    // Limit to 5 most relevant tags
    return tags.slice(0, 5);
  }, []);

  // Extract meaningful tags from a ticket
  const extractMeaningfulTags = useCallback((ticket: Ticket): string[] => {
    // Combine description and resolution text for tag extraction
    let text = '';
    if (ticket.description && typeof ticket.description === 'string') {
      text += ticket.description + ' ';
    }
    if (ticket.resolution && typeof ticket.resolution === 'string') {
      text += ticket.resolution;
    }
    
    return extractKeywordsAsTags(text);
  }, [extractKeywordsAsTags]);

  // Function to generate a learning entry with AI
  const generateLearningEntryWithAI = useCallback(async (ticket: Ticket): Promise<string | null> => {
    try {
      // Check if ticket has description and resolution
      if (!ticket.description || !ticket.resolution) {
        console.log('Skipping ticket without description or resolution');
        return null;
      }

      // Construct a prompt that will generate specific technical learning entries
      const prompt = `
      You are an IT professional documenting what you learned from resolving a technical support ticket.
      
      TICKET DESCRIPTION:
      ${ticket.description || 'No description provided'}
      
      RESOLUTION:
      ${ticket.resolution || 'No resolution provided'}
      
      Write a detailed, specific learning journal entry that starts with "Today I learned about..." 
      
      Your entry MUST:
      1. Identify the SPECIFIC technical issue (not generic categories like "hardware" or "software")
      2. Mention the exact components that failed (e.g., "corrupted registry keys", "failed network switch port")
      3. Include technical details about symptoms and root causes
      4. Explain the specific troubleshooting steps that were effective
      5. Be written in first person as if you personally solved this issue
      6. Be 3-5 sentences long
      
      BAD EXAMPLE: "Today I learned about hardware issues. The problem was with a computer not working. I fixed it by replacing parts."
      
      GOOD EXAMPLE: "Today I learned about troubleshooting Windows registry corruption causing application crashes. The specific issue involved corrupted shell extension registry keys preventing File Explorer from properly loading file context menus. I discovered that running the System File Checker and manually removing the problematic registry keys under HKEY_CLASSES_ROOT resolved the issue without requiring a system restore."
      `;
      
      console.log('Generating AI entry for ticket:', ticket.number || ticket.sys_id);
      
      // Prepare request body
      const requestBody = {
        messages: [
          {
            role: 'system',
            content: 'You are an IT professional documenting specific technical learnings from support tickets.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 250
      };
      
      console.log('API request body:', JSON.stringify(requestBody).substring(0, 200) + '...');
      
      // Make API call to our secure API route that handles the OpenAI API key
      console.log('Making fetch request to /api/journal');
      const response = await fetch('/api/journal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        console.error(`API response not OK: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log('Error response text:', errorText);
        
        let errorMessage = 'Unknown error';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'API error';
          console.log('Parsed error data:', errorData);
        } catch {
          errorMessage = errorText || `HTTP error ${response.status}`;
          console.log('Failed to parse error response as JSON');
        }
        
        console.error('OpenAI API error:', errorMessage);
        toast({
          title: 'AI Processing Failed',
          description: `Error: ${errorMessage}`,
          status: 'error'
        });
        return null;
      }
      
      console.log('API response OK, parsing JSON');
      let data;
      try {
        data = await response.json();
        console.log('API response received:', JSON.stringify(data).substring(0, 200) + '...');
      } catch (error) {
        console.error('Failed to parse API response as JSON:', error);
        toast({
          title: 'API Response Error',
          description: 'Failed to parse API response',
          status: 'error'
        });
        return null;
      }
      
      console.log('Checking for AI content in response');
      const aiEntry = data.choices?.[0]?.message?.content?.trim();
      console.log('AI entry found:', aiEntry ? 'Yes' : 'No');
      
      if (!aiEntry) {
        console.error('No content in API response:', JSON.stringify(data));
        toast({
          title: 'AI Processing Failed',
          description: 'No content generated by AI',
          status: 'error'
        });
        return null;
      }
      
      console.log('Generated entry:', aiEntry.substring(0, 50) + '...');
      return aiEntry;
    } catch (error) {
      console.error('Error generating AI entry:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Error details:', errorMessage);
      toast({
        title: 'AI Processing Failed',
        description: `Error: ${errorMessage}`,
        status: 'error'
      });
      return null;
    }
  }, [toast]);

  // Function to process tickets with AI
  const processTicketsWithAI = useCallback(async () => {
    if (tickets.length === 0) {
      toast({
        title: 'No Tickets Available',
        description: 'Please import tickets first before generating journal entries.',
        status: 'warning'
      });
      return;
    }
    
    setIsProcessingAI(true);
    console.log(`Starting to process ${tickets.length} tickets with AI...`);
    
    try {
      const processedTickets = new Set<string>();
      const aiEntries: JournalEntry[] = [];
      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      
      // Process tickets sequentially to avoid rate limiting
      for (const ticket of tickets) {
        // Skip if we've already processed this ticket
        const ticketId = typeof ticket.number === 'string' ? ticket.number : 
                        typeof ticket.sys_id === 'string' ? ticket.sys_id : '';
        
        if (!ticketId) {
          console.log('Skipping ticket without ID');
          skippedCount++;
          continue;
        }
        
        if (processedTickets.has(ticketId)) {
          console.log(`Skipping already processed ticket: ${ticketId}`);
          skippedCount++;
          continue;
        }
        
        processedTickets.add(ticketId);
        processedCount++;
        
        // Check if ticket has required fields
        if (!ticket.description || !ticket.resolution) {
          console.log(`Skipping ticket ${ticketId} - missing description or resolution`);
          skippedCount++;
          continue;
        }
        
        // Generate AI entry
        try {
          const content = await generateLearningEntryWithAI(ticket);
          
          if (content) {
            // Get the ticket date
            let dateValue: string | Date = new Date();
            if (typeof ticket.created_at === 'string') dateValue = ticket.created_at;
            else if (typeof ticket.created === 'string') dateValue = ticket.created;
            else if (typeof ticket.opened_at === 'string') dateValue = ticket.opened_at;
            else if (typeof ticket.sys_created_on === 'string') dateValue = ticket.sys_created_on;
            
            const ticketDate = new Date(dateValue);
            const formattedDate = ticketDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            // Extract tags
            const tags = extractMeaningfulTags(ticket);
            
            // Create the entry
            aiEntries.push({
              id: `ai_${ticketId}`,
              date: formattedDate,
              originalDate: ticketDate,
              content,
              tags,
              ticketNumber: ticketId,
              source: 'ai'
            });
            
            console.log(`Successfully generated entry for ticket ${ticketId}`);
          } else {
            console.log(`Failed to generate content for ticket ${ticketId}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing ticket ${ticketId}:`, error);
          errorCount++;
        }
      }
      
      console.log(`Processing complete. Generated ${aiEntries.length} entries. Processed: ${processedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
      
      if (aiEntries.length > 0) {
        // Only add entries that don't already exist
        const existingIds = entries.map(entry => entry.id);
        const uniqueAiEntries = aiEntries.filter(entry => !existingIds.includes(entry.id));
        
        if (uniqueAiEntries.length > 0) {
          const updatedEntries = [...entries, ...uniqueAiEntries];
          setEntries(updatedEntries);
          localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
          
          toast({
            title: 'AI Processing Complete',
            description: `Generated ${uniqueAiEntries.length} new journal entries`,
            status: 'success'
          });
          console.log(`Added ${uniqueAiEntries.length} new entries to journal`);
        } else {
          toast({
            title: 'AI Processing Complete',
            description: 'All tickets have already been processed. No new entries were generated.',
            status: 'info'
          });
          console.log('No new entries added (all were duplicates)');
        }
      } else {
        toast({
          title: 'AI Processing Complete',
          description: 'No entries were generated. Please check that your tickets have both description and resolution fields.',
          status: 'warning'
        });
        console.log('No entries were generated');
      }
    } catch (error) {
      console.error('Error in AI processing:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Error details:', errorMessage);
      toast({
        title: 'AI Processing Error',
        description: `An error occurred: ${errorMessage}`,
        status: 'error'
      });
    } finally {
      setIsProcessingAI(false);
    }
  }, [tickets, entries, extractMeaningfulTags, generateLearningEntryWithAI, toast]);

  // Load entries from localStorage on component mount
  useEffect(() => {
    try {
      const storedEntries = localStorage.getItem('journal_entries');
      if (storedEntries) {
        const parsedEntries = JSON.parse(storedEntries);
        setEntries(parsedEntries);
      }
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  }, []);

  // Auto-process tickets with AI when tickets are loaded and no AI entries exist
  useEffect(() => {
    if (!tickets || tickets.length === 0) return;
    
    // Auto-process with AI on initial load if we have tickets and no AI entries yet
    const hasAiEntries = entries.some(entry => entry.source === 'ai');
    if (tickets.length > 0 && !hasAiEntries && !isProcessingAI) {
      processTicketsWithAI();
    }
  }, [tickets, entries, isProcessingAI, processTicketsWithAI]);

  // Process tickets with AI when the button is clicked
  const handleProcessTicketsWithAI = useCallback(() => {
    processTicketsWithAI();
  }, [processTicketsWithAI]);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#E0E0E0]">
      {/* Toast container */}
      <ToastContainer />
      <div className="bg-[#2B2B2B] shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-[#E0E0E0]">Learning Journal</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddingEntry(true)}
              className="flex items-center px-4 py-2 bg-[#E69500] hover:bg-[#FFA500] text-white rounded-md transition-colors"
            >
              <FaPlus className="mr-2" />
              <span>Add Entry</span>
            </button>
            <button
              onClick={handleProcessTicketsWithAI}
              className="flex items-center px-4 py-2 bg-[#E69500] hover:bg-[#FFA500] text-white rounded-md transition-colors"
            >
              <FaPlus className="mr-2" />
              <span>Generate AI Entries</span>
            </button>
          </div>
        </div>
      </div>

      {/* New entry form */}
      {isAddingEntry && (
        <div className="mb-6 p-4 bg-[#2B2B2B] rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4 text-[#E0E0E0]">Add New Entry</h2>
          <div className="mb-4">
            <label htmlFor="newEntry" className="block text-sm font-medium text-[#E0E0E0] mb-1">
              What did you learn today?
            </label>
            <textarea
              id="newEntry"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              rows={4}
              className="w-full border border-[#333333] rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFA500]"
              placeholder="Today I learned..."
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="newTags" className="block text-sm font-medium text-[#E0E0E0] mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="newTags"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full border border-[#333333] rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFA500]"
              placeholder="e.g., networking, security, windows"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingEntry(false)}
              className="px-4 py-2 border border-[#333333] rounded hover:bg-[#444444]"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!newEntry.trim()) return;
                
                const today = new Date();
                const formattedDate = today.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
                
                const newEntryObj: JournalEntry = {
                  id: `manual_${Date.now()}`,
                  date: formattedDate,
                  originalDate: today,
                  content: newEntry.trim(),
                  tags: newTags.split(',').map((tag: string) => tag.trim().toLowerCase()).filter(Boolean),
                  source: 'manual'
                };
                
                const updatedEntries = [newEntryObj, ...entries];
                setEntries(updatedEntries);
                localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
                
                setNewEntry('');
                setNewTags('');
                setIsAddingEntry(false);
              }}
              className="bg-[#E69500] hover:bg-[#FFA500] text-white px-4 py-2 rounded-md"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}
      
      {/* Journal Entries */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {/* AI Processing Status */}
        {isProcessingAI && (
          <div className="mb-6 p-4 bg-[#2B2B2B] rounded-lg border border-[#333333]">
            <div className="flex items-center">
              <div className="mr-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FFA500]"></div>
              </div>
              <div>
                <h3 className="font-medium text-[#E0E0E0]">Processing Tickets with AI</h3>
                <p className="text-sm text-[#E0E0E0]">
                  This may take a few moments depending on the number of tickets.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and Filter Controls */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#E69500]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search journal entries..."
              className="pl-10 w-full border border-[#333333] rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-[#FFA500]"
            />
          </div>
        </div>
        
        {/* Journal entries */}
        <div className="space-y-4">
          {entries
            .filter((entry) => {
              if (!searchTerm) return true;
              const searchLower = searchTerm.toLowerCase();
              return (
                entry.content.toLowerCase().includes(searchLower) ||
                entry.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))
              );
            })
            .sort((a: JournalEntry, b: JournalEntry) => {
              if (sortOrder === 'newest') {
                return new Date(b.originalDate).getTime() - new Date(a.originalDate).getTime();
              } else {
                return new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime();
              }
            })
            .map((entry) => (
              <div 
                key={entry.id} 
                className={`p-4 rounded-lg shadow ${
                  entry.source === 'ai' 
                    ? 'bg-[#2B2B2B] border-l-4 border-[#FFA500]' 
                    : 'bg-[#2B2B2B]'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className="text-[#E0E0E0] font-medium">{entry.date}</span>
                    {entry.source === 'ai' && (
                      <span className="ml-2 px-2 py-1 bg-[#333333] text-[#E0E0E0] rounded-full text-sm hover:bg-[#444444] cursor-pointer transition-colors">
                        AI Generated
                      </span>
                    )}
                    {entry.ticketNumber && (
                      <span className="ml-2 text-xs text-[#E0E0E0]">
                        Ticket #{entry.ticketNumber}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this entry?')) {
                        const updatedEntries = entries.filter(e => e.id !== entry.id);
                        setEntries(updatedEntries);
                        localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
                      }
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                <p className="text-[#E0E0E0] mb-3 whitespace-pre-wrap">{entry.content}</p>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className={`px-3 py-1 bg-[#333333] text-[#E0E0E0] rounded-full text-sm hover:bg-[#444444] cursor-pointer transition-colors`}
                      onClick={() => setSearchTerm(tag)}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          
          {entries.length === 0 && (
            <div className="text-center py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-[#E69500]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-[#E0E0E0]">No journal entries yet</h3>
              <p className="mt-1 text-[#E0E0E0]">
                {tickets.length > 0 
                  ? "Click 'Generate AI Entries' to create entries from your tickets" 
                  : "Import tickets or add entries manually to get started"}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsAddingEntry(true)}
                  className="inline-flex items-center px-4 py-2 bg-[#E69500] hover:bg-[#FFA500] text-white rounded-md transition-colors"
                >
                  <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                  Add Your First Entry
                </button>
              </div>
            </div>
          )}
          
          {entries.length > 0 && entries.filter(entry => {
            if (!searchTerm) return true;
            const searchLower = searchTerm.toLowerCase();
            return (
              entry.content.toLowerCase().includes(searchLower) ||
              entry.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
          }).length === 0 && (
            <div className="text-center py-8">
              <p className="text-[#E0E0E0]">No entries match your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
