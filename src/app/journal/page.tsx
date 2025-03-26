'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaRobot, FaSearch, FaCalendarAlt, FaTag, FaKey } from 'react-icons/fa';
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
    duration = 3000, 
    isClosable = true 
  }: { 
    title: string; 
    description: string; 
    status: 'success' | 'error' | 'info' | 'warning'; 
    duration?: number; 
    isClosable?: boolean;
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

// Function to generate a learning entry from a ticket description or resolution
function generateLearningEntryLegacy(text: string, ticket: Ticket): string | null {
  // Remove generic phrases
  const genericPhrases = [
    'please fill out', 'template', 'n/a', 'not applicable',
    'see above', 'no description provided', 'no details', 'none',
    'please describe', 'please provide', 'pending', 'to be determined',
    'to be filled', 'will be updated', 'see attachment', 'see attached'
  ];

  let cleanedText = text;
  genericPhrases.forEach(phrase => {
    cleanedText = cleanedText.replace(new RegExp(phrase, 'gi'), '');
  });

  // If text is too short or generic, return null
  if (cleanedText.length < 40 || genericPhrases.some(phrase => cleanedText.toLowerCase().includes(phrase))) {
    return null;
  }

  // Try to extract meaningful information
  const meaningfulInfo = cleanedText.replace(/\\n/g, ' ').replace(/\\r/g, ' ').replace(/\s+/g, ' ').trim();

  // If still too short, return null
  if (meaningfulInfo.length < 40) {
    return null;
  }

  // Legacy approach: Use the first sentence as the learning entry
  const sentences = meaningfulInfo.split('. ');
  const firstSentence = sentences[0];

  // Capitalize the first letter
  const capitalizedSentence = firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);

  return `Today I learned ${capitalizedSentence}.`;
}

