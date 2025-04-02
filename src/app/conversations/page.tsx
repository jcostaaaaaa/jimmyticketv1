'use client';

import { useState } from 'react';
import { useConversations, Conversation } from '@/context/ConversationContext';
import { Header } from '@/components/Header';
import { FaComments, FaUser, FaRobot, FaClock, FaCalendarAlt, FaSearch, FaFilter } from 'react-icons/fa';

export default function ConversationsPage() {
  const { conversations } = useConversations();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState<string>('all');

  // Filter conversations based on search term and filters
  const filteredConversations = conversations.filter(conversation => {
    // Search filter
    const searchMatch = !searchTerm || 
      conversation.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conversation.messages.some(msg => 
        msg.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    // Category filter
    const categoryMatch = filterBy === 'all' || conversation.topic === filterBy;
    
    return searchMatch && categoryMatch;
  });

  // Get unique categories for filter
  const categories = [...new Set(conversations.map(conv => conv.topic))].filter(Boolean);
  
  // Find the selected conversation details
  const conversationDetails = selectedConversation 
    ? conversations.find(c => c.id === selectedConversation)
    : null;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#E0E0E0]">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex items-center gap-3 mb-6">
          <FaComments className="text-2xl text-[#E69500]" />
          <h1 className="text-2xl font-bold text-[#E0E0E0]">Conversation History</h1>
        </div>
        
        {conversations.length === 0 ? (
          <div className="bg-[#2B2B2B] p-8 rounded-xl shadow-sm border border-gray-700 text-center">
            <FaComments className="mx-auto text-4xl text-[#E69500] mb-4" />
            <h2 className="text-xl font-semibold text-[#E0E0E0] mb-2">No Conversation Data</h2>
            <p className="text-[#E0E0E0] mb-4">Import conversation history data from the Import page to view and analyze customer interactions.</p>
            <a href="/import" className="inline-block px-4 py-2 bg-[#E69500] hover:bg-[#FFA500] text-white rounded-md transition-colors">
              Go to Import
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Conversation list */}
            <div className="md:col-span-1">
              <div className="bg-[#2B2B2B] p-4 rounded-xl shadow-sm border border-gray-700">
                <div className="mb-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 pl-10 bg-[#333333] border border-gray-700 text-[#E0E0E0] focus:outline-none focus:ring-2 focus:ring-[#FFA500]"
                    />
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#E69500]" />
                  </div>
                </div>
                
                <div className="mb-4 flex items-center">
                  <FaFilter className="text-[#E69500] mr-2" />
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="bg-[#333333] border border-gray-700 text-[#E0E0E0] py-1 px-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFA500] text-sm"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  <span className="ml-2 text-sm text-[#E0E0E0]">
                    {filteredConversations.length} conversation{filteredConversations.length !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map(conversation => (
                      <button
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation.id)}
                        className={`w-full text-left p-3 rounded-lg transition ${
                          selectedConversation === conversation.id
                            ? 'bg-[#333333] border-[#E69500] border'
                            : 'bg-[#2B2B2B] border-gray-700 border hover:bg-[#333333]'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-[#E0E0E0]">
                            {conversation.id}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(conversation.topic)}`}>
                            {conversation.topic || 'Uncategorized'}
                          </div>
                        </div>
                        <div className="text-sm text-[#E0E0E0] mt-1 flex items-center">
                          <FaClock className="mr-1 text-[#E69500]" />
                          {new Date(conversation.start_time).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-[#E0E0E0] mt-2 line-clamp-2">
                          {conversation.messages[0]?.content.substring(0, 60)}...
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-[#E0E0E0]">
                      No conversations match your search
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Conversation details */}
            <div className="md:col-span-2">
              {selectedConversation && conversationDetails ? (
                <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm border border-gray-700">
                  <div className="border-b pb-4 mb-4">
                    <div className="flex justify-between">
                      <h2 className="text-xl font-semibold text-[#E0E0E0]">
                        {conversationDetails.id}
                      </h2>
                      <div className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(conversationDetails.topic)}`}>
                        {conversationDetails.topic || 'Uncategorized'}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-[#E0E0E0]">
                      <FaCalendarAlt className="mr-2 text-[#E69500]" />
                      {new Date(conversationDetails.start_time).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {conversationDetails.messages.map((message, index) => (
                      <div 
                        key={index} 
                        className={`flex ${
                          message.sender === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === 'user' 
                            ? 'bg-[#E69500] text-[#E0E0E0]' 
                            : 'bg-[#333333] text-[#E0E0E0]'
                        }`}>
                          <div className="flex items-center mb-1">
                            <div className={`p-1 rounded-full mr-2 ${
                              message.sender === 'user' ? 'bg-[#FFA500]' : 'bg-[#E69500]'
                            }`}>
                              {message.sender === 'user' ? <FaUser size={12} /> : <FaRobot size={12} />}
                            </div>
                            <div className="text-xs font-medium">
                              {message.sender === 'user' ? 'Customer' : 'Support Agent'}
                            </div>
                            <div className="text-xs text-[#E0E0E0] ml-auto">
                              {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                          </div>
                          <div className="whitespace-pre-line">
                            {message.content}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 border-t pt-4">
                    <h3 className="text-sm font-medium text-[#E0E0E0] mb-2">
                      AI Analysis
                    </h3>
                    <div className="text-sm text-[#E0E0E0] bg-[#333333] p-3 rounded-lg">
                      <p><strong>Sentiment:</strong> {getSentimentAnalysis(conversationDetails)}</p>
                      <p><strong>Resolution Status:</strong> {getResolutionStatus(conversationDetails)}</p>
                      <p><strong>Topic Detection:</strong> {getTopicDetection(conversationDetails)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-[#2B2B2B] border border-dashed border-gray-700 rounded-xl p-8 flex flex-col items-center justify-center h-full">
                  <FaComments className="text-5xl text-[#E69500] mb-4" />
                  <p className="text-[#E0E0E0] text-center">
                    Select a conversation from the list to view details
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      <footer className="bg-[#1A1A1A] text-[#E0E0E0] py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>ServiceNow Ticket Analysis Dashboard &copy; 2024</p>
        </div>
      </footer>
    </div>
  );
}

// Helper functions for UI
function getCategoryColor(category?: string): string {
  switch (category?.toLowerCase()) {
    case 'technical support':
      return 'bg-[#E69500] text-[#E0E0E0]';
    case 'billing':
      return 'bg-[#FFA500] text-[#E0E0E0]';
    case 'product information':
      return 'bg-[#FFC107] text-[#E0E0E0]';
    case 'complaint':
      return 'bg-[#FF9800] text-[#E0E0E0]';
    case 'feedback':
      return 'bg-[#FF69B4] text-[#E0E0E0]';
    default:
      return 'bg-[#333333] text-[#E0E0E0]';
  }
}

// Mock AI analysis functions
function getSentimentAnalysis(conversation: Conversation): string {
  // In a real app, this would use NLP to analyze sentiment
  // For demo purposes, we'll return mock analysis
  const messages = conversation.messages;
  const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user')?.content.toLowerCase() || '';
  
  if (lastUserMessage.includes('thank') || lastUserMessage.includes('great') || lastUserMessage.includes('appreciate')) {
    return 'Positive (84%)';
  } else if (lastUserMessage.includes('issue') || lastUserMessage.includes('problem') || lastUserMessage.includes('not working')) {
    return 'Negative (62%)';
  } else {
    return 'Neutral (75%)';
  }
}

function getResolutionStatus(conversation: Conversation): string {
  // In a real app, this would analyze conversation flow
  const messages = conversation.messages;
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage.sender === 'agent' && 
      (lastMessage.content.includes('resolve') || lastMessage.content.includes('fixed') || lastMessage.content.includes('solution'))) {
    return 'Resolved';
  } else if (messages.length > 4) {
    return 'In Progress (Complex Issue)';
  } else {
    return 'Pending Resolution';
  }
}

function getTopicDetection(conversation: Conversation): string {
  // In a real app, this would use topic modeling
  const allText = conversation.messages.map(m => m.content).join(' ').toLowerCase();
  
  if (allText.includes('password') || allText.includes('login') || allText.includes('access')) {
    return 'Account Access';
  } else if (allText.includes('payment') || allText.includes('charge') || allText.includes('invoice')) {
    return 'Billing Inquiry';
  } else if (allText.includes('slow') || allText.includes('crash') || allText.includes('error')) {
    return 'Technical Issue';
  } else if (allText.includes('how to') || allText.includes('where') || allText.includes('what is')) {
    return 'Product Information';
  } else {
    return 'General Inquiry';
  }
} 