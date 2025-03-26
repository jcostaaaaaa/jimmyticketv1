'use client';

import { useState, useEffect, useCallback } from 'react';
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

  // Function to generate learning entry from ticket description or resolution
  const generateLearningEntryFromTicket = useCallback((text: string, ticket: Ticket, isResolution = false): string | null => {
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

    // Skip if text is too short or generic
    if (text.length < 40 || isGenericText(text)) return null;
    
    // Extract specific technical issue from text
    function extractSpecificIssue(text: string, ticket: Ticket): string {
      const lowercaseText = text.toLowerCase();
      
      // Extract specific hardware issues
      if (lowercaseText.includes('camera') && (lowercaseText.includes('not working') || lowercaseText.includes('fail'))) {
        return 'camera failure';
      }
      if (lowercaseText.includes('monitor') && (lowercaseText.includes('not working') || lowercaseText.includes('display'))) {
        return 'monitor display issues';
      }
      if (lowercaseText.includes('keyboard') && (lowercaseText.includes('not working') || lowercaseText.includes('key'))) {
        return 'keyboard malfunction';
      }
      if (lowercaseText.includes('mouse') && (lowercaseText.includes('not working') || lowercaseText.includes('click'))) {
        return 'mouse malfunction';
      }
      if (lowercaseText.includes('printer') && (lowercaseText.includes('not working') || lowercaseText.includes('print'))) {
        return 'printer malfunction';
      }
      if (lowercaseText.includes('headphone') || lowercaseText.includes('headset')) {
        return 'audio device issues';
      }
      
      // Extract specific software issues
      if (lowercaseText.includes('outlook') || (lowercaseText.includes('email') && lowercaseText.includes('sync'))) {
        return 'email synchronization problems';
      }
      if (lowercaseText.includes('teams') || lowercaseText.includes('zoom') || 
          (lowercaseText.includes('video') && lowercaseText.includes('conference'))) {
        return 'video conferencing disconnections';
      }
      if (lowercaseText.includes('vpn') || (lowercaseText.includes('remote') && lowercaseText.includes('connect'))) {
        return 'VPN connection failures';
      }
      if (lowercaseText.includes('network drive') || 
          (lowercaseText.includes('shared') && lowercaseText.includes('folder'))) {
        return 'network drive access problems';
      }
      if (lowercaseText.includes('password') || lowercaseText.includes('login') || lowercaseText.includes('account lock')) {
        return 'account authentication failures';
      }
      
      // Common IT issues to look for in text - use as fallback
      const issuePatterns = [
        { pattern: /network\s+(?:issue|problem|connectivity|access|outage|down)/i, issue: "network connectivity problems" },
        { pattern: /(?:vpn|remote\s+access)\s+(?:issue|problem|connectivity|access|failure)/i, issue: "VPN access failures" },
        { pattern: /(?:email|outlook|exchange)\s+(?:issue|problem|sync|error|not\s+(?:working|sending|receiving))/i, issue: "email synchronization problems" },
        { pattern: /(?:printer|printing|scan|scanner)\s+(?:issue|problem|error|jam|not\s+(?:working|connecting|printing))/i, issue: "printer configuration errors" },
        { pattern: /(?:password|login|authentication|account)\s+(?:issue|problem|reset|expired|locked)/i, issue: "account authentication failures" },
        { pattern: /(?:software|application|program|app)\s+(?:issue|problem|error|crash|not\s+(?:working|opening|responding))/i, issue: "application crashes" },
        { pattern: /(?:hardware|device|computer|laptop|desktop|monitor|keyboard|mouse)\s+(?:issue|problem|failure|not\s+(?:working|powering|booting))/i, issue: "device hardware failures" },
        { pattern: /(?:update|upgrade|patch|installation)\s+(?:issue|problem|error|failure|not\s+(?:working|installing|completing))/i, issue: "software update failures" },
        { pattern: /(?:data|file|document|folder)\s+(?:issue|problem|loss|corrupt|missing|not\s+(?:opening|saving|syncing))/i, issue: "file corruption issues" },
        { pattern: /(?:permission|access|security|authorization)\s+(?:issue|problem|denied|error|not\s+(?:working|granted))/i, issue: "permission access denials" },
        { pattern: /(?:internet|web|browser|website)\s+(?:issue|problem|error|slow|not\s+(?:working|loading|connecting))/i, issue: "web browser failures" },
        { pattern: /(?:video|audio|sound|microphone|speaker|camera|conference)\s+(?:issue|problem|error|quality|not\s+(?:working|connecting))/i, issue: "audio/video peripheral failures" },
        { pattern: /(?:mobile|phone|tablet|ipad|iphone|android)\s+(?:issue|problem|error|not\s+(?:working|connecting|syncing))/i, issue: "mobile device synchronization problems" },
        { pattern: /(?:backup|restore|recovery)\s+(?:issue|problem|error|failure|not\s+(?:working|completing))/i, issue: "data backup failures" },
        { pattern: /(?:performance|slow|speed|response\s+time)\s+(?:issue|problem|degradation)/i, issue: "system performance degradation" },
        { pattern: /(?:virus|malware|ransomware|spyware|security)\s+(?:issue|problem|infection|attack|breach)/i, issue: "security threat detection" }
      ];
      
      // Check for specific issues in the text
      for (const { pattern, issue } of issuePatterns) {
        if (pattern.test(text)) {
          return issue;
        }
      }
      
      // If no specific issue found, use the category from the ticket but make it more specific
      const category = ticket.category || ticket.subcategory || '';
      if (category.toLowerCase().includes('network')) return 'network connectivity problems';
      if (category.toLowerCase().includes('email')) return 'email system failures';
      if (category.toLowerCase().includes('hardware')) return 'hardware device failures';
      if (category.toLowerCase().includes('software')) return 'software application errors';
      if (category.toLowerCase().includes('access')) return 'system access restrictions';
      if (category.toLowerCase().includes('security')) return 'security protocol violations';
      
      // Default fallback
      return 'technical issue resolution';
    }
    
    // Generate a statement about how the issue impacts workflow
    function getWorkflowImpactStatement(issueType: string): string {
      // Extract specific impacts from the ticket description
      const lowercaseText = text.toLowerCase();
      
      // Check for specific workflow impacts
      if (lowercaseText.includes('deadline') || lowercaseText.includes('due date')) {
        return "This delayed important deadlines and affected project timelines.";
      }
      if (lowercaseText.includes('meeting') || lowercaseText.includes('presentation')) {
        return "This disrupted scheduled meetings and affected team communication.";
      }
      if (lowercaseText.includes('report') || lowercaseText.includes('data')) {
        return "This prevented access to critical data needed for analysis and reporting.";
      }
      if (lowercaseText.includes('customer') || lowercaseText.includes('client')) {
        return "This affected the ability to respond to client requests promptly.";
      }
      if (lowercaseText.includes('document') || lowercaseText.includes('file')) {
        return "This prevented access to important documents needed for daily work.";
      }
      if (lowercaseText.includes('login') || lowercaseText.includes('access')) {
        return "This blocked access to essential systems required for work tasks.";
      }
      
      // Map of issue types to workflow impact statements - use as fallback
      const workflowImpacts: Record<string, string[]> = {
        "network connectivity problems": [
          "This prevented team members from accessing shared resources, significantly hindering collaborative work.",
          "Network issues caused delays in accessing critical files needed for daily tasks.",
          "The connectivity issue isolated team members from necessary resources."
        ],
        "VPN access failures": [
          "This prevented employees from accessing internal systems while working remotely.",
          "VPN issues delayed completion of important tasks for remote workers.",
          "Remote access problems created barriers to effective collaboration."
        ],
        "email synchronization problems": [
          "This caused important messages to be delayed or missed entirely.",
          "Communication delays affected coordination between team members.",
          "Email issues prevented timely responses to important inquiries."
        ],
        "printer configuration errors": [
          "This prevented the printing of necessary physical documents.",
          "Printing issues delayed the processing of important paperwork.",
          "Document processing was interrupted due to printing failures."
        ],
        "account authentication failures": [
          "This blocked access to critical systems needed for work tasks.",
          "Authentication issues prevented access to time-sensitive information.",
          "Login problems created delays in accessing necessary resources."
        ],
        "application crashes": [
          "This interrupted work in progress and potentially caused data loss.",
          "Software failures prevented completion of essential tasks.",
          "Application issues reduced productivity and created frustration."
        ],
        "device hardware failures": [
          "This prevented the use of essential equipment needed for work.",
          "Hardware issues forced employees to use alternative solutions.",
          "Equipment failures created barriers to completing normal tasks."
        ]
      };
      
      // Find the best matching impact statement
      for (const [key, statements] of Object.entries(workflowImpacts)) {
        if (issueType.includes(key) || key.includes(issueType)) {
          return statements[Math.floor(Math.random() * statements.length)];
        }
      }
      
      // Generic fallback statements that don't mention customers or transactions
      const genericImpacts = [
        "This created significant delays in completing assigned tasks.",
        "This prevented access to resources needed for daily work activities.",
        "This interrupted normal workflow and reduced productivity.",
        "This created technical barriers that delayed project progress.",
        "This forced team members to find alternative solutions to complete their work."
      ];
      
      return genericImpacts[Math.floor(Math.random() * genericImpacts.length)];
    }
    
    // Extract the specific issue
    const specificIssue = extractSpecificIssue(text, ticket);
    
    // Get the workflow impact
    const workflowImpact = getWorkflowImpactStatement(specificIssue);
    
    // Create the learning entry
    return `Today I learned about a technical issue involving ${specificIssue}: ${text.substring(0, 100).trim()}${text.length > 100 ? '...' : ''} ${workflowImpact}`;
  }, []);

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
          
          // Process resolution if it exists and is meaningful
          if (ticket.resolution && typeof ticket.resolution === 'string' && ticket.resolution.length > 30) {
            // Clean up the resolution
            const cleanResolution = ticket.resolution
              .replace(/\\n/g, ' ')
              .replace(/\\r/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
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
  }, [tickets, generateLearningEntryFromTicket]);

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
