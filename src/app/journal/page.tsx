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
  const generateLearningEntryFromTicket = useCallback((text: string, ticket: Ticket): string | null => {
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
    
    // Identify the affected system/software/hardware
    function identifyAffectedSystem(text: string, specificIssue: string): string {
      const lowercaseText = text.toLowerCase();
      
      // Determine if this is a hardware or software issue
      const isHardwareIssue = specificIssue.includes('hardware') || 
                             specificIssue.includes('device') || 
                             specificIssue.includes('monitor') || 
                             specificIssue.includes('keyboard') || 
                             specificIssue.includes('mouse') || 
                             specificIssue.includes('camera') || 
                             specificIssue.includes('printer') || 
                             specificIssue.includes('audio');
      
      // Check for specific software systems - only return these for non-hardware issues
      if (!isHardwareIssue) {
        if (lowercaseText.includes('outlook')) return 'Microsoft Outlook';
        if (lowercaseText.includes('teams')) return 'Microsoft Teams';
        if (lowercaseText.includes('zoom')) return 'Zoom';
        if (lowercaseText.includes('office') || lowercaseText.includes('word') || 
            lowercaseText.includes('excel') || lowercaseText.includes('powerpoint')) return 'Microsoft Office';
        if (lowercaseText.includes('chrome')) return 'Google Chrome';
        if (lowercaseText.includes('firefox')) return 'Firefox';
        if (lowercaseText.includes('edge')) return 'Microsoft Edge';
        if (lowercaseText.includes('adobe') || lowercaseText.includes('pdf')) return 'Adobe software';
        if (lowercaseText.includes('vpn')) return 'VPN client';
        if (lowercaseText.includes('sharepoint')) return 'SharePoint';
        if (lowercaseText.includes('onedrive')) return 'OneDrive';
        if (lowercaseText.includes('windows')) return 'Windows OS';
        if (lowercaseText.includes('mac') || lowercaseText.includes('macos')) return 'macOS';
        if (lowercaseText.includes('linux') || lowercaseText.includes('ubuntu')) return 'Linux OS';
      }
      
      // Check for specific hardware - only return these for hardware issues
      if (isHardwareIssue) {
        if (lowercaseText.includes('dell')) return 'Dell hardware';
        if (lowercaseText.includes('hp')) return 'HP hardware';
        if (lowercaseText.includes('lenovo')) return 'Lenovo hardware';
        if (lowercaseText.includes('apple') || lowercaseText.includes('macbook')) return 'Apple hardware';
        if (lowercaseText.includes('logitech')) return 'Logitech peripherals';
        if (lowercaseText.includes('cisco')) return 'Cisco networking equipment';
        
        // Generic hardware types
        if (lowercaseText.includes('laptop')) return 'laptop';
        if (lowercaseText.includes('desktop')) return 'desktop computer';
        if (lowercaseText.includes('monitor')) return 'monitor';
        if (lowercaseText.includes('printer')) return 'printer';
        if (lowercaseText.includes('keyboard')) return 'keyboard';
        if (lowercaseText.includes('mouse')) return 'mouse';
        if (lowercaseText.includes('headset') || lowercaseText.includes('headphone')) return 'audio headset';
        if (lowercaseText.includes('camera') || lowercaseText.includes('webcam')) return 'webcam';
        if (lowercaseText.includes('microphone')) return 'microphone';
        if (lowercaseText.includes('speaker')) return 'speakers';
      }
      
      // Generic software types - only for non-hardware issues
      if (!isHardwareIssue) {
        if (lowercaseText.includes('browser')) return 'web browser';
        if (lowercaseText.includes('email')) return 'email client';
        if (lowercaseText.includes('antivirus')) return 'antivirus software';
        if (lowercaseText.includes('database')) return 'database system';
        
        // Network systems
        if (lowercaseText.includes('wifi') || lowercaseText.includes('wireless')) return 'wireless network';
        if (lowercaseText.includes('ethernet') || lowercaseText.includes('lan')) return 'wired network';
        if (lowercaseText.includes('router')) return 'network router';
        if (lowercaseText.includes('server')) return 'server';
      }
      
      // Default based on issue type
      if (specificIssue.includes('email')) return 'email system';
      if (specificIssue.includes('network')) return 'network infrastructure';
      if (specificIssue.includes('vpn')) return 'VPN service';
      if (specificIssue.includes('video')) return 'video conferencing system';
      if (specificIssue.includes('printer') && isHardwareIssue) return 'printer hardware';
      if (specificIssue.includes('authentication')) return 'authentication system';
      
      return '';
    }
    
    // Summarize the issue
    function summarizeIssue(text: string, specificIssue: string): string {
      const lowercaseText = text.toLowerCase();
      
      // Extract key details
      let summary = '';
      
      // Check for specific hardware components that failed
      if (lowercaseText.includes('hard drive') || lowercaseText.includes('hdd') || lowercaseText.includes('ssd')) {
        summary += 'with storage drive failure ';
      } else if (lowercaseText.includes('ram') || lowercaseText.includes('memory')) {
        summary += 'with memory module malfunction ';
      } else if (lowercaseText.includes('motherboard')) {
        summary += 'with motherboard failure ';
      } else if (lowercaseText.includes('power supply') || lowercaseText.includes('psu')) {
        summary += 'with power supply unit failure ';
      } else if (lowercaseText.includes('cpu') || lowercaseText.includes('processor')) {
        summary += 'with processor malfunction ';
      } else if (lowercaseText.includes('graphics card') || lowercaseText.includes('gpu')) {
        summary += 'with graphics processing unit failure ';
      } else if (lowercaseText.includes('fan')) {
        summary += 'with cooling fan malfunction ';
      } else if (lowercaseText.includes('battery')) {
        summary += 'with battery degradation or failure ';
      }
      
      // Check for specific software components that failed
      if (lowercaseText.includes('driver')) {
        summary += 'with device driver corruption or incompatibility ';
      } else if (lowercaseText.includes('registry')) {
        summary += 'with Windows registry corruption ';
      } else if (lowercaseText.includes('dll')) {
        summary += 'with missing or corrupted DLL files ';
      } else if (lowercaseText.includes('service')) {
        summary += 'with system service failure ';
      } else if (lowercaseText.includes('update') || lowercaseText.includes('patch')) {
        summary += 'after failed or incomplete system update ';
      }
      
      // Check for error messages
      const errorMatch = text.match(/error:?\s+([^\.]+)/i) || text.match(/message:?\s+([^\.]+)/i);
      if (errorMatch && errorMatch[1]) {
        summary += `displaying specific error "${errorMatch[1].trim()}" `;
      }
      
      // Check for timing of issue
      if (lowercaseText.includes('after update') || lowercaseText.includes('after upgrading')) {
        summary += 'following a recent system update ';
      } else if (lowercaseText.includes('suddenly') || lowercaseText.includes('unexpectedly')) {
        summary += 'that suddenly ceased functioning ';
      } else if (lowercaseText.includes('intermittent')) {
        summary += 'with intermittent functionality problems ';
      } else if (lowercaseText.includes('slow') || lowercaseText.includes('performance')) {
        summary += 'exhibiting significant performance degradation ';
      }
      
      // Check for specific symptoms
      if (lowercaseText.includes('blue screen') || lowercaseText.includes('bsod')) {
        summary += 'triggering system-level blue screen errors ';
      } else if (lowercaseText.includes('freeze') || lowercaseText.includes('freezing')) {
        summary += 'causing complete system freezes requiring hard reboot ';
      } else if (lowercaseText.includes('crash') || lowercaseText.includes('crashing')) {
        summary += 'leading to application termination without warning ';
      } else if (lowercaseText.includes('not responding')) {
        summary += 'becoming completely unresponsive to user input ';
      } else if (lowercaseText.includes('not connecting') || lowercaseText.includes('cannot connect')) {
        summary += 'failing to establish required network connections ';
      } else if (lowercaseText.includes('missing file') || lowercaseText.includes('file not found')) {
        summary += 'reporting critical missing system or application files ';
      } else if (lowercaseText.includes('corrupt') || lowercaseText.includes('damaged')) {
        summary += 'with corrupted data structures or configuration files ';
      } else if (lowercaseText.includes('login failed') || lowercaseText.includes('password incorrect')) {
        summary += 'rejecting valid authentication credentials ';
      } else if (lowercaseText.includes('no sound') || lowercaseText.includes('audio not working')) {
        summary += 'with completely non-functional audio output ';
      } else if (lowercaseText.includes('no display') || lowercaseText.includes('black screen')) {
        summary += 'failing to produce any visual output on the display ';
      } else if (lowercaseText.includes('overheating') || lowercaseText.includes('too hot')) {
        summary += 'reaching unsafe operating temperatures causing shutdowns ';
      }
      
      // Extract more specific details based on the issue type
      if (specificIssue.includes('email')) {
        if (lowercaseText.includes('cannot send')) {
          summary += 'preventing outbound email transmission despite network connectivity ';
        } else if (lowercaseText.includes('cannot receive')) {
          summary += 'failing to retrieve incoming messages from mail server ';
        } else if (lowercaseText.includes('attachment')) {
          summary += 'corrupting or blocking email attachments ';
        } else if (lowercaseText.includes('sync')) {
          summary += 'failing to synchronize mailbox content with server ';
        } else if (lowercaseText.includes('outlook.pst') || lowercaseText.includes('data file')) {
          summary += 'with corrupted PST/OST data files ';
        } else if (lowercaseText.includes('profile')) {
          summary += 'with damaged Outlook profile configuration ';
        }
      } else if (specificIssue.includes('network')) {
        if (lowercaseText.includes('slow connection')) {
          summary += 'with severely degraded network throughput ';
        } else if (lowercaseText.includes('dropping')) {
          summary += 'experiencing frequent connection termination ';
        } else if (lowercaseText.includes('limited access')) {
          summary += 'establishing only partial network connectivity ';
        } else if (lowercaseText.includes('dns')) {
          summary += 'failing to resolve domain names correctly ';
        } else if (lowercaseText.includes('ip address')) {
          summary += 'with IP address configuration errors ';
        } else if (lowercaseText.includes('gateway')) {
          summary += 'unable to communicate with network gateway ';
        }
      } else if (specificIssue.includes('printer')) {
        if (lowercaseText.includes('paper jam')) {
          summary += 'with mechanical paper feed mechanism failures ';
        } else if (lowercaseText.includes('quality')) {
          summary += 'producing streaked or faded printouts ';
        } else if (lowercaseText.includes('offline')) {
          summary += 'failing to maintain connection with print server ';
        } else if (lowercaseText.includes('cartridge')) {
          summary += 'reporting ink/toner cartridge errors ';
        } else if (lowercaseText.includes('driver')) {
          summary += 'with incompatible or corrupted printer drivers ';
        } else if (lowercaseText.includes('spooler')) {
          summary += 'with print spooler service failures ';
        }
      } else if (specificIssue.includes('hardware')) {
        if (lowercaseText.includes('fan')) {
          summary += 'with cooling fan bearing or motor failure ';
        } else if (lowercaseText.includes('keyboard key')) {
          summary += 'with specific keyboard key mechanical failures ';
        } else if (lowercaseText.includes('screen flicker')) {
          summary += 'with display panel or cable connection issues ';
        } else if (lowercaseText.includes('usb port')) {
          summary += 'with damaged USB port connections ';
        } else if (lowercaseText.includes('hinge')) {
          summary += 'with broken laptop hinge mechanism ';
        } else if (lowercaseText.includes('touchpad')) {
          summary += 'with malfunctioning touchpad sensors ';
        }
      }
      
      // If we still couldn't extract specific details, provide a more specific summary based on issue type
      if (!summary) {
        if (specificIssue.includes('failure') || specificIssue.includes('problem')) {
          summary = 'experiencing critical component failure preventing normal operation ';
        } else if (specificIssue.includes('access') || specificIssue.includes('connection')) {
          summary = 'unable to establish connection due to network interface issues ';
        } else if (specificIssue.includes('sync') || specificIssue.includes('update')) {
          summary = 'failing to synchronize data due to communication protocol errors ';
        } else if (specificIssue.includes('camera') || specificIssue.includes('video')) {
          summary = 'with malfunctioning camera sensor or video processing hardware ';
        } else if (specificIssue.includes('audio') || specificIssue.includes('sound')) {
          summary = 'with damaged audio processing hardware or driver incompatibility ';
        } else if (specificIssue.includes('print')) {
          summary = 'with print processor errors preventing job completion ';
        } else if (specificIssue.includes('login') || specificIssue.includes('authentication')) {
          summary = 'rejecting valid credentials due to corrupted user profile ';
        } else {
          // Last resort fallback
          summary = 'exhibiting functional defects that prevented normal operation ';
        }
      }
      
      return summary.trim();
    }
    
    // Extract the specific issue
    const specificIssue = extractSpecificIssue(text, ticket);
    
    // Identify the affected system
    const affectedSystem = identifyAffectedSystem(text, specificIssue);
    
    // Summarize the issue
    const issueSummary = summarizeIssue(text, specificIssue);
    
    // Create the learning entry with a summary instead of the ticket text
    let entry = `Today I learned about a technical issue involving ${specificIssue}`;
    
    // Add the affected system if identified
    if (affectedSystem) {
      entry += ` with ${affectedSystem}`;
    }
    
    // Add the issue summary
    entry += `. The system was ${issueSummary}. ${getWorkflowImpactStatement(specificIssue)}`;
    
    return entry;
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
            const content = generateLearningEntryFromTicket(cleanResolution, ticket);
            
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
    if (textToSearch.includes('graphics') || textToSearch.includes('gpu')) tags.push('graphics');
    if (textToSearch.includes('battery')) tags.push('battery');
    if (textToSearch.includes('fan') || textToSearch.includes('cooling')) tags.push('cooling');
    
    // Network components
    if (textToSearch.includes('wifi') || textToSearch.includes('wireless')) tags.push('wifi');
    if (textToSearch.includes('ethernet') || textToSearch.includes('lan')) tags.push('ethernet');
    if (textToSearch.includes('router')) tags.push('router');
    if (textToSearch.includes('server')) tags.push('server');
    if (textToSearch.includes('network') && !tags.some(t => ['wifi', 'ethernet', 'router', 'vpn'].includes(t))) {
      tags.push('network');
    }
    
    // Issue types
    if (textToSearch.includes('email') && !tags.includes('outlook')) tags.push('email');
    if (textToSearch.includes('authentication') || textToSearch.includes('login')) tags.push('authentication');
    if (textToSearch.includes('driver')) tags.push('driver');
    if (textToSearch.includes('update') || textToSearch.includes('upgrade')) tags.push('update');
    if (textToSearch.includes('virus') || textToSearch.includes('malware')) tags.push('security');
    if (textToSearch.includes('backup') || textToSearch.includes('restore')) tags.push('backup');
    if (textToSearch.includes('password')) tags.push('password');
    if (textToSearch.includes('performance') || textToSearch.includes('slow')) tags.push('performance');
    if (textToSearch.includes('crash') || textToSearch.includes('blue screen')) tags.push('crash');
    
    // Add category if available and not already covered
    if (ticket.category && !tags.includes(ticket.category.toLowerCase())) {
      tags.push(ticket.category.toLowerCase());
    }
    
    // Add subcategory if available and not already covered
    if (ticket.subcategory && !tags.includes(ticket.subcategory.toLowerCase())) {
      tags.push(ticket.subcategory.toLowerCase());
    }
    
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
