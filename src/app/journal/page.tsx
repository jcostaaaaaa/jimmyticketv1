'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaPlus } from 'react-icons/fa';
import { useTickets } from '@/context/TicketContext';

interface JournalEntry {
  id: string;
  date: string;
  content: string;
  tags: string[];
}

export default function JournalPage() {
  const router = useRouter();
  const { tickets } = useTickets();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntry, setNewEntry] = useState('');
  const [newTags, setNewTags] = useState('');
  const [isAddingEntry, setIsAddingEntry] = useState(false);

  // Load entries from localStorage on component mount
  useEffect(() => {
    const storedEntries = localStorage.getItem('learningJournal');
    if (storedEntries) {
      setEntries(JSON.parse(storedEntries));
    } else {
      // Initialize with default entries if none exist
      const defaultEntries: JournalEntry[] = [
        {
          id: '1',
          date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          content: "Today I learned about ports and protocols. These are essentials for ensuring data sent between devices is in a consistent format that allows any devices to communicate quickly and without error.",
          tags: ['networking', 'protocols']
        },
        {
          id: '2',
          date: new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          content: "Today I learned about the importance of consistent ticket categorization. When tickets are properly categorized, it becomes much easier to identify trends and recurring issues, which helps in proactive problem management.",
          tags: ['ticketing', 'categorization']
        }
      ];
      setEntries(defaultEntries);
      localStorage.setItem('learningJournal', JSON.stringify(defaultEntries));
    }

    // Analyze tickets for potential learning opportunities
    if (tickets.length > 0) {
      const uniqueIssues = new Set<string>();
      
      // Extract unique issues from problem descriptions and resolutions
      tickets.forEach(ticket => {
        if (ticket.description && typeof ticket.description === 'string' && ticket.description.length > 20) {
          uniqueIssues.add(ticket.description);
        }
        
        if (ticket.resolution && typeof ticket.resolution === 'string' && ticket.resolution.length > 20) {
          uniqueIssues.add(ticket.resolution);
        }
      });
      
      // Generate learning entries from unique issues
      const storedIssueHashes = JSON.parse(localStorage.getItem('processedIssueHashes') || '[]');
      const newEntries: JournalEntry[] = [];
      
      uniqueIssues.forEach(issue => {
        // Create a simple hash of the issue to avoid duplicates
        const issueHash = btoa(issue.substring(0, 50)).replace(/=/g, '');
        
        if (!storedIssueHashes.includes(issueHash)) {
          // Generate a learning entry
          const learningEntry = generateLearningEntry(issue);
          if (learningEntry) {
            newEntries.push({
              id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
              date: new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              }),
              content: learningEntry,
              tags: extractTags(issue)
            });
            
            // Add to processed hashes
            storedIssueHashes.push(issueHash);
          }
        }
      });
      
      if (newEntries.length > 0) {
        // Update entries with new ones
        const updatedEntries = [...entries, ...newEntries];
        setEntries(updatedEntries);
        localStorage.setItem('learningJournal', JSON.stringify(updatedEntries));
        localStorage.setItem('processedIssueHashes', JSON.stringify(storedIssueHashes));
      }
    }
  }, [tickets]);

  const handleAddEntry = () => {
    if (newEntry.trim() === '') return;
    
    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      content: newEntry.startsWith("Today I learned") ? newEntry : `Today I learned ${newEntry}`,
      tags: newTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
    };
    
    const updatedEntries = [...entries, entry];
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

  // Helper function to generate a learning entry from an issue
  function generateLearningEntry(issue: string): string | null {
    // Skip if issue is too short
    if (issue.length < 30) return null;
    
    // Extract key technical terms
    const technicalTerms = [
      'network', 'server', 'database', 'security', 'authentication', 
      'authorization', 'encryption', 'firewall', 'VPN', 'DNS', 'DHCP',
      'API', 'REST', 'SOAP', 'JSON', 'XML', 'HTTP', 'HTTPS', 'SSL', 'TLS',
      'SQL', 'NoSQL', 'MongoDB', 'PostgreSQL', 'MySQL', 'Oracle',
      'Windows', 'Linux', 'macOS', 'Unix', 'Ubuntu', 'CentOS', 'Debian',
      'cloud', 'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'container',
      'virtualization', 'VM', 'hypervisor', 'microservice', 'serverless',
      'backup', 'recovery', 'disaster', 'redundancy', 'high availability',
      'load balancing', 'scaling', 'monitoring', 'logging', 'alerting',
      'incident', 'problem', 'change', 'release', 'deployment', 'CI/CD',
      'DevOps', 'SRE', 'ITIL', 'ServiceNow', 'Jira', 'ticketing'
    ];
    
    // Find technical terms in the issue
    const foundTerms = technicalTerms.filter(term => 
      issue.toLowerCase().includes(term.toLowerCase())
    );
    
    if (foundTerms.length === 0) return null;
    
    // Generate a learning entry based on the found terms
    const term = foundTerms[Math.floor(Math.random() * foundTerms.length)];
    
    // Different templates for learning entries
    const templates = [
      `Today I learned about ${term} and its importance in IT infrastructure. Understanding ${term} helps in diagnosing and resolving issues more efficiently.`,
      `Today I learned how ${term} plays a critical role in system stability. Proper configuration of ${term} can prevent many common issues.`,
      `Today I learned that ${term} requires regular maintenance and monitoring. Neglecting ${term} can lead to unexpected downtime and service degradation.`,
      `Today I learned the best practices for managing ${term} in enterprise environments. Implementing these practices can significantly reduce incident frequency.`,
      `Today I learned about common misconceptions regarding ${term}. Having a clear understanding helps in troubleshooting related issues more effectively.`
    ];
    
    return templates[Math.floor(Math.random() * templates.length)];
  }

  // Helper function to extract tags from an issue
  function extractTags(issue: string): string[] {
    const commonTags = [
      'networking', 'security', 'hardware', 'software', 'database',
      'cloud', 'authentication', 'performance', 'storage', 'backup',
      'monitoring', 'configuration', 'deployment', 'integration'
    ];
    
    return commonTags.filter(tag => 
      issue.toLowerCase().includes(tag.toLowerCase())
    ).slice(0, 3); // Limit to 3 tags
  }

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
        
        <div className="space-y-6">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-3">
                <span className="text-sm text-gray-500">{entry.date}</span>
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
                  <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-md">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
