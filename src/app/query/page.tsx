'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { FaSearch, FaRobot, FaSyncAlt, FaHistory, FaTerminal, FaBrain, FaServer, FaRegClock } from 'react-icons/fa';

interface QueryResponse {
  answer: string;
  relatedTickets?: number[];
  confidence: number;
}

export default function QueryPage() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([
    'What are the most common software issues?',
    'How many tickets were resolved in less than 4 hours?',
    'Which department has the most open tickets?'
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, this would call your API with machine learning model
      // Here we'll simulate a response for demo purposes
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock responses based on query content
      let mockResponse: QueryResponse;
      
      if (query.toLowerCase().includes('common') || query.toLowerCase().includes('frequent')) {
        mockResponse = {
          answer: "The most common issues reported in tickets are login problems (18 tickets), application crashes (14 tickets), and slow performance (12 tickets). These three categories represent 44% of all support tickets.",
          relatedTickets: [1, 5, 8, 12, 15],
          confidence: 0.92
        };
      } else if (query.toLowerCase().includes('time') || query.toLowerCase().includes('hour')) {
        mockResponse = {
          answer: "42 tickets (63%) were resolved within 4 hours. The average resolution time across all tickets is 14.3 hours, with hardware issues taking the longest to resolve at an average of 22.7 hours.",
          relatedTickets: [3, 6, 9],
          confidence: 0.88
        };
      } else if (query.toLowerCase().includes('department') || query.toLowerCase().includes('team')) {
        mockResponse = {
          answer: "The Sales department has the most open tickets (7), followed by Marketing (5) and Finance (4). The IT department itself has only 2 open internal tickets.",
          relatedTickets: [4, 7],
          confidence: 0.85
        };
      } else {
        mockResponse = {
          answer: "Based on the analyzed ticket data, I found that most issues are software-related (57%), with Microsoft Office and Email being the most problematic applications. Average resolution time is 14.3 hours, and 75% of tickets are successfully resolved on first contact.",
          confidence: 0.78
        };
      }
      
      setResponse(mockResponse);
      
      // Add to recent queries if not already there
      if (!recentQueries.includes(query)) {
        setRecentQueries(prev => [query, ...prev].slice(0, 5));
      }
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuery = (suggestedQuery: string) => {
    setQuery(suggestedQuery);
    // Focus the input
    const inputElement = document.getElementById('queryInput');
    if (inputElement) {
      inputElement.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <FaBrain className="text-3xl text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">Query Ticket Data</h1>
          </div>
          
          <p className="text-lg text-slate-700 mb-8">
            Use natural language to query insights from your ServiceNow ticket data.
            Our AI has analyzed patterns and can answer questions about trends, issues, and resolutions.
          </p>
          
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-xl shadow-lg mb-8">
            <form onSubmit={handleSubmit} className="mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400">
                    <FaTerminal />
                  </div>
                  <input
                    id="queryInput"
                    type="text"
                    className="w-full p-4 pl-10 border-0 bg-slate-700 text-white rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg"
                    placeholder="e.g., What are the most common software issues?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className={`px-6 py-4 rounded-lg font-medium flex items-center justify-center gap-2 text-lg ${
                    isLoading || !query.trim() 
                      ? 'bg-slate-600 text-slate-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLoading ? <FaSyncAlt className="animate-spin" /> : <FaRobot />}
                  {isLoading ? 'Analyzing...' : 'Ask AI'}
                </button>
              </div>
            </form>
            
            {/* Suggested queries */}
            <div>
              <h2 className="text-sm font-medium text-slate-400 mb-3">Try asking about:</h2>
              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => handleSuggestedQuery("What are the most common software issues?")}
                  className="bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-full text-sm"
                >
                  Common software issues
                </button>
                <button 
                  onClick={() => handleSuggestedQuery("How many tickets were resolved in less than 4 hours?")}
                  className="bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-full text-sm"
                >
                  Resolution time
                </button>
                <button 
                  onClick={() => handleSuggestedQuery("Which department has the most open tickets?")}
                  className="bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-full text-sm"
                >
                  Department analysis
                </button>
                <button 
                  onClick={() => handleSuggestedQuery("What software has the most critical issues?")}
                  className="bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-full text-sm"
                >
                  Critical issues
                </button>
                <button 
                  onClick={() => handleSuggestedQuery("Compare resolution times between hardware and software tickets")}
                  className="bg-slate-600 hover:bg-slate-500 text-slate-200 px-3 py-1.5 rounded-full text-sm"
                >
                  Compare categories
                </button>
              </div>
            </div>
          </div>
          
          {/* Response area */}
          {response && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden mb-8">
              <div className="bg-slate-800 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <FaServer className="text-cyan-400" />
                  Analysis Results
                </h2>
                <div className="bg-blue-900 text-cyan-300 text-xs font-mono px-2 py-1 rounded">
                  {Math.round(response.confidence * 100)}% confidence
                </div>
              </div>
              
              <div className="p-6">
                <p className="text-lg text-slate-800 mb-6 leading-relaxed">{response.answer}</p>
                
                {response.relatedTickets && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 mb-3 flex items-center gap-2">
                      <FaRegClock className="text-blue-500" /> Related Tickets:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {response.relatedTickets.map(ticketId => (
                        <span key={ticketId} className="bg-slate-100 text-slate-800 px-3 py-1.5 rounded-md text-sm font-mono">
                          INC0001{String(ticketId).padStart(3, '0')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Recent queries */}
          {recentQueries.length > 0 && (
            <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-6 py-4">
                <div className="flex items-center gap-2">
                  <FaHistory className="text-slate-500" />
                  <h2 className="text-lg font-semibold text-slate-900">Recent Queries</h2>
                </div>
              </div>
              
              <div className="p-4">
                <ul className="divide-y divide-slate-100">
                  {recentQueries.map((recentQuery, index) => (
                    <li key={index} className="py-2">
                      <button
                        onClick={() => handleSuggestedQuery(recentQuery)}
                        className="text-left w-full text-blue-600 hover:text-blue-800 hover:underline py-1"
                      >
                        {recentQuery}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <footer className="bg-slate-900 text-slate-300 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>ServiceNow Ticket Analysis Dashboard &copy; 2024</p>
        </div>
      </footer>
    </div>
  );
} 