export default function JournalPage() {
  const router = useRouter();
  const { tickets } = useTickets();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntry, setNewEntry] = useState('');
  const [newTags, setNewTags] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
  // Custom toast hook
  const { toast, ToastContainer } = useToast();

  // Function to generate learning entry with AI
  async function generateLearningEntryWithAI(ticket: Ticket): Promise<JournalEntry | null> {
    if (!apiKey) return null;
    
    try {
      // Prepare the ticket data for the API call
      const ticketData = {
        number: ticket.number,
        short_description: ticket.short_description || '',
        description: ticket.description || '',
        resolution: ticket.resolution || '',
        opened_at: ticket.opened_at,
        closed_at: ticket.closed_at
      };
      
      // Create the prompt for the OpenAI API
      const prompt = `
You are an IT professional analyzing a support ticket to create a specific, technical learning journal entry.

TICKET INFORMATION:
Number: ${ticketData.number}
Short Description: ${ticketData.short_description}
Description: ${ticketData.description}
Resolution: ${ticketData.resolution}
Opened: ${ticketData.opened_at}
Closed: ${ticketData.closed_at}

TASK:
1. Extract the SPECIFIC technical issue from this ticket. Avoid generic descriptions like "experiencing technical difficulties" or "having problems with". Instead, identify the exact component that failed (e.g., "corrupted registry keys in Windows", "failed network switch port", "misconfigured DNS settings").

2. Extract the SPECIFIC technical resolution that was applied. Avoid generic phrases like "issue was fixed" or "problem was resolved". Instead, detail the exact steps taken (e.g., "replaced the faulty RAM module", "reconfigured the DNS settings to use Google's public DNS").

3. Generate a concise learning journal entry in first person that explains what you learned from this ticket. Format: "I learned how to [specific technical resolution] when [specific technical issue occurs]."

4. Identify 3-5 relevant technical tags that accurately reflect the content (hardware components, software applications, technologies, or issue types mentioned in the ticket).

RESPONSE FORMAT:
{
  "entry": "Your learning journal entry here",
  "tags": ["tag1", "tag2", "tag3"]
}
`;

      // Make the API call to OpenAI
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that helps IT professionals create specific, technical learning journal entries from support tickets.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${response.status}`);
      }
      
      const data = await response.json();
      const aiResponse = data.choices[0].message.content;
      
      // Parse the JSON response
      let parsedResponse;
      try {
        // Extract JSON from the response (in case the AI includes extra text)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedResponse = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not extract JSON from AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        console.log('Raw AI response:', aiResponse);
        
        // Fallback: Try to extract the entry and tags manually
        const entryMatch = aiResponse.match(/entry["']?\s*:\s*["']([^"']+)["']/);
        const tagsMatch = aiResponse.match(/tags["']?\s*:\s*\[(.*?)\]/);
        
        if (entryMatch) {
          const entry = entryMatch[1];
          let tags: string[] = [];
          
          if (tagsMatch) {
            tags = tagsMatch[1]
              .split(',')
              .map((tag: string) => tag.trim().replace(/["']/g, ''));
          } else {
            // If no tags found, generate them from the entry content
            tags = extractKeywordsAsTags(entry);
          }
          
          parsedResponse = { entry, tags };
        } else {
          // If we can't extract the entry, use the legacy approach
          return null;
        }
      }
      
      // Create the journal entry
      const today = new Date();
      const formattedDate = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      return {
        id: `ai_${ticket.number}_${Date.now()}`,
        date: formattedDate,
        originalDate: today,
        content: parsedResponse.entry,
        tags: parsedResponse.tags,
        source: 'ai',
        ticketNumber: ticket.number
      };
    } catch (error) {
      console.error('Error generating AI entry:', error);
      return null;
    }
  }
  
  // Function to process tickets with AI
  const processTicketsWithAI = async () => {
    if (!apiKey || isProcessingAI) return;
    
    setIsProcessingAI(true);
    
    try {
      const aiEntries: JournalEntry[] = [];
      
      // Process tickets in batches to avoid overwhelming the API
      const ticketBatches = [];
      for (let i = 0; i < tickets.length; i += 5) {
        ticketBatches.push(tickets.slice(i, i + 5));
      }
      
      for (const batch of ticketBatches) {
        const batchPromises = batch.map(async (ticket) => {
          const aiEntry = await generateLearningEntryWithAI(ticket);
          if (aiEntry) {
            return aiEntry;
          }
          return null;
        });
        
        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(entry => {
          if (entry) {
            aiEntries.push(entry);
          }
        });
        
        // Small delay between batches to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (aiEntries.length > 0) {
        // Combine with existing entries, avoiding duplicates
        const existingTicketNumbers = entries
          .filter(entry => entry.source === 'ai' && entry.ticketNumber)
          .map(entry => entry.ticketNumber);
        
        const newAiEntries = aiEntries.filter(entry => 
          !existingTicketNumbers.includes(entry.ticketNumber)
        );
        
        if (newAiEntries.length > 0) {
          const updatedEntries = [...newAiEntries, ...entries];
          setEntries(updatedEntries);
          localStorage.setItem('journal_entries', JSON.stringify(updatedEntries));
          
          toast({
            title: 'AI Processing Complete',
            description: `Added ${newAiEntries.length} new journal entries from tickets.`,
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'AI Processing Complete',
            description: 'No new journal entries were found.',
            status: 'info',
            duration: 5000,
            isClosable: true,
          });
        }
      } else {
        toast({
          title: 'AI Processing Complete',
          description: 'No journal entries could be generated from the tickets.',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error processing tickets with AI:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while processing tickets with AI.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessingAI(false);
      setShowApiKeyInput(false);
    }
  };

  // Function to extract meaningful tags from a ticket
  function extractMeaningfulTags(ticket: Ticket): string[] {
    const tags: string[] = [];

    // Get text to analyze for tags
    const textToSearch = [
      ticket.short_description || '', 
      ticket.description || '', 
      ticket.resolution || ''
    ].filter(Boolean).join(' ').toLowerCase();

    // First identify the affected system from the ticket text
    // Software systems
    if (textToSearch.includes('outlook')) tags.push('outlook');
    if (textToSearch.includes('teams')) tags.push('teams');
    if (textToSearch.includes('zoom')) tags.push('zoom');
    if (textToSearch.includes('word')) tags.push('word');
    if (textToSearch.includes('excel')) tags.push('excel');
    if (textToSearch.includes('powerpoint')) tags.push('powerpoint');
    if (textToSearch.includes('office') && !tags.some(t => ['word', 'excel', 'powerpoint', 'outlook'].includes(t))) {
      tags.push('office');
    }
    if (textToSearch.includes('chrome')) tags.push('chrome');
    if (textToSearch.includes('firefox')) tags.push('firefox');
    if (textToSearch.includes('edge')) tags.push('edge');
    if (textToSearch.includes('adobe') || textToSearch.includes('acrobat')) tags.push('adobe');
    if (textToSearch.includes('vpn')) tags.push('vpn');
    if (textToSearch.includes('sharepoint')) tags.push('sharepoint');
    if (textToSearch.includes('onedrive')) tags.push('onedrive');

    // Operating systems
    if (textToSearch.includes('windows')) tags.push('windows');
    if (textToSearch.includes('mac') || textToSearch.includes('macos')) tags.push('macos');
    if (textToSearch.includes('linux') || textToSearch.includes('ubuntu')) tags.push('linux');

    // Hardware manufacturers
    if (textToSearch.includes('dell')) tags.push('dell');
    if (textToSearch.includes('hp')) tags.push('hp');
    if (textToSearch.includes('lenovo')) tags.push('lenovo');
    if (textToSearch.includes('apple') || textToSearch.includes('macbook')) tags.push('apple');
    if (textToSearch.includes('logitech')) tags.push('logitech');
    if (textToSearch.includes('cisco')) tags.push('cisco');

    // Hardware components
    if (textToSearch.includes('laptop')) tags.push('laptop');
    if (textToSearch.includes('desktop')) tags.push('desktop');
    if (textToSearch.includes('monitor')) tags.push('monitor');
    if (textToSearch.includes('printer')) tags.push('printer');
    if (textToSearch.includes('keyboard')) tags.push('keyboard');
    if (textToSearch.includes('mouse')) tags.push('mouse');
    if (textToSearch.includes('headset') || textToSearch.includes('headphone')) tags.push('audio-device');
    if (textToSearch.includes('camera') || textToSearch.includes('webcam')) tags.push('camera');
    if (textToSearch.includes('microphone')) tags.push('microphone');
    if (textToSearch.includes('speaker')) tags.push('speaker');
    if (textToSearch.includes('hard drive') || textToSearch.includes('hdd') || textToSearch.includes('ssd')) tags.push('storage');
    if (textToSearch.includes('ram') || textToSearch.includes('memory')) tags.push('memory');
    if (textToSearch.includes('motherboard')) tags.push('motherboard');
    if (textToSearch.includes('power supply') || textToSearch.includes('psu')) tags.push('power-supply');
    if (textToSearch.includes('cpu') || textToSearch.includes('processor')) tags.push('cpu');
    if (textToSearch.includes('graphics') || textToSearch.includes('gpu')) tags.push('gpu');
    if (textToSearch.includes('battery')) tags.push('battery');
    if (textToSearch.includes('fan') || textToSearch.includes('cooling')) tags.push('cooling');

    // Network components
    if (textToSearch.includes('wifi') || textToSearch.includes('wireless')) tags.push('wifi');
    if (textToSearch.includes('ethernet') || textToSearch.includes('lan')) tags.push('ethernet');
    if (textToSearch.includes('router')) tags.push('router');
    if (textToSearch.includes('switch')) tags.push('network-switch');
    if (textToSearch.includes('firewall')) tags.push('firewall');
    if (textToSearch.includes('vpn')) tags.push('vpn');

    // Issue types
    if (textToSearch.includes('crash') || textToSearch.includes('crashed')) tags.push('crash');
    if (textToSearch.includes('freeze') || textToSearch.includes('frozen')) tags.push('freeze');
    if (textToSearch.includes('blue screen') || textToSearch.includes('bsod')) tags.push('bsod');
    if (textToSearch.includes('slow') || textToSearch.includes('performance')) tags.push('performance');
    if (textToSearch.includes('virus') || textToSearch.includes('malware')) tags.push('malware');
    if (textToSearch.includes('data loss') || textToSearch.includes('lost file')) tags.push('data-loss');
    if (textToSearch.includes('backup') || textToSearch.includes('restore')) tags.push('backup');
    if (textToSearch.includes('update') || textToSearch.includes('upgrade')) tags.push('update');
    if (textToSearch.includes('install') || textToSearch.includes('setup')) tags.push('installation');
    if (textToSearch.includes('login') || textToSearch.includes('password')) tags.push('authentication');
    if (textToSearch.includes('permission') || textToSearch.includes('access denied')) tags.push('permissions');
    if (textToSearch.includes('print') || textToSearch.includes('printer')) tags.push('printing');
    if (textToSearch.includes('email') || textToSearch.includes('outlook')) tags.push('email');

    // Limit to 5 tags and ensure uniqueness
    return [...new Set(tags)].slice(0, 5);
  }

  // Function to extract keywords as tags when AI doesn't provide them explicitly
  function extractKeywordsAsTags(content: string): string[] {
    const lowercaseContent = content.toLowerCase();
    const potentialTags: string[] = [];
    
    // Hardware components
    const hardwareComponents: string[] = [
      'hard drive', 'ssd', 'hdd', 'ram', 'memory', 'cpu', 'processor', 
      'motherboard', 'graphics card', 'gpu', 'monitor', 'display',
      'keyboard', 'mouse', 'printer', 'scanner', 'network card', 'wifi'
    ];
    
    // Software applications
    const softwareApplications: string[] = [
      'windows', 'office', 'excel', 'word', 'outlook', 'powerpoint',
      'adobe', 'chrome', 'firefox', 'browser', 'antivirus', 'vpn',
      'database', 'sql', 'sharepoint', 'teams', 'zoom', 'skype'
    ];
    
    // Issue types
    const issueTypes: string[] = [
      'crash', 'freeze', 'error', 'blue screen', 'bsod', 'slow', 'performance',
      'connectivity', 'network', 'login', 'password', 'update', 'driver',
      'virus', 'malware', 'data loss', 'backup', 'recovery'
    ];
    
    // Check for hardware components
    hardwareComponents.forEach((component: string) => {
      if (lowercaseContent.includes(component)) {
        potentialTags.push(component.replace(/\s+/g, '_'));
      }
    });
    
    // Check for software applications
    softwareApplications.forEach((app: string) => {
      if (lowercaseContent.includes(app)) {
        potentialTags.push(app.replace(/\s+/g, '_'));
      }
    });
    
    // Check for issue types
    issueTypes.forEach((issue: string) => {
      if (lowercaseContent.includes(issue)) {
        potentialTags.push(issue.replace(/\s+/g, '_'));
      }
    });
    
    // Limit to 5 tags and ensure uniqueness
    return [...new Set(potentialTags)].slice(0, 5);
  }

  // Function to check if text is generic/template text
  function isGenericText(text: string): boolean {
    const genericPhrases = [
      'please fill out', 'template', 'n/a', 'not applicable',
      'see above', 'no description provided', 'no details', 'none',
      'please describe', 'please provide', 'pending', 'to be determined',
      'to be filled', 'will be updated', 'see attachment', 'see attached'
    ];

    const lowercaseText = text.toLowerCase();
    return genericPhrases.some(phrase => lowercaseText.includes(phrase)) ||
           text.length < 40 || // Too short
           (text.split(' ').length < 8); // Too few words
  }

  // Function to check if a tag exists in a list
  const tagExists = (tag: string, tagList: string[]): boolean => {
    return tagList.includes(tag.toLowerCase());
  };

  // Function to filter out generic tags
  const filterGenericTags = (tags: string[]): string[] => {
    const genericTags = ['issue', 'problem', 'error', 'technical'];
    return tags.filter(tag => !genericTags.includes(tag.toLowerCase()));
  };

  // Load entries from localStorage on component mount
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    try {
      // Initialize with default entries if none exist
      const defaultEntries: JournalEntry[] = [
        {
          id: '1',
          date: 'March 26, 2025',
          originalDate: new Date('2025-03-26'),
          content: "Today I learned about ports and protocols. These are essentials for ensuring data sent between devices is in a consistent format that allows any devices to communicate quickly and without error.",
          tags: ['networking', 'protocols'],
          source: 'manual'
        }
      ];

      // Check for saved API key
      const savedApiKey = localStorage.getItem('openai_api_key');
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }

      // Process tickets to extract meaningful learning entries
      if (tickets.length > 0) {
        const processedTickets = new Set<string>();
        const journalEntries: JournalEntry[] = [...defaultEntries];

        tickets.forEach((ticket: Ticket) => {
          // Skip if we've already processed this ticket
          const ticketId = typeof ticket.number === 'string' ? ticket.number : 
                          typeof ticket.sys_id === 'string' ? ticket.sys_id : '';
          if (processedTickets.has(ticketId) || !ticketId) return;
          processedTickets.add(ticketId);

          // Get the ticket date (try multiple possible date fields)
          let dateValue: string | Date = new Date();
          if (typeof ticket.created_at === 'string') dateValue = ticket.created_at;
          else if (typeof ticket.created === 'string') dateValue = ticket.created;
          else if (typeof ticket.opened_at === 'string') dateValue = ticket.opened_at;
          else if (typeof ticket.sys_created_on === 'string') dateValue = ticket.sys_created_on;

          const ticketDate = new Date(dateValue);

          // Format the date for display
          const formattedDate = ticketDate.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });

          // Process description if it exists and is meaningful
          if (ticket.description && typeof ticket.description === 'string' && ticket.description.length > 30) {
            // Clean up the description
            const cleanDescription = ticket.description
              .replace(/\\n/g, ' ')
              .replace(/\\r/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            // Create a learning entry from the description
            const content = generateLearningEntryLegacy(cleanDescription, ticket);

            if (content) {
              journalEntries.push({
                id: `desc_${ticketId}`,
                date: formattedDate,
                originalDate: ticketDate,
                content,
                tags: extractMeaningfulTags(ticket),
                ticketNumber: ticketId,
                source: 'description'
              });
            }
          }

          // Process resolution if it exists and is meaningful
          if (ticket.resolution && typeof ticket.resolution === 'string' && ticket.resolution.length > 30) {
            // Clean up the resolution
            const cleanResolution = ticket.resolution
              .replace(/\\n/g, ' ')
              .replace(/\\r/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();

            // Create a learning entry from the resolution
            const content = generateLearningEntryLegacy(cleanResolution, ticket);

            if (content) {
              // Use resolution date if available
              let resolutionValue: string | Date = ticketDate;
              if (typeof ticket.resolved_at === 'string') resolutionValue = ticket.resolved_at;
              else if (typeof ticket.closed_at === 'string') resolutionValue = ticket.closed_at;

              const resolutionDate = new Date(resolutionValue);

              // Format the resolution date
              const formattedResolutionDate = resolutionDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });

              journalEntries.push({
                id: `res_${ticketId}`,
                date: formattedResolutionDate,
                originalDate: resolutionDate,
                content,
                tags: extractMeaningfulTags(ticket),
                ticketNumber: ticketId,
                source: 'resolution'
              });
            }
          }
        });

        // Sort entries by date (newest first by default)
        journalEntries.sort((a: JournalEntry, b: JournalEntry) => b.originalDate.getTime() - a.originalDate.getTime());

        setEntries(journalEntries);

        // Save to localStorage
        localStorage.setItem('journal_entries', JSON.stringify(journalEntries));
      } else {
        // Load from localStorage if no tickets
        const savedEntries = localStorage.getItem('journal_entries');
        if (savedEntries) {
          try {
            const parsedEntries = JSON.parse(savedEntries);
            // Convert string dates back to Date objects
            parsedEntries.forEach((entry: any) => {
              entry.originalDate = new Date(entry.originalDate);
            });
            setEntries(parsedEntries);
          } catch (error) {
            console.error('Error parsing saved entries:', error);
            setEntries(defaultEntries);
          }
        } else {
          setEntries(defaultEntries);
        }
      }
    } catch (error) {
      console.error('Error in journal entries processing:', error);
    }
  }, [tickets]);

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
              onClick={() => setShowApiKeyInput(true)}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              <FaKey className="mr-2" />
              <span>Set API Key</span>
            </button>
            <button
              onClick={processTicketsWithAI}
              disabled={isProcessingAI || !apiKey}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                isProcessingAI || !apiKey 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <FaRobot className="mr-2" />
              <span>{isProcessingAI ? 'Processing...' : 'Generate AI Entries'}</span>
            </button>
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

      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Enter OpenAI API Key</h2>
            <p className="text-gray-600 mb-4">
              Your API key is required to generate AI-powered journal entries. 
              The key will be stored locally in your browser and is never sent to our servers.
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full p-2 border border-gray-300 rounded mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowApiKeyInput(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (apiKey) {
                    localStorage.setItem('openai_api_key', apiKey);
                    setShowApiKeyInput(false);
                    toast({
                      title: 'API Key Saved',
                      description: 'Your OpenAI API key has been saved.',
                      status: 'success',
                      duration: 3000,
                      isClosable: true,
                    });
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      
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
