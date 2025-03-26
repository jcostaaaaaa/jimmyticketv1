'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPlus, FaSearch, FaCalendarAlt, FaTag } from 'react-icons/fa';
import { useTickets, Ticket } from '@/context/TicketContext';

interface JournalEntry {
  id: string;
  date: string;
  originalDate: Date;
  content: string;
  tags: string[];
  ticketNumber?: string;
  source: 'description' | 'resolution' | 'manual';
}

export default function JournalPage() {
  const router = useRouter();
  const { tickets } = useTickets();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

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
            
            if (cleanDescription.length > 30 && !isGenericText(cleanDescription)) {
              // Create a learning entry from the description
              const content = generateLearningEntryFromTicket(cleanDescription, ticket);
              
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
          }
          
          // Process resolution if it exists and is meaningful
          if (ticket.resolution && typeof ticket.resolution === 'string' && ticket.resolution.length > 30) {
            // Clean up the resolution
            const cleanResolution = ticket.resolution
              .replace(/\\n/g, ' ')
              .replace(/\\r/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            if (cleanResolution.length > 30 && !isGenericText(cleanResolution)) {
              // Create a learning entry from the resolution
              const content = generateLearningEntryFromTicket(cleanResolution, ticket, true);
              
              if (content) {
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
          }
        });
        
        // Sort entries by date (newest first by default)
        const sortedEntries = journalEntries.sort((a, b) => 
          b.originalDate.getTime() - a.originalDate.getTime()
        );
        
        setEntries(sortedEntries);
        localStorage.setItem('learningJournal', JSON.stringify(sortedEntries));
      } else {
        // If no tickets, just use default entries
        setEntries(defaultEntries);
        localStorage.setItem('learningJournal', JSON.stringify(defaultEntries));
      }
    } catch (error) {
      console.error("Error initializing journal:", error);
      // Fallback to empty entries
      setEntries([]);
    }
  }, [tickets]);

  // Check if text is generic/template text
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

  // Generate a meaningful learning entry from ticket content
  function generateLearningEntryFromTicket(text: string, ticket: Ticket, isResolution = false): string | null {
    // Skip if text is too short or generic
    if (text.length < 40 || isGenericText(text)) return null;
    
    // Extract key sentences (first sentence, or first 150 chars if no sentence end found)
    let mainContent = text;
    const sentenceEnd = text.search(/[.!?](\s|$)/);
    if (sentenceEnd > 20) {
      mainContent = text.substring(0, sentenceEnd + 1);
    } else if (text.length > 150) {
      mainContent = text.substring(0, 150) + "...";
    }
    
    // Extract the specific technical issue from the text
    const specificIssue = extractSpecificIssue(text, ticket);
    
    // Format the entry based on whether it's from description or resolution
    if (isResolution) {
      // For resolutions, focus on what was learned from solving the issue
      return `Today I learned how to resolve ${specificIssue}: ${mainContent} This knowledge will help when similar problems arise in the future.`;
    } else {
      // For descriptions, focus on the technical aspects of the issue
      return `Today I learned about a technical issue involving ${specificIssue}: ${mainContent} Understanding this problem helps build troubleshooting skills.`;
    }
  }

  // Extract the specific technical issue from the text
  function extractSpecificIssue(text: string, ticket: Ticket): string {
    // Common technical issue patterns to look for
    const issuePatterns = [
      // Network issues
      { regex: /(?:can'?t|unable to|not) (?:access|connect to|reach) (?:network|shared) (?:drive|folder|directory|resource)/i, issue: "network drive access problems" },
      { regex: /(?:vpn|virtual private network) (?:connection|access) (?:issue|problem|error|fail)/i, issue: "VPN connectivity issues" },
      { regex: /(?:wifi|wireless|internet) (?:connection|signal) (?:drop|weak|intermittent|unstable)/i, issue: "unstable WiFi connections" },
      { regex: /(?:dns|domain name|name resolution) (?:error|issue|problem)/i, issue: "DNS resolution failures" },
      
      // Communication tools
      { regex: /(?:teams|zoom|webex) (?:call|meeting) (?:drop|disconnect|crash|freeze)/i, issue: "video conferencing disconnections" },
      { regex: /(?:teams|zoom|webex) (?:audio|video|camera|mic) (?:not working|issue|problem)/i, issue: "video conferencing audio/video problems" },
      { regex: /(?:outlook|email) (?:sync|synchronization) (?:issue|problem|error|fail)/i, issue: "email synchronization problems" },
      { regex: /(?:calendar|meeting|appointment) (?:sync|missing|not showing|disappear)/i, issue: "calendar synchronization issues" },
      
      // Hardware issues
      { regex: /(?:printer|printing|scan) (?:not working|issue|problem|error|fail)/i, issue: "printer connectivity problems" },
      { regex: /(?:monitor|display|screen) (?:blank|black|not working|flickering)/i, issue: "monitor display issues" },
      { regex: /(?:keyboard|mouse|input device) (?:not working|unresponsive|lag)/i, issue: "input device malfunctions" },
      { regex: /(?:battery|power) (?:drain|not charging|issue|problem)/i, issue: "battery and power problems" },
      
      // Software issues
      { regex: /(?:application|program|software) (?:crash|freeze|hang|not responding)/i, issue: "application crashes and freezes" },
      { regex: /(?:slow|performance|lag) (?:computer|laptop|pc|system)/i, issue: "system performance degradation" },
      { regex: /(?:update|upgrade|patch) (?:fail|error|issue|problem)/i, issue: "software update failures" },
      { regex: /(?:login|authentication|password) (?:fail|issue|problem|error|reset)/i, issue: "authentication problems" },
      
      // Data issues
      { regex: /(?:file|document) (?:corrupt|missing|lost|can't open)/i, issue: "file corruption or loss" },
      { regex: /(?:backup|restore) (?:fail|issue|problem|error)/i, issue: "backup and restore failures" },
      { regex: /(?:permission|access denied|unauthorized)/i, issue: "permission and access control issues" },
      
      // Security issues
      { regex: /(?:virus|malware|ransomware|phishing)/i, issue: "malware and security threats" },
      { regex: /(?:suspicious|unusual|unauthorized) (?:activity|login|access)/i, issue: "unauthorized access attempts" }
    ];
    
    // Check for specific issue patterns in the text
    const lowerText = text.toLowerCase();
    for (const pattern of issuePatterns) {
      if (pattern.regex.test(lowerText)) {
        return pattern.issue;
      }
    }
    
    // If no specific pattern is found, try to extract key terms
    const shortDesc = ticket.short_description || '';
    
    // If short description contains a clear issue statement, use that
    if (shortDesc.length > 10 && !isGenericText(shortDesc)) {
      // Clean up the short description
      const cleanShortDesc = shortDesc
        .replace(/^(re:|fwd:)/i, '')
        .trim();
      
      if (cleanShortDesc.length > 10) {
        return `issues with ${cleanShortDesc.toLowerCase()}`;
      }
    }
    
    // Extract category and subcategory if available
    const category = ticket.category ? ticket.category.toLowerCase() : '';
    const subcategory = ticket.subcategory ? ticket.subcategory.toLowerCase() : '';
    
    if (subcategory && category) {
      return `${subcategory} issues in ${category} systems`;
    } else if (category) {
      return `${category} system issues`;
    }
    
    // Last resort: extract technical terms from the text
    const technicalTerms = [
      'network', 'server', 'database', 'security', 'authentication', 
      'firewall', 'VPN', 'DNS', 'API', 'SQL', 'Windows', 'Linux', 'macOS',
      'cloud', 'AWS', 'Azure', 'Docker', 'virtualization', 'backup',
      'monitoring', 'incident', 'deployment', 'Office 365', 'Teams', 'Outlook',
      'SharePoint', 'OneDrive', 'Exchange', 'Active Directory', 'printer',
      'laptop', 'desktop', 'mobile', 'tablet', 'browser', 'Chrome', 'Firefox',
      'Edge', 'Safari', 'Internet Explorer', 'password', 'account', 'email',
      'file share', 'permissions', 'access', 'connectivity', 'bandwidth'
    ];
    
    const foundTerms = technicalTerms.filter(term => lowerText.includes(term.toLowerCase()));
    
    if (foundTerms.length > 0) {
      // Use the first two terms found
      if (foundTerms.length >= 2) {
        return `${foundTerms[0]} and ${foundTerms[1]} integration issues`;
      } else {
        return `${foundTerms[0]} configuration issues`;
      }
    }
    
    // If nothing specific found, return a generic but somewhat specific issue
    return "technical system integration issues";
  }

  // Extract meaningful tags from a ticket
  function extractMeaningfulTags(ticket: Ticket): string[] {
    const tags: string[] = [];
    
    // Add category if available
    if (ticket.category) {
      tags.push(ticket.category.toLowerCase());
    }
    
    // Add subcategory if available
    if (ticket.subcategory) {
      tags.push(ticket.subcategory.toLowerCase());
    }
    
    // Add priority if available
    if (ticket.priority) {
      const priorityTag = `priority-${ticket.priority}`;
      tags.push(priorityTag);
    }
    
    // Extract technical terms from description or resolution
    const technicalTerms = [
      'network', 'server', 'database', 'security', 'authentication', 
      'firewall', 'VPN', 'DNS', 'API', 'SQL', 'Windows', 'Linux', 'macOS',
      'cloud', 'AWS', 'Azure', 'Docker', 'virtualization', 'backup',
      'monitoring', 'incident', 'deployment'
    ];
    
    const textToSearch = [
      ticket.short_description || '', 
      ticket.description || '', 
      ticket.resolution || ''
    ].filter(Boolean).join(' ').toLowerCase();
    
    technicalTerms.forEach(term => {
      if (textToSearch.includes(term.toLowerCase())) {
        tags.push(term.toLowerCase());
      }
    });
    
    // Remove duplicates and limit to 5 tags
    return [...new Set(tags)].slice(0, 5);
  }

  const handleAddEntry = () => {
    if (newEntry.trim() === '') return;
    
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      originalDate: new Date(),
      content: newEntry.startsWith("Today I learned") ? newEntry : `Today I learned ${newEntry}`,
      tags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
      source: 'manual'
    };
    
    const updatedEntries = [entry, ...entries];
    setEntries(updatedEntries);
    localStorage.setItem('learningJournal', JSON.stringify(updatedEntries));
    
    // Reset form
    setNewEntry('');
    setNewTags('');
    setIsAddingEntry(false);
  };

  const handleDeleteEntry = (id: string) => {
    const updatedEntries = entries.filter(entry => entry.id !== id);
    setEntries(updatedEntries);
    localStorage.setItem('learningJournal', JSON.stringify(updatedEntries));
  };

  const handleSort = () => {
    const newOrder = sortOrder === 'newest' ? 'oldest' : 'newest';
    setSortOrder(newOrder);
    
    const sortedEntries = [...entries].sort((a, b) => {
      return newOrder === 'newest' 
        ? b.originalDate.getTime() - a.originalDate.getTime()
        : a.originalDate.getTime() - b.originalDate.getTime();
    });
    
    setEntries(sortedEntries);
  };

  // Filter entries based on search term
  const filteredEntries = entries.filter(entry => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    
    return (
      entry.content.toLowerCase().includes(searchLower) ||
      entry.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
      (entry.ticketNumber && entry.ticketNumber.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => router.push('/analyze')}
              className="mr-4 p-2 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              <FaArrowLeft className="text-gray-700" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Learning Journal</h1>
          </div>
          
          <button 
            onClick={() => setIsAddingEntry(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaPlus /> New Entry
          </button>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            onClick={handleSort}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            <FaCalendarAlt />
            Sort: {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>
        
        {isAddingEntry && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Add New Learning Entry</h2>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">What did you learn today?</label>
              <textarea 
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="Today I learned..."
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Tags (comma separated)</label>
              <input 
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="e.g. networking, security, hardware"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsAddingEntry(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddEntry}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save Entry
              </button>
            </div>
          </div>
        )}
        
        {filteredEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No journal entries found. {searchTerm ? 'Try a different search term.' : 'Add your first entry!'}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="text-gray-400" />
                    <span className="text-sm text-gray-500">{entry.date}</span>
                    {entry.ticketNumber && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Ticket #{entry.ticketNumber}
                      </span>
                    )}
                    <span className={`text-xs px-2 py-1 rounded ${
                      entry.source === 'resolution' 
                        ? 'bg-green-100 text-green-800' 
                        : entry.source === 'description'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-purple-100 text-purple-800'
                    }`}>
                      {entry.source === 'resolution' ? 'Resolution' : entry.source === 'description' ? 'Issue' : 'Manual'}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </button>
                </div>
                <p className="text-gray-800 mb-4">{entry.content}</p>
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag, index) => (
                    <span key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                      <FaTag className="text-gray-400 text-xs" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
