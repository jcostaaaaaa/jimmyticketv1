'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { FaRobot, FaSyncAlt, FaHistory, FaTerminal, FaDatabase, FaQuestion } from 'react-icons/fa';
import { FaComments } from 'react-icons/fa';
import { useTickets } from '@/context/TicketContext';
// Comment out this import for now until we verify it's working
// import { useConversations } from '@/context/ConversationContext';

interface QueryResponse {
  answer: string;
  relatedTickets?: number[];
  relatedConversations?: string[];
  confidence: number;
  sources?: string[];
  type: 'ticket_analysis' | 'conversation_analysis' | 'it_knowledge';
}

type QueryType = 'ticket_analysis' | 'it_knowledge' | 'conversation_analysis';

// Define interfaces for the knowledge base
interface KnowledgeItem {
  keywords: string[];
  answer: string;
  relatedItems?: number[] | string[];
  confidence: number;
  sources?: string[];
}

export default function QueryPage() {
  const { tickets } = useTickets();
  // Mock empty conversations array until we fix the context
  const conversations: { id: string; messages: Array<{ content: string }> }[] = [];
  const [query, setQuery] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('ticket_analysis');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [recentQueries, setRecentQueries] = useState<{ text: string; type: QueryType }[]>([
    { text: 'What are the most common software issues?', type: 'ticket_analysis' },
    { text: 'How many tickets were resolved in less than 4 hours?', type: 'ticket_analysis' },
    { text: 'How do I troubleshoot a VPN connection issue?', type: 'it_knowledge' }
  ]);

  // Knowledge bases for different query types
  const ticketKnowledge: Record<string, KnowledgeItem> = {
    common_issues: {
      keywords: ['common', 'frequent', 'recurring', 'typical', 'most', 'issues', 'problems', 'tickets'],
      answer: "The most common issues reported in tickets are login problems (18 tickets), application crashes (14 tickets), and slow performance (12 tickets). These three categories represent 44% of all support tickets. Email client issues account for 10% of all tickets, with Outlook being the most problematic.",
      relatedItems: [1, 5, 8, 12, 15],
      confidence: 0.92
    },
    resolution_time: {
      keywords: ['time', 'hour', 'day', 'duration', 'resolved', 'resolution', 'long', 'average', 'quick'],
      answer: "42 tickets (63%) were resolved within 4 hours. The average resolution time across all tickets is 14.3 hours, with hardware issues taking the longest to resolve at an average of 22.7 hours. Software issues are typically resolved faster, averaging 9.2 hours. Highest priority tickets have an average resolution time of 3.5 hours.",
      relatedItems: [3, 6, 9],
      confidence: 0.88
    },
    department_analysis: {
      keywords: ['department', 'team', 'group', 'division', 'organization', 'unit'],
      answer: "The Finance department has the most open tickets (7), followed by Marketing (5) and Sales (3). The Finance department also has the highest average resolution time at 18.2 hours. IT department has the fewest tickets but handles the most complex issues based on resolution time. Engineering and Product teams have the highest ticket satisfaction scores.",
      relatedItems: [2, 7, 11, 14, 18, 22],
      confidence: 0.85
    },
    priority_analysis: {
      keywords: ['priority', 'urgent', 'critical', 'important', 'severity', 'high', 'low', 'medium'],
      answer: "High priority tickets account for 15% of all tickets, with critical issues making up 5%. The average resolution time decreases with priority: critical (3.1 hours), high (6.8 hours), medium (12.4 hours), and low (22.7 hours). The Finance department has the highest number of critical tickets.",
      relatedItems: [2, 5, 8, 12],
      confidence: 0.87
    },
    software_issues: {
      keywords: ['software', 'application', 'program', 'system', 'app', 'tool'],
      answer: "Software issues account for 57% of all tickets. Microsoft Office applications are involved in 24% of these, with Outlook (10%) having the most issues. Custom internal applications account for 18% of tickets, followed by ERP systems at 15%. The average resolution time for software issues is 9.2 hours.",
      relatedItems: [1, 4, 7, 13],
      confidence: 0.83
    },
    hardware_issues: {
      keywords: ['hardware', 'device', 'equipment', 'printer', 'laptop', 'computer', 'physical'],
      answer: "Hardware-related issues make up 28% of tickets. Printer problems are the most common (35% of hardware tickets), followed by laptop/desktop issues (30%) and network hardware (20%). Hardware problems take significantly longer to resolve, averaging 22.7 hours, due to parts replacement needs.",
      relatedItems: [5, 9, 17, 23],
      confidence: 0.84
    }
  };

  const conversationKnowledge: Record<string, KnowledgeItem> = {
    sentiment_analysis: {
      keywords: ['sentiment', 'satisfaction', 'happy', 'unhappy', 'positive', 'negative', 'neutral', 'mood', 'emotion'],
      answer: "Sentiment analysis of customer conversations shows 62% positive, 25% neutral, and 13% negative sentiments. Conversations about billing show the highest negative sentiment (27%), while product support conversations are mostly positive (71%). Negative sentiment is most common at the beginning of conversations but generally improves after initial responses.",
      relatedItems: ['conv-001', 'conv-008', 'conv-015'],
      confidence: 0.88
    },
    agent_performance: {
      keywords: ['agent', 'performance', 'staff', 'employee', 'support', 'representative', 'quality', 'response'],
      answer: "Agent performance analysis shows Emma Johnson has the highest satisfaction rating (4.8/5), while the average resolution time is 8.3 minutes. The fastest issue resolution is seen in product information queries (3.2 minutes), while technical support takes longest (14.7 minutes). Agents with technical specializations resolve issues 27% faster in their domain than general agents.",
      relatedItems: ['conv-003', 'conv-012', 'conv-019'],
      confidence: 0.91
    },
    conversation_time: {
      keywords: ['time', 'duration', 'length', 'period', 'long', 'short', 'minutes', 'hours'],
      answer: "The average conversation lasts 12.4 minutes and consists of 8 messages. Technical support conversations tend to be longer (18.3 minutes on average) than billing inquiries (8.7 minutes) or product information requests (6.4 minutes). 73% of conversations are resolved within the first interaction.",
      relatedItems: ['conv-005', 'conv-011', 'conv-018'],
      confidence: 0.87
    },
    conversation_volume: {
      keywords: ['volume', 'amount', 'number', 'count', 'many', 'frequency', 'peak', 'busiest'],
      answer: "Conversation volume analysis shows peak hours between 1-3pm, with Monday being the busiest day (22% of weekly volume). The system handles an average of 347 conversations per day. Volume increases by approximately 30% during product releases or updates.",
      relatedItems: ['conv-002', 'conv-007', 'conv-014'],
      confidence: 0.85
    },
    topic_analysis: {
      keywords: ['topic', 'subject', 'category', 'type', 'about', 'discussed', 'theme'],
      answer: "The most common conversation topics are product inquiries (32%), technical support (27%), and billing questions (18%). Technical support topics show the most complexity, with an average of 12 messages per conversation. Feature requests and product feedback account for 8% of all conversations.",
      relatedItems: ['conv-004', 'conv-009', 'conv-016'],
      confidence: 0.89
    }
  };

  const itKnowledge: Record<string, KnowledgeItem> = {
    vpn_issues: {
      keywords: ['vpn', 'connect', 'connection', 'remote', 'access', 'tunnel', 'secure'],
      answer: "To troubleshoot VPN connection issues:\n\n1. Verify your internet connection is working\n2. Check that you&apos;re using the correct VPN credentials\n3. Ensure the VPN client software is up to date (check for updates)\n4. Try connecting using a different network (e.g., mobile hotspot)\n5. Disable any firewalls or antivirus software temporarily\n6. Clear the VPN client cache and reconnect\n7. Check if the VPN server is operational (contact IT for server status)\n8. Try a different VPN protocol if available\n9. Restart your computer after applying changes\n\nIf problems persist, contact your IT department with the specific error message you&apos;re receiving.",
      sources: ["IT Knowledge Base", "Cisco VPN Troubleshooting Guide", "Internal Documentation"],
      confidence: 0.95
    },
    password_reset: {
      keywords: ['password', 'reset', 'forgot', 'change', 'login', 'credentials', 'account', 'access'],
      answer: "To reset your password:\n\n1. Visit the company password portal at password.company.com\n2. Click on &apos;Forgot Password&apos;\n3. Enter your employee ID or email address\n4. Check your email for a password reset link (check spam/junk folders if not received)\n5. Follow the link within 30 minutes, as reset links expire\n6. Create a new password that meets the following requirements:\n   - At least 12 characters\n   - Contains uppercase and lowercase letters\n   - Contains at least one number and one special character\n   - Cannot be similar to your previous 5 passwords\n   - Should not contain your username or full name\n\nIf you don&apos;t receive a reset email within 10 minutes, contact the IT helpdesk at extension 4357 or helpdesk@company.com.",
      sources: ["IT Security Policy", "Password Management Guidelines", "Company Intranet"],
      confidence: 0.97
    },
    printer_issues: {
      keywords: ['printer', 'print', 'printing', 'scanner', 'scan', 'copy', 'paper', 'ink', 'toner', 'jam'],
      answer: "To troubleshoot printer issues:\n\n1. Check physical connections and ensure the printer is powered on\n2. Verify the printer has paper and no paper jams\n3. Check ink or toner levels in the printer settings or control panel\n4. Restart the printer and wait for it to fully initialize\n5. On your computer, open the printer queue and clear any stuck jobs\n6. Try printing a test page from the printer&apos;s control panel\n7. Reinstall or update the printer driver\n8. Verify you&apos;re connected to the correct network if using a network printer\n9. If using wireless printing, ensure your device is connected to the same network\n10. For scanning issues, make sure the scanner glass is clean\n\nFor specific printer models or persistent issues, consult your IT department&apos;s printer documentation or contact the helpdesk.",
      sources: ["Printer Troubleshooting Guide", "HP Support Documentation", "IT Support Handbook"],
      confidence: 0.92
    },
    email_issues: {
      keywords: ['email', 'outlook', 'mail', 'exchange', 'message', 'send', 'receive', 'inbox', 'attachment'],
      answer: "To resolve common email issues:\n\n1. Check your internet connection\n2. Verify that you have sufficient inbox space (storage quota)\n3. For sending problems:\n   - Check if the recipient&apos;s email address is correct\n   - Ensure attachments don&apos;t exceed size limits (usually 25MB)\n   - Verify your outgoing mail server (SMTP) settings\n\n4. For receiving problems:\n   - Check your spam/junk folder\n   - Make sure email filters aren&apos;t blocking messages\n   - Verify incoming mail server settings\n\n5. If using Outlook:\n   - Restart Outlook in safe mode (hold CTRL while opening)\n   - Run Outlook&apos;s repair tool (from Control Panel > Programs)\n   - Check for updates\n   - Delete corrupt items from OST/PST files\n\n6. General fixes:\n   - Clear email cache and restart the application\n   - Test from webmail to determine if it&apos;s a client or server issue\n   - Restart your device\n\nFor persistent issues, contact IT support with specific error messages.",
      sources: ["Microsoft Outlook Support", "Exchange Server Guidelines", "Email Troubleshooting Handbook"],
      confidence: 0.93
    },
    network_connectivity: {
      keywords: ['network', 'internet', 'wifi', 'connection', 'ethernet', 'lan', 'wireless', 'router', 'connected'],
      answer: "To troubleshoot network connectivity issues:\n\n1. Check physical connections (if applicable):\n   - Ensure Ethernet cables are securely connected\n   - Verify that network adapters are enabled\n\n2. For Wi-Fi issues:\n   - Confirm Wi-Fi is turned on (check physical switch if laptop has one)\n   - Verify you&apos;re connecting to the correct network\n   - Check signal strength - move closer to the access point if needed\n   - Forget the network and reconnect with correct credentials\n\n3. General troubleshooting:\n   - Restart your device\n   - Restart your router/modem (unplug for 30 seconds, then reconnect)\n   - Check if other devices can connect to the same network\n   - Run Windows Network Diagnostics (right-click on network icon)\n   - Use &apos;ipconfig /release&apos; followed by &apos;ipconfig /renew&apos; in Command Prompt\n\n4. Check for IP address conflicts or DHCP issues\n5. Verify proxy settings are correct if your organization uses them\n6. Test basic connectivity with &apos;ping 8.8.8.8&apos; in Command Prompt\n\nIf problems persist, contact your network administrator with details of troubleshooting steps already taken.",
      sources: ["Network Troubleshooting Guide", "Company Network Policy", "Wi-Fi Best Practices"],
      confidence: 0.94
    },
    software_installation: {
      keywords: ['install', 'installation', 'software', 'program', 'application', 'download', 'update', 'upgrade'],
      answer: "Guidelines for software installation on company devices:\n\n1. Approved software:\n   - Check the company software portal for pre-approved applications\n   - Request approval for non-standard software through the IT portal\n\n2. Installation instructions:\n   - Download only from official sources or company repositories\n   - Run installation as a standard user (not administrator) when possible\n   - Accept default installation directories unless specified otherwise\n   - Close all other applications before installing new software\n\n3. Common installation issues:\n   - Insufficient permissions: Request elevated privileges if needed\n   - Inadequate disk space: Clean unnecessary files or request storage upgrade\n   - Compatibility issues: Check system requirements before installation\n   - Installation freezes: Try restarting and running as administrator\n\n4. After installation:\n   - Restart your computer to complete the setup\n   - Configure application settings according to company policies\n   - Run software updates if available\n\nFor automated software deployment or assistance with complex installations, contact the IT department through the service portal.",
      sources: ["Software Management Policy", "IT Best Practices", "Company Software Catalog"],
      confidence: 0.91
    }
  };

  // Function to find the most relevant response based on query and type
  const findBestResponse = (userQuery: string, type: QueryType): QueryResponse => {
    const normalizedQuery = userQuery.toLowerCase();
    let knowledgeBase: Record<string, KnowledgeItem>;
    
    // Select the appropriate knowledge base based on query type
    if (type === 'ticket_analysis') {
      knowledgeBase = ticketKnowledge;
    } else if (type === 'conversation_analysis') {
      knowledgeBase = conversationKnowledge;
    } else {
      knowledgeBase = itKnowledge;
    }
    
    // Calculate relevance scores for each knowledge item
    const scores: {id: string; score: number; item: KnowledgeItem}[] = [];
    
    for (const id in knowledgeBase) {
      const item = knowledgeBase[id];
      // Count keyword matches
      const matchCount = item.keywords.reduce((count, keyword) => {
        return normalizedQuery.includes(keyword) ? count + 1 : count;
      }, 0);
      
      // Calculate relevance score (number of matches / total keywords * confidence)
      const keywordRatio = matchCount / item.keywords.length;
      const score = keywordRatio * item.confidence * (matchCount > 0 ? 1 : 0.1);
      
      scores.push({ id, score, item });
    }
    
    // Sort by score and get the best match
    scores.sort((a, b) => b.score - a.score);
    const bestMatch = scores[0];
    
    // If score is too low, return default response
    if (bestMatch.score < 0.1) {
      return {
        answer: type === 'it_knowledge' 
          ? "Based on your question, I'll provide some general IT assistance. If this doesn't fully address your concern, please feel free to ask a more specific question.\n\nCommon IT troubleshooting steps include:\n\n1. Restart your device - This resolves many temporary issues\n2. Check all physical connections\n3. Verify network connectivity\n4. Clear browser cache and cookies\n5. Update software/drivers to the latest version\n6. Run built-in diagnostics tools\n7. Check system/application logs for error messages\n\nFor more specific help, try asking about common issues like printer problems, email configuration, network connectivity, or password resets."
          : type === 'conversation_analysis'
            ? "I couldn't find specific information about that in our conversation data. Our analysis can provide insights on customer sentiment, agent performance, conversation length, resolution rates, and common topics. Try asking about one of these specific areas for more detailed information."
            : "I couldn't find specific information about that in our ticket data. Our analysis can provide insights on common issues, resolution times, department workloads, priority distribution, and trending problems. Try asking about one of these specific areas for more detailed information.",
        confidence: 0.5,
        type: type
      };
    }
    
    // Format response based on query type
    if (type === 'ticket_analysis') {
      return {
        answer: bestMatch.item.answer,
        relatedTickets: bestMatch.item.relatedItems as number[] | undefined,
        confidence: bestMatch.item.confidence,
        type: 'ticket_analysis'
      };
    } else if (type === 'conversation_analysis') {
      return {
        answer: bestMatch.item.answer,
        relatedConversations: bestMatch.item.relatedItems as string[] | undefined,
        confidence: bestMatch.item.confidence,
        type: 'conversation_analysis'
      };
    } else {
      return {
        answer: bestMatch.item.answer,
        sources: bestMatch.item.sources,
        confidence: bestMatch.item.confidence,
        type: 'it_knowledge'
      };
    }
  };

  // Update to reset response when query changes
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Reset response when user starts typing a new query
    if (response) {
      setResponse(null);
    }
    setQuery(e.target.value);
  };

  // Update to reset response when query type changes
  const handleQueryTypeChange = (type: QueryType) => {
    setQueryType(type);
    // Reset response when switching query types
    setResponse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Clear previous response immediately when submitting new query
    setResponse(null);
    setIsLoading(true);
    
    try {
      // In a real app, this would call your API with machine learning model
      // Here we'll simulate a response for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Check if there's data available
      if (queryType === 'ticket_analysis' && tickets.length === 0) {
        setResponse({
          answer: "No ticket data available. Please import ticket data from the Import page first.",
          confidence: 1.0,
          type: 'ticket_analysis'
        });
        setIsLoading(false);
        return;
      } else if (queryType === 'conversation_analysis' && conversations.length === 0) {
        setResponse({
          answer: "No conversation data available. Please import conversation history from the Import page first.",
          confidence: 1.0,
          type: 'conversation_analysis'
        });
        setIsLoading(false);
        return;
      }
      
      // Find the best response from our knowledge base
      const bestResponse = findBestResponse(query, queryType);
      setResponse(bestResponse);
      
      // Add to recent queries if not already present
      if (!recentQueries.some(rq => rq.text.toLowerCase() === query.toLowerCase())) {
        setRecentQueries(prev => [{text: query, type: queryType}, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error("Error processing query:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuery = (suggestedQuery: string, type: QueryType) => {
    // Reset response when selecting a suggested query
    setResponse(null);
    setQuery(suggestedQuery);
    setQueryType(type);
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#E0E0E0]">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8 text-[#E0E0E0]">Ask AI Assistant</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-md border border-[#3C3C3C] mb-6">
              {/* Query type selector */}
              <div className="flex flex-wrap gap-2 mb-4">
                <button
                  className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md flex items-center text-sm sm:text-base ${
                    queryType === 'ticket_analysis' 
                      ? 'bg-[#E69500] text-[#E0E0E0]' 
                      : 'bg-[#3C3C3C] hover:bg-[#4C4C4C] text-[#E0E0E0]'
                  }`}
                  onClick={() => handleQueryTypeChange('ticket_analysis')}
                >
                  <FaDatabase className="mr-2" />
                  Ticket Analysis
                </button>
                <button
                  className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md flex items-center text-sm sm:text-base ${
                    queryType === 'conversation_analysis' 
                      ? 'bg-[#E69500] text-[#E0E0E0]' 
                      : 'bg-[#3C3C3C] hover:bg-[#4C4C4C] text-[#E0E0E0]'
                  }`}
                  onClick={() => handleQueryTypeChange('conversation_analysis')}
                >
                  <FaComments className="mr-2" />
                  Conversation Analysis
                </button>
                <button
                  className={`px-2 py-1 sm:px-3 sm:py-2 rounded-md flex items-center text-sm sm:text-base ${
                    queryType === 'it_knowledge' 
                      ? 'bg-[#E69500] text-[#E0E0E0]' 
                      : 'bg-[#3C3C3C] hover:bg-[#4C4C4C] text-[#E0E0E0]'
                  }`}
                  onClick={() => handleQueryTypeChange('it_knowledge')}
                >
                  <FaQuestion className="mr-2" />
                  IT Knowledge
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="flex flex-wrap sm:flex-nowrap items-center bg-[#1A1A1A] rounded-lg p-2 border border-[#3C3C3C]">
                  <FaTerminal className="text-[#FFA500] ml-2 mr-3" />
                  <input
                    type="text"
                    value={query}
                    onChange={handleQueryChange}
                    placeholder={
                      queryType === 'ticket_analysis' 
                        ? "Ask a question about your ticket data..." 
                        : queryType === 'conversation_analysis'
                          ? "Ask a question about your conversation data..."
                          : "Ask a general IT support question..."
                    }
                    className="w-full sm:flex-1 bg-transparent border-none focus:outline-none py-2 text-[#E0E0E0] placeholder-gray-500 text-sm sm:text-base"
                  />
                  <button
                    type="submit"
                    disabled={isLoading || !query.trim()}
                    className={`mt-2 sm:mt-0 sm:ml-2 px-3 py-1 sm:px-4 sm:py-2 rounded-md w-full sm:w-auto ${
                      isLoading || !query.trim() 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : 'bg-[#E69500] hover:bg-[#FFA500] text-[#E0E0E0]'
                    }`}
                  >
                    {isLoading ? (
                      <FaSyncAlt className="animate-spin" />
                    ) : (
                      'Ask'
                    )}
                  </button>
                </div>
                
                <div className="mt-2 text-xs text-gray-400">
                  {queryType === 'ticket_analysis' && (
                    <span>Analyze patterns, resolution times, categories, and more from your ticket data</span>
                  )}
                  {queryType === 'conversation_analysis' && (
                    <span>Analyze sentiment, agent performance, and patterns from customer conversations</span>
                  )}
                  {queryType === 'it_knowledge' && (
                    <span>Ask about troubleshooting, best practices, and general IT knowledge</span>
                  )}
                </div>
              </form>
            </div>
            
            {/* Response Area */}
            {response && (
              <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-md border border-[#3C3C3C] mb-6">
                <div className="flex items-start">
                  <div className={`p-2 mr-4 rounded-full ${
                    response.type === 'ticket_analysis' 
                      ? 'bg-[#3C3C3C] text-[#FFA500]' 
                      : response.type === 'conversation_analysis'
                        ? 'bg-[#3C3C3C] text-[#FFA500]'
                        : 'bg-[#3C3C3C] text-[#FFA500]'
                  }`}>
                    {response.type === 'ticket_analysis' && <FaDatabase className="text-xl" />}
                    {response.type === 'conversation_analysis' && <FaComments className="text-xl" />}
                    {response.type === 'it_knowledge' && <FaQuestion className="text-xl" />}
                  </div>
                  <div className="flex-1">
                    <div className="whitespace-pre-line text-[#E0E0E0]" dangerouslySetInnerHTML={{ __html: response.answer.replace(/&apos;/g, "'") }}>
                    </div>
                    
                    {response.sources && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-[#E0E0E0]">Sources:</p>
                        <ul className="mt-1 space-y-1">
                          {response.sources.map((source, index) => (
                            <li key={index} className="text-sm text-gray-400 flex items-center">
                              <span className="w-2 h-2 bg-[#FFA500] rounded-full mr-2"></span>
                              {source}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {response.relatedTickets && response.relatedTickets.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-[#E0E0E0]">Related Tickets:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {response.relatedTickets.map((ticketId) => (
                            <span key={ticketId} className="px-2 py-1 bg-[#3C3C3C] text-[#FFA500] text-xs rounded-md">
                              Ticket #{ticketId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {response.relatedConversations && response.relatedConversations.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-[#E0E0E0]">Related Conversations:</p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {response.relatedConversations.map((convId) => (
                            <span key={convId} className="px-2 py-1 bg-[#3C3C3C] text-[#FFA500] text-xs rounded-md">
                              {convId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-xs text-gray-400">
                        Confidence: {Math.round(response.confidence * 100)}%
                      </div>
                      <button className="text-[#FFA500] hover:text-[#E69500] text-sm">
                        Feedback
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Sidebar */}
          <div className="md:col-span-1">
            <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-md border border-[#3C3C3C] mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-[#E0E0E0]">
                <FaHistory className="mr-2 text-[#FFA500]" />
                Recent Queries
              </h2>
              <ul className="space-y-3">
                {recentQueries.map((rq, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleSuggestedQuery(rq.text, rq.type)}
                      className="text-left w-full p-2 hover:bg-[#3C3C3C] rounded text-[#E0E0E0] flex items-start transition-colors"
                    >
                      <span 
                        className={`mr-2 mt-1 text-[#FFA500]`}
                      >
                        {rq.type === 'ticket_analysis' && <FaDatabase />}
                        {rq.type === 'conversation_analysis' && <FaComments />}
                        {rq.type === 'it_knowledge' && <FaQuestion />}
                      </span>
                      <span>{rq.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-md border border-[#3C3C3C]">
              <h2 className="text-lg font-semibold mb-4 flex items-center text-[#E0E0E0]">
                <FaRobot className="mr-2 text-[#FFA500]" />
                Suggested Queries
              </h2>
              <ul className="space-y-3">
                <li>
                  <button
                    onClick={() => handleSuggestedQuery("What are the most common categories of tickets?", 'ticket_analysis')}
                    className="text-left w-full p-2 hover:bg-[#3C3C3C] rounded text-[#E0E0E0] flex items-start transition-colors"
                  >
                    <span className="text-[#FFA500] mr-2 mt-1"><FaDatabase /></span>
                    <span>What are the most common categories of tickets?</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSuggestedQuery("What is the sentiment trend in customer conversations?", 'conversation_analysis')}
                    className="text-left w-full p-2 hover:bg-[#3C3C3C] rounded text-[#E0E0E0] flex items-start transition-colors"
                  >
                    <span className="text-[#FFA500] mr-2 mt-1"><FaComments /></span>
                    <span>What is the sentiment trend in customer conversations?</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSuggestedQuery("How do I fix Outlook when it&apos;s not syncing emails?", 'it_knowledge')}
                    className="text-left w-full p-2 hover:bg-[#3C3C3C] rounded text-[#E0E0E0] flex items-start transition-colors"
                  >
                    <span className="text-[#FFA500] mr-2 mt-1"><FaQuestion /></span>
                    <span>How do I fix Outlook when it&apos;s not syncing emails?</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSuggestedQuery("What is the average ticket resolution time by department?", 'ticket_analysis')}
                    className="text-left w-full p-2 hover:bg-[#3C3C3C] rounded text-[#E0E0E0] flex items-start transition-colors"
                  >
                    <span className="text-[#FFA500] mr-2 mt-1"><FaDatabase /></span>
                    <span>What is the average ticket resolution time by department?</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => handleSuggestedQuery("How do I resolve network connectivity issues?", 'it_knowledge')}
                    className="text-left w-full p-2 hover:bg-[#3C3C3C] rounded text-[#E0E0E0] flex items-start transition-colors"
                  >
                    <span className="text-[#FFA500] mr-2 mt-1"><FaQuestion /></span>
                    <span>How do I resolve network connectivity issues?</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-[#1A1A1A] border-t border-[#3C3C3C] py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#E0E0E0]">Jimmy Ticket Analyzer v27 &copy; 2025</p>
        </div>
      </footer>
    </div>
  );
} 