'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTickets } from '@/context/TicketContext';
import type { Ticket } from '@/context/TicketContext';
// Simple function to generate a unique ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15) + 
         Date.now().toString(36);
}
import { FaPlus, FaSearch, FaArrowLeft } from 'react-icons/fa';

// Import the notification context hook
import { useNotification } from '@/context/NotificationContext';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  tags: string[];
  title: string;
  ticketId: string | null;
  ticketNumber?: string;
  source: 'description' | 'resolution' | 'manual' | 'ai';
  originalDate?: Date;
}

export default function JournalPage() {
  const { tickets } = useTickets();
  const { addNotification } = useNotification();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  // Removed unused state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [newEntryTitle] = useState('');
  const [newEntryTags, setNewEntryTags] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  
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

  // Function to extract relevant information from a ticket in a structured format
  const extractTicketInfo = useCallback((ticket: Ticket): { 
    description: string, 
    resolution: string, 
    shortDescription: string,
    category: string,
    subcategory: string,
    priority: string
  } => {
    // Extract core information
    const description = typeof ticket.description === 'string' ? ticket.description : '';
    const resolution = typeof ticket.resolution === 'string' ? ticket.resolution : '';
    
    // Extract additional context if available
    const shortDescription = typeof ticket.short_description === 'string' ? ticket.short_description : 
                             typeof ticket.title === 'string' ? ticket.title : '';
    const category = typeof ticket.category === 'string' ? ticket.category : '';
    const subcategory = typeof ticket.subcategory === 'string' ? ticket.subcategory : '';
    const priority = ticket.priority ? String(ticket.priority) : '';
    
    return {
      description,
      resolution,
      shortDescription,
      category,
      subcategory,
      priority
    };
  }, []);

  // Note: chunkText function was removed as it's not being used

  // Function to process tickets in batches
  const processTicketsInBatches = useCallback(async (ticketsToProcess: Ticket[], batchSize: number = 20): Promise<JournalEntry[]> => {
    const aiEntries: JournalEntry[] = [];
    const batches: Ticket[][] = [];
    
    // Split tickets into batches of the specified size
    for (let i = 0; i < ticketsToProcess.length; i += batchSize) {
      batches.push(ticketsToProcess.slice(i, i + batchSize));
    }
    
    console.log(`Split ${ticketsToProcess.length} tickets into ${batches.length} batches of approximately ${batchSize} tickets each`);
    
    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} tickets...`);
      
      // Add a delay between batches to prevent rate limiting
      if (batchIndex > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Create a batch prompt for the API
      const batchPrompt = `
      You are an IT professional documenting what you learned from resolving technical support tickets.
      
      I will provide you with a batch of ${batch.length} IT support tickets. For each ticket, generate a learning journal entry.
      
      Each entry MUST:
      1. Start with "Today I learned about [specific component]" where [specific component] is the exact hardware/software component that failed
      2. Explain why the specific component failed or caused issues
      3. Detail what was done to resolve the issue
      4. Be written in first person as if you personally solved this issue
      5. Be 3-5 sentences long
      
      Format your response as a JSON array where each object has:
      - ticketId: The ID of the ticket
      - content: The learning journal entry
      
      Here are the tickets:
      `;
      
      // Add each ticket to the batch prompt
      const ticketPrompts = batch.map((ticket, index) => {
        const ticketId = typeof ticket.number === 'string' ? ticket.number : 
                        typeof ticket.sys_id === 'string' ? ticket.sys_id : `unknown-${index}`;
        
        const ticketInfo = extractTicketInfo(ticket);
        
        return `
        TICKET ${index + 1} (ID: ${ticketId}):
        ${ticketInfo.shortDescription ? `Short Description: ${ticketInfo.shortDescription}\n` : ''}
        ${ticketInfo.category ? `Category: ${ticketInfo.category}\n` : ''}
        ${ticketInfo.subcategory ? `Subcategory: ${ticketInfo.subcategory}\n` : ''}
        ${ticketInfo.priority ? `Priority: ${String(ticketInfo.priority)}\n` : ''}
        
        DESCRIPTION:
        ${ticketInfo.description || 'No description provided'}
        
        RESOLUTION:
        ${ticketInfo.resolution || 'No resolution provided'}
        `;
      }).join('\n\n---\n\n');
      
      // Combine the batch prompt with the ticket data
      const fullPrompt = `${batchPrompt}\n\n${ticketPrompts}\n\nRemember to format your response as a JSON array with ticketId and content for each ticket.`;
      
      try {
        console.log(`Making API request for batch ${batchIndex + 1} with ${batch.length} tickets...`);
        
        // Make API call to our secure API route that handles the OpenAI API key
        const response = await fetch('/api/journal', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: 'You are an IT professional documenting specific technical learnings from support tickets.'
              },
              {
                role: 'user',
                content: fullPrompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1500 // Increased token limit for batch processing
          })
        });
        
        if (!response.ok) {
          console.error(`API response not OK for batch ${batchIndex + 1}: ${response.status} ${response.statusText}`);
          const errorText = await response.text();
          console.log('Error response text:', errorText);
          
          let errorMessage = 'Unknown error';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.error || 'API error';
          } catch {
            errorMessage = errorText || `HTTP error ${response.status}`;
          }
          
          console.error('OpenAI API error:', errorMessage);
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        const aiContent = data.choices?.[0]?.message?.content?.trim();
        
        if (!aiContent) {
          console.error('No content in API response for batch', batchIndex + 1);
          continue;
        }
        
        // Parse the JSON response
        let batchEntries: { ticketId: string; content: string }[] = [];
        try {
          // Try to parse the JSON response
          batchEntries = JSON.parse(aiContent);
          console.log(`Successfully parsed ${batchEntries.length} entries from batch ${batchIndex + 1}`);
        } catch (parseError) {
          console.error('Failed to parse API response as JSON:', parseError);
          console.log('Raw response:', aiContent);
          
          // Attempt to extract entries from text format if JSON parsing fails
          const entriesMatch = aiContent.match(/TICKET \d+ \(ID: ([^\)]+)\)[^\n]*\n([\s\S]+?)(?=TICKET \d+|$)/g);
          
          if (entriesMatch) {
            batchEntries = entriesMatch.map((match: string) => {
              const idMatch = match.match(/TICKET \d+ \(ID: ([^\)]+)\)/);
              const ticketId = idMatch ? idMatch[1] : 'unknown';
              const content = match.replace(/TICKET \d+ \(ID: [^\)]+\)[^\n]*\n/, '').trim();
              return { ticketId, content };
            });
            console.log(`Extracted ${batchEntries.length} entries from text format`);
          } else {
            console.error('Could not extract entries from response');
            continue;
          }
        }
        
        // Process each entry from the batch response
        for (const entry of batchEntries) {
          // Find the corresponding ticket
          const ticket = batch.find(t => {
            const ticketId = typeof t.number === 'string' ? t.number : 
                           typeof t.sys_id === 'string' ? t.sys_id : '';
            return ticketId === entry.ticketId;
          });
          
          if (!ticket) {
            console.log(`Could not find ticket with ID ${entry.ticketId}`);
            continue;
          }
          
          // Verify the entry starts with the required format
          let content = entry.content;
          if (!content.startsWith('Today I learned about')) {
            console.log(`Entry for ticket ${entry.ticketId} does not start with required format, fixing...`);
            
            // Extract what appears to be the component
            const componentMatch = content.match(/about\s+([^.]+)/i);
            const component = componentMatch ? componentMatch[1].trim() : 'a technical issue';
            
            // Reformat the entry
            content = `Today I learned about ${component}. ${content.replace(/^Today I learned about[^.]+\.\s*/i, '')}`;
          }
          
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
          const extractedTags = extractMeaningfulTags(ticket);
          
          // Create the entry
          const newEntry: JournalEntry = {
            id: generateId(),
            date: formattedDate,
            originalDate: ticketDate,
            content: content,
            tags: [...extractedTags, 'ai-generated'],
            ticketNumber: entry.ticketId,
            title: `AI Entry for Ticket ${entry.ticketId}`,
            ticketId: entry.ticketId,
            source: 'ai'
          };
          
          console.log(`Successfully generated entry for ticket ${entry.ticketId}`);
          aiEntries.push(newEntry);
        }
      } catch (error) {
        console.error(`Error processing batch ${batchIndex + 1}:`, error);
        
        // Check if it's an API key error and stop processing if it is
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
          console.error('API key error detected, stopping batch processing');
          throw error; // Re-throw to stop all processing
        }
      }
    }
    
    return aiEntries;
  }, [extractTicketInfo, extractMeaningfulTags]);

  // Function to process tickets with AI
  const processTicketsWithAI = useCallback(async () => {
    if (isProcessingAI) {
      console.log('Already processing tickets, please wait...');
      addNotification({
        type: 'info',
        title: 'Processing in Progress',
        message: 'Please wait while we finish processing the current batch of tickets'
      });
      return;
    }
    
    setIsProcessingAI(true);
    console.log(`Starting to process ${tickets.length} tickets with AI...`);
    
    // Check if we have any tickets to process
    if (tickets.length === 0) {
      addNotification({
        type: 'warning',
        title: 'No Tickets Available',
        message: 'There are no tickets to process. Please import tickets first.'
      });
      setIsProcessingAI(false);
      return;
    }
    
    try {
      // Filter out tickets that have already been processed
      const existingTicketIds = entries
        .filter(entry => entry.source === 'ai')
        .map(entry => entry.ticketId);
      
      const ticketsToProcess = tickets.filter(ticket => {
        const ticketId = typeof ticket.number === 'string' ? ticket.number : 
                        typeof ticket.sys_id === 'string' ? ticket.sys_id : '';
        
        // Skip tickets without ID or without description/resolution
        if (!ticketId || (!ticket.description && !ticket.resolution)) {
          return false;
        }
        
        // Skip tickets that already have entries
        return !existingTicketIds.includes(ticketId);
      });
      
      console.log(`Found ${ticketsToProcess.length} tickets to process out of ${tickets.length} total tickets`);
      
      if (ticketsToProcess.length === 0) {
        addNotification({
          type: 'info',
          title: 'No New Tickets',
          message: 'All tickets have already been processed or are missing required fields.'
        });
        setIsProcessingAI(false);
        return;
      }
      
      // Process tickets in batches
      const batchSize = 20; // Process 20 tickets at a time
      const aiEntries = await processTicketsInBatches(ticketsToProcess, batchSize);
      
      // Add new entries to the journal
      const newEntries = aiEntries.filter(entry => !entries.find(e => e.id === entry.id));
      const uniqueAiEntries = [...entries, ...newEntries];
      
      if (newEntries.length > 0) {
        setEntries(uniqueAiEntries);
        addNotification({
          type: 'success',
          title: 'AI Processing Complete',
          message: `Generated ${newEntries.length} new journal entries`
        });
        console.log(`Added ${newEntries.length} new entries to journal`);
      } else {
        addNotification({
          type: 'info',
          title: 'AI Processing Complete',
          message: 'All tickets have already been processed. No new entries were generated.'
        });
        console.log('No new entries added (all were duplicates)');
      }
    } catch (error) {
      console.error('Error processing tickets:', error);
      addNotification({
        type: 'error',
        title: 'Error Processing Tickets',
        message: 'An error occurred while processing tickets'
      });
    } finally {
      setIsProcessingAI(false);
    }
  }, [tickets, entries, extractMeaningfulTags, addNotification, isProcessingAI, processTicketsInBatches, setIsProcessingAI, setEntries]);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('journalEntries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving entries:', error);
      addNotification({
        type: 'error',
        title: 'Error Saving Entries',
        message: 'Could not save journal entries'
      });
    }
  }, [entries, addNotification]);

  // Load entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (error) {
        console.error('Error parsing saved entries:', error);
        addNotification({
          type: 'error',
          title: 'Error Loading Entries',
          message: 'Could not load saved journal entries'
        });
      }
    }
  }, [addNotification]);

  // Auto-process tickets with AI on component mount
  useEffect(() => {
    // Only auto-process if we have tickets and no AI entries yet
    const hasAiEntries = entries.some(entry => entry.tags?.includes('ai-generated'));
    
    // Auto-process with AI on initial load if we have tickets and no AI entries yet
    if (tickets.length > 0 && !hasAiEntries && !isProcessingAI) {
      processTicketsWithAI();
    }
  }, [tickets, entries, isProcessingAI, processTicketsWithAI]);

  const handleAddEntry = () => {
    if (newEntryContent.trim() === '') {
      return;
    }

    const newEntry: JournalEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      content: newEntryContent,
      tags: newEntryTags.split(',').map(tag => tag.trim()).filter(Boolean),
      ticketId: null,
      title: newEntryTitle || `Journal Entry - ${new Date().toLocaleDateString()}`,
      source: 'manual',
    };

    setEntries([...entries, newEntry]);
    setNewEntryContent('');
    setNewEntryTags('');
    setIsAddingEntry(false);
    addNotification({
      type: 'success',
      title: 'Entry Added',
      message: 'Journal entry has been added successfully'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Notifications are now handled by the NotificationProvider */}
      <div className="bg-[#2B2B2B] shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Learning Journal</h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md flex items-center"
            >
              <FaArrowLeft className="mr-2" />
              Back to Dashboard
            </button>
            <button
              onClick={() => setIsAddingEntry(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Entry
            </button>
            <button
              onClick={processTicketsWithAI}
              className={`px-4 py-2 ${isProcessingAI ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'} rounded-md flex items-center`}
              disabled={isProcessingAI}
            >
              {isProcessingAI ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FaPlus className="mr-2" />
                  Generate AI Entries
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* New entry form */}
      {isAddingEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Add New Journal Entry</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Entry Content</label>
              <textarea
                className="w-full p-2 bg-gray-700 rounded-md text-white"
                rows={8}
                value={newEntryContent}
                onChange={(e) => setNewEntryContent(e.target.value)}
                placeholder="Write your journal entry here..."
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
              <input
                type="text"
                className="w-full p-2 bg-gray-700 rounded-md text-white"
                value={newEntryTags}
                onChange={(e) => setNewEntryTags(e.target.value)}
                placeholder="learning, problem-solving, etc."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsAddingEntry(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-md"
                disabled={!newEntryContent.trim()}
              >
                Save Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Journal Entries */}
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="relative mb-4 sm:mb-0 sm:w-64">
              <input
                type="text"
                className="w-full p-2 pl-10 bg-gray-800 border border-gray-700 rounded-md text-white"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <FaSearch className="h-5 w-5" />
              </div>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <select
                className="p-2 bg-gray-800 border border-gray-700 rounded-md text-white"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

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
              // Handle sorting with null checks for dates
              const dateA = a.originalDate ? new Date(a.originalDate).getTime() : 0;
              const dateB = b.originalDate ? new Date(b.originalDate).getTime() : 0;
              
              if (sortOrder === 'newest') {
                return dateB - dateA;
              } else {
                return dateA - dateB;
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
                    <span className="text-xs text-gray-400">
                      {entry.originalDate 
                        ? `${new Date(entry.originalDate as Date).toLocaleDateString()} ${new Date(entry.originalDate as Date).toLocaleTimeString()}`
                        : `${new Date(entry.date).toLocaleDateString()} ${new Date(entry.date).toLocaleTimeString()}`
                      }
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      // Delete the entry
                      setEntries(prev => prev.filter(e => e.id !== entry.id));
                      addNotification({
                        type: 'info',
                        title: 'Entry Deleted',
                        message: 'Journal entry has been deleted'
                      });
                    }}
                    className="text-red-500 hover:text-red-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0111 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
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
