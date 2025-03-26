'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaRobot, FaSearch } from 'react-icons/fa';
import { useTickets } from '@/context/TicketContext';
import type { Ticket } from '@/context/TicketContext';

// Create a custom toast component since we're not using Chakra UI
const Toast = ({ title, description, status, onClose }: { 
  title: string; 
  description: string; 
  status: 'success' | 'error' | 'info' | 'warning'; 
  onClose: () => void;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = status === 'success' ? 'bg-green-500' : 
                  status === 'error' ? 'bg-red-500' : 
                  status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500';
  
  return (
    <div className={`fixed top-4 right-4 p-4 rounded-md shadow-lg ${bgColor} text-white z-50 max-w-md`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{title}</h3>
          <p>{description}</p>
        </div>
        <button onClick={onClose} className="ml-4 text-white">×</button>
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
  }>>([]);
  
  const toast = ({ 
    title, 
    description, 
    status, 
    duration = 3000 
  }: { 
    title: string; 
    description: string; 
    status: 'success' | 'error' | 'info' | 'warning'; 
    duration?: number; 
  }) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, title, description, status }]);
    
    if (duration) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  };
  
  const closeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  return {
    toast,
    ToastContainer: () => (
      <div className="fixed top-4 right-4 z-50 space-y-4">
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
    )
  };
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

  // Function to extract meaningful tags from a ticket
  const extractMeaningfulTags = useCallback((ticket: Ticket): string[] => {
    // Extract text from ticket
    let text = '';
    if (ticket.description && typeof ticket.description === 'string') {
      text += ' ' + ticket.description;
    }
    if (ticket.resolution && typeof ticket.resolution === 'string') {
      text += ' ' + ticket.resolution;
    }
    
    text = text.toLowerCase();
    
    // Extract tags using the same logic as extractKeywordsAsTags
    return extractKeywordsAsTags(text);
  }, [extractKeywordsAsTags]);

  // Legacy function to generate learning entries from ticket text
  function generateLearningEntryLegacy(text: string): string | null {
    // Check if the text is too short to be meaningful
    if (text.length < 30) {
      return null;
    }
    
    // Normalize text for pattern matching
    const normalizedText = text.toLowerCase();
    
    // Common patterns for hardware issues
    const hardwarePatterns = [
      /(\w+) (not|isn'?t) (working|functioning|responding|powering on)/i,
      /(\w+) (failed|broken|damaged|faulty)/i,
      /(\w+) (error|issue|problem)/i,
      /replace (\w+)/i,
      /(\w+) needs (replacement|repair)/i
    ];
    
    // Common patterns for software issues
    const softwarePatterns = [
      /(application|program|software) (crash|error|not responding)/i,
      /(can'?t|cannot|unable to) (access|login|connect to) (\w+)/i,
      /(\w+) (not|isn'?t) (loading|opening|starting)/i,
      /error message/i,
      /blue screen/i
    ];
    
    // Check for hardware issues
    for (const pattern of hardwarePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const component = match[1];
        return `Today I learned about diagnosing and resolving issues with ${component} hardware. I identified specific symptoms, troubleshooting steps, and repair procedures that will help me resolve similar issues more efficiently in the future.`;
      }
    }
    
    // Check for software issues
    for (const pattern of softwarePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const software = match[3] || 'software';
        return `Today I learned about troubleshooting ${software} issues. I discovered specific error patterns, diagnostic approaches, and resolution techniques that will improve my ability to quickly resolve similar problems.`;
      }
    }
    
    // Generic fallback for when no specific pattern is matched
    return `Today I learned about resolving technical issues through systematic troubleshooting. I applied a structured approach to identify the root cause and implement an effective solution.`;
  }

  // Function to generate a learning entry with AI
  async function generateLearningEntryWithAI(ticket: Ticket): Promise<string | null> {
    try {
      const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
      
      if (!apiKey) {
        console.error('OpenAI API key not found in environment variables');
        return null;
      }

      // Extract text from ticket
      let ticketText = '';
      if (ticket.description && typeof ticket.description === 'string') {
        ticketText += 'Description: ' + ticket.description + '\n\n';
      }
      if (ticket.resolution && typeof ticket.resolution === 'string') {
        ticketText += 'Resolution: ' + ticket.resolution;
      }

      // Clean up the text
      const cleanText = ticketText
        .replace(/\\n/g, ' ')
        .replace(/\\r/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanText.length < 30) {
        return null; // Not enough meaningful content
      }

      // Prepare the prompt
      const prompt = `
        You are an IT professional creating a learning journal entry based on the following ticket information.
        Extract the specific technical issue, components involved, and resolution steps.
        Focus on being precise about what exactly failed or malfunctioned.
        Avoid generic descriptions like "experiencing technical difficulties" and instead identify the exact component or system that failed.
        Format your response as a concise learning journal entry starting with "Today I learned about..."
        
        Ticket Information:
        ${cleanText}
      `;

      // Make the API call
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are a helpful assistant that creates specific technical learning journal entries from IT support tickets.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No content returned from API');
      }

      return content;
    } catch (error) {
      console.error('Error generating AI entry:', error);
      toast({
        title: 'AI Processing Error',
        description: `Failed to generate entry: ${error instanceof Error ? error.message : String(error)}`,
        status: 'error'
      });
      return null;
    }
  }

  // Function to process tickets with AI
  async function processTicketsWithAI() {
    if (tickets.length === 0) return;
    
    setIsProcessingAI(true);
    toast({
      title: 'AI Processing',
      description: 'Generating AI-powered journal entries...',
      status: 'info'
    });
    
    try {
      const processedTickets = new Set<string>();
      const aiEntries: JournalEntry[] = [];
      
      // Process tickets sequentially to avoid rate limiting
      for (const ticket of tickets) {
        // Skip if we've already processed this ticket
        const ticketId = typeof ticket.number === 'string' ? ticket.number : 
                        typeof ticket.sys_id === 'string' ? ticket.sys_id : '';
        
        if (processedTickets.has(ticketId) || !ticketId) continue;
        processedTickets.add(ticketId);
        
        // Generate AI entry
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
        }
      }
      
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
        } else {
          toast({
            title: 'AI Processing Complete',
            description: 'No new entries were generated',
            status: 'info'
          });
        }
      } else {
        toast({
          title: 'AI Processing Complete',
          description: 'No entries were generated',
          status: 'info'
        });
      }
    } catch (error) {
      console.error('Error in AI processing:', error);
      toast({
        title: 'AI Processing Error',
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        status: 'error'
      });
    } finally {
      setIsProcessingAI(false);
    }
  }

  // Load entries from localStorage on component mount
  useEffect(() => {
    try {
      // Get entries from localStorage
      const savedEntries = localStorage.getItem('journal_entries');
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
        
        // Convert string dates to Date objects
        const entriesWithDates = parsedEntries.map((entry: JournalEntry) => ({
          ...entry,
          originalDate: new Date(entry.originalDate)
        }));
        
        setEntries(entriesWithDates);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }, []);

  // Process tickets when they are loaded - first with legacy approach, then with AI
  useEffect(() => {
    if (tickets.length === 0) return;
    
    try {
      const newEntries: JournalEntry[] = [];
      const processedTickets = new Set<string>();
      
      tickets.forEach(ticket => {
        // Skip if we've already processed this ticket
        const ticketId = typeof ticket.number === 'string' ? ticket.number : 
                        typeof ticket.sys_id === 'string' ? ticket.sys_id : '';
        if (processedTickets.has(ticketId) || !ticketId) return;
        processedTickets.add(ticketId);
        
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
        
        // Generate a learning entry from the ticket description
        if (ticket.description && typeof ticket.description === 'string') {
          const cleanDescription = ticket.description
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Legacy approach - will be replaced by AI in the future
          const content = generateLearningEntryLegacy(cleanDescription);
          
          if (content) {
            const tags = extractMeaningfulTags(ticket);
            
            newEntries.push({
              id: `desc_${ticketId}`,
              date: formattedDate,
              originalDate: ticketDate,
              content: content,
              tags,
              ticketNumber: ticketId,
              source: 'description'
            });
          }
        }
        
        // Generate a learning entry from the ticket resolution
        if (ticket.resolution && typeof ticket.resolution === 'string') {
          const cleanResolution = ticket.resolution
            .replace(/\\n/g, ' ')
            .replace(/\\r/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          
          // Legacy approach - will be replaced by AI in the future
          const content = generateLearningEntryLegacy(cleanResolution);
          
          if (content) {
            const tags = extractMeaningfulTags(ticket);
            
            // Use resolution date if available
            let resolutionValue: string | Date = ticketDate;
            if (typeof ticket.resolved_at === 'string') resolutionValue = ticket.resolved_at;
            else if (typeof ticket.closed_at === 'string') resolutionValue = ticket.closed_at;
            
            const resolutionDate = new Date(resolutionValue);
            const formattedResolutionDate = resolutionDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
            
            newEntries.push({
              id: `res_${ticketId}`,
              date: formattedResolutionDate,
              originalDate: resolutionDate,
              content: content,
              tags,
              ticketNumber: ticketId,
              source: 'resolution'
            });
          }
        }
      });
      
      if (newEntries.length > 0) {
        // Only add entries that don't already exist
        const existingIds = entries.map(entry => entry.id);
        const uniqueNewEntries = newEntries.filter(entry => !existingIds.includes(entry.id));
        
        if (uniqueNewEntries.length > 0) {
          const updatedEntries = [...entries, ...uniqueNewEntries];
          setEntries(updatedEntries);
          localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
        }
      }
      
      // After generating legacy entries, process with AI
      processTicketsWithAI();
    } catch (error) {
      console.error('Error in journal entries processing:', error);
    }
  }, [tickets, entries, extractMeaningfulTags]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Toast container */}
      <ToastContainer />
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/')}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-900">Learning Journal</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsAddingEntry(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <FaPlus className="mr-2" />
              <span>Add Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* New entry form */}
      {isAddingEntry && (
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Add New Entry</h2>
          <div className="mb-4">
            <label htmlFor="newEntry" className="block text-sm font-medium text-slate-700 mb-1">
              What did you learn today?
            </label>
            <textarea
              id="newEntry"
              value={newEntry}
              onChange={(e) => setNewEntry(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Today I learned..."
            ></textarea>
          </div>
          <div className="mb-4">
            <label htmlFor="newTags" className="block text-sm font-medium text-slate-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              id="newTags"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              className="w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., networking, security, windows"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setIsAddingEntry(false)}
              className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
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
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center">
              <div className="mr-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
              <div>
                <h3 className="font-medium text-indigo-800">Processing Tickets with AI</h3>
                <p className="text-sm text-indigo-600">
                  This may take a few moments depending on the number of tickets.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and Filter Controls */}
        <div className="mb-6 flex items-center gap-4">
          <div className="relative flex-grow">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search journal entries..."
              className="pl-10 w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    ? 'bg-gradient-to-r from-indigo-50 to-white border-l-4 border-indigo-500' 
                    : 'bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center">
                    <span className="text-slate-600 font-medium">{entry.date}</span>
                    {entry.source === 'ai' && (
                      <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                        AI Generated
                      </span>
                    )}
                    {entry.ticketNumber && (
                      <span className="ml-2 text-xs text-slate-500">
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
                <p className="text-slate-800 mb-3 whitespace-pre-wrap">{entry.content}</p>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        entry.source === 'ai'
                          ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      } cursor-pointer`}
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
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No journal entries yet</h3>
              <p className="mt-1 text-slate-500">
                {tickets.length > 0 
                  ? "Click 'Generate AI Entries' to create entries from your tickets" 
                  : "Import tickets or add entries manually to get started"}
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsAddingEntry(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
              <p className="text-slate-500">No entries match your search criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
