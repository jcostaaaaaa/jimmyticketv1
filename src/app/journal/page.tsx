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

  // Function to chunk large text to avoid token limits
  const chunkText = useCallback((text: string, maxLength: number = 1000): string[] => {
    if (!text || text.length <= maxLength) return [text];
    
    // Try to split at paragraph breaks first
    const paragraphs = text.split(/\n\n+/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      if ((currentChunk + paragraph).length <= maxLength) {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      } else {
        // If current paragraph would exceed limit
        if (currentChunk) {
          chunks.push(currentChunk);
          currentChunk = paragraph;
        } else {
          // If a single paragraph is too long, split by sentences
          const sentences = paragraph.split(/(?<=[.!?])\s+/);
          for (const sentence of sentences) {
            if ((currentChunk + sentence).length <= maxLength) {
              currentChunk += (currentChunk ? ' ' : '') + sentence;
            } else {
              if (currentChunk) {
                chunks.push(currentChunk);
                currentChunk = sentence;
              } else {
                // If a single sentence is too long, split by words
                chunks.push(sentence.substring(0, maxLength));
                currentChunk = '';
              }
            }
          }
        }
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }, []);

  // Function to generate a learning entry with AI
  const generateLearningEntryWithAI = useCallback(async (ticket: Ticket): Promise<string | null> => {
    try {
      // Check if ticket has at least description or resolution
      if (!ticket.description && !ticket.resolution) {
        console.log('Skipping ticket without both description and resolution');
        return null;
      }
      
      // Extract ticket information in a structured format
      const ticketInfo = extractTicketInfo(ticket);
      
      // Chunk the description and resolution if they're too large
      const descriptionChunks = chunkText(ticketInfo.description);
      const resolutionChunks = chunkText(ticketInfo.resolution);
      
      console.log(`Processing ticket with ${descriptionChunks.length} description chunks and ${resolutionChunks.length} resolution chunks`);
      
      // If we have multiple chunks, we'll need to summarize first
      let processedDescription = ticketInfo.description;
      let processedResolution = ticketInfo.resolution;
      
      // If description is too large, summarize it first
      if (descriptionChunks.length > 1) {
        console.log('Description is large, summarizing first...');
        
        // Process each chunk and collect summaries
        const summaries = [];
        for (let i = 0; i < descriptionChunks.length; i++) {
          const chunk = descriptionChunks[i];
          console.log(`Processing description chunk ${i+1}/${descriptionChunks.length}`);
          
          // Add a small delay to prevent too many API calls at once
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const summarizePrompt = `
          Summarize the following ticket description chunk (${i+1}/${descriptionChunks.length}):
          
          ${chunk}
          
          Extract only the key technical details about the issue.
          `;
          
          const summaryResponse = await fetch('/api/journal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: 'You are a technical support analyst who extracts key information from IT support tickets.'
                },
                {
                  role: 'user',
                  content: summarizePrompt
                }
              ],
              temperature: 0.3,
              max_tokens: 150
            })
          });
          
          if (!summaryResponse.ok) {
            console.error(`Failed to summarize description chunk ${i+1}`);
            continue;
          }
          
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices?.[0]?.message?.content?.trim();
          
          if (summary) {
            summaries.push(summary);
          }
        }
        
        // Combine summaries
        processedDescription = summaries.join('\n\n');
      }
      
      // If resolution is too large, summarize it first
      if (resolutionChunks.length > 1) {
        console.log('Resolution is large, summarizing first...');
        
        // Process each chunk and collect summaries
        const summaries = [];
        for (let i = 0; i < resolutionChunks.length; i++) {
          const chunk = resolutionChunks[i];
          console.log(`Processing resolution chunk ${i+1}/${resolutionChunks.length}`);
          
          // Add a small delay to prevent too many API calls at once
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const summarizePrompt = `
          Summarize the following ticket resolution chunk (${i+1}/${resolutionChunks.length}):
          
          ${chunk}
          
          Extract only the key technical details about how the issue was resolved.
          `;
          
          const summaryResponse = await fetch('/api/journal', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: 'You are a technical support analyst who extracts key information from IT support tickets.'
                },
                {
                  role: 'user',
                  content: summarizePrompt
                }
              ],
              temperature: 0.3,
              max_tokens: 150
            })
          });
          
          if (!summaryResponse.ok) {
            console.error(`Failed to summarize resolution chunk ${i+1}`);
            continue;
          }
          
          const summaryData = await summaryResponse.json();
          const summary = summaryData.choices?.[0]?.message?.content?.trim();
          
          if (summary) {
            summaries.push(summary);
          }
        }
        
        // Combine summaries
        processedResolution = summaries.join('\n\n');
      }
      
      // Add a small delay to prevent too many API calls at once
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Generating AI entry for ticket:', ticket.number || ticket.sys_id);
      
      // Construct a prompt that will generate specific technical learning entries
      const prompt = `
      You are an IT professional documenting what you learned from resolving a technical support ticket.
      
      TICKET INFORMATION:
      ${ticketInfo.shortDescription ? `Short Description: ${ticketInfo.shortDescription}\n` : ''}
      ${ticketInfo.category ? `Category: ${ticketInfo.category}\n` : ''}
      ${ticketInfo.subcategory ? `Subcategory: ${ticketInfo.subcategory}\n` : ''}
      ${ticketInfo.priority ? `Priority: ${String(ticketInfo.priority)}\n` : ''}
      
      TICKET DESCRIPTION:
      ${processedDescription || 'No description provided'}
      
      RESOLUTION:
      ${processedResolution || 'No resolution provided'}
      
      Write a detailed, specific learning journal entry that MUST start with "Today I learned about [COMPONENT]" where [COMPONENT] is the specific hardware or software component that was causing issues.
      
      Your entry MUST:
      1. Start with "Today I learned about [specific component]" - replace [specific component] with the exact hardware/software component
      2. Explain why the specific component failed or caused issues
      3. Detail what was done to resolve the issue
      4. Be written in first person as if you personally solved this issue
      5. Be 3-5 sentences long
      
      BAD EXAMPLE: "Today I learned about hardware issues. The problem was with a computer not working. I fixed it by replacing parts."
      
      GOOD EXAMPLE: "Today I learned about Dell OptiPlex power supply failures. The specific issue involved a faulty capacitor in the PSU causing intermittent shutdowns and preventing proper POST completion. I discovered that replacing the power supply unit and ensuring proper ventilation resolved the issue, while also documenting a pattern of similar failures in this model series."
      `;
      
      // Make API call to our secure API route that handles the OpenAI API key
      console.log('Making fetch request to /api/journal');
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
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 250
        })
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
        addNotification({
          type: 'error',
          title: 'AI Processing Failed',
          message: `Error: ${errorMessage}`
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
        addNotification({
          type: 'error',
          title: 'API Response Error',
          message: 'Failed to parse API response'
        });
        return null;
      }
      
      console.log('Checking for AI content in response');
      const aiEntry = data.choices?.[0]?.message?.content?.trim();
      console.log('AI entry found:', aiEntry ? 'Yes' : 'No');
      
      if (!aiEntry) {
        console.error('No content in API response:', JSON.stringify(data));
        addNotification({
          type: 'error',
          title: 'AI Processing Failed',
          message: 'No content generated by AI'
        });
        return null;
      }
      
      // Verify the entry starts with the required format
      if (!aiEntry.startsWith('Today I learned about')) {
        console.log('Entry does not start with required format, fixing...');
        
        // Extract what appears to be the component
        const componentMatch = aiEntry.match(/about\s+([^.]+)/i);
        const component = componentMatch ? componentMatch[1].trim() : 'a technical issue';
        
        // Reformat the entry
        const reformattedEntry = `Today I learned about ${component}. ${aiEntry.replace(/^Today I learned about[^.]+\.\s*/i, '')}`;
        
        console.log('Generated entry (reformatted):', reformattedEntry.substring(0, 50) + '...');
        return reformattedEntry;
      }
      
      console.log('Generated entry:', aiEntry.substring(0, 50) + '...');
      return aiEntry;
    } catch (error) {
      console.error('Error generating AI entry:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Error details:', errorMessage);
      addNotification({
        type: 'error',
        title: 'AI Processing Failed',
        message: `Error: ${errorMessage}`
      });
      return null;
    }
  }, [addNotification, extractTicketInfo, chunkText]);

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
    
    try {
      const processedTickets = new Set<string>();
      const aiEntries: JournalEntry[] = [];
      let processedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      let apiKeyError = false;
      
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
        
        // Check if ticket has at least one required field
        if (!ticket.description && !ticket.resolution) {
          console.log(`Skipping ticket ${ticketId} - missing both description and resolution`);
          skippedCount++;
          continue;
        }
        
        // Generate AI entry
        try {
          // Check if we've already had API key errors
          if (apiKeyError) {
            console.log('API key error encountered earlier, stopping processing');
            break; // Stop processing more tickets if we've had an API key error
          }
          
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
            const extractedTags = extractMeaningfulTags(ticket);
            
            // Create the entry
            const newEntry: JournalEntry = {
              id: generateId(),
              date: formattedDate,
              originalDate: ticketDate,
              content: content,
              tags: [...extractedTags, 'ai-generated'],
              ticketNumber: ticketId,
              title: `AI Entry for Ticket ${ticketId}`,
              ticketId: ticketId,
              source: 'ai'
            };
            
            console.log(`Successfully generated entry for ticket ${ticketId}`);
            aiEntries.push(newEntry);
          } else {
            console.log(`Failed to generate content for ticket ${ticketId}`);
            errorCount++;
          }
        } catch (error) {
          console.error(`Error processing ticket ${ticketId}:`, error);
          errorCount++;
          
          // Check if it's an API key error and stop processing if it is
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
            console.error('API key error detected, stopping processing');
            apiKeyError = true;
            addNotification({
              type: 'error',
              title: 'API Key Error',
              message: 'There was an issue with the API key. Please check your environment variables.'
            });
          }
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
          localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
          
          addNotification({
            type: 'success',
            title: 'AI Processing Complete',
            message: `Generated ${uniqueAiEntries.length} new journal entries`
          });
          console.log(`Added ${uniqueAiEntries.length} new entries to journal`);
        } else {
          addNotification({
            type: 'info',
            title: 'AI Processing Complete',
            message: 'All tickets have already been processed. No new entries were generated.'
          });
          console.log('No new entries added (all were duplicates)');
        }
      } else if (apiKeyError) {
        // API key error notification already shown, don't show another one
        console.log('No entries were generated due to API key error');
      } else {
        addNotification({
          type: 'warning',
          title: 'AI Processing Complete',
          message: 'No entries were generated. Please check that your tickets have both description and resolution fields.'
        });
        console.log('No entries were generated');
      }
    } catch (error) {
      console.error('Error in AI processing:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log('Error details:', errorMessage);
      addNotification({
        type: 'error',
        title: 'AI Processing Error',
        message: `An error occurred: ${errorMessage}`
      });
    } finally {
      setIsProcessingAI(false);
    }
  }, [tickets, entries, extractMeaningfulTags, generateLearningEntryWithAI, addNotification]);

  // Update an existing journal entry - commented out as it's not currently used
  /* 
  const updateEntry = (updatedEntry: JournalEntry) => {
    setEntries(prev => 
      prev.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    );
    addNotification({
      type: 'success',
      title: 'Entry Updated',
      message: 'Journal entry has been updated successfully'
    });
    setEditingEntry(null);
  };
  */

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
