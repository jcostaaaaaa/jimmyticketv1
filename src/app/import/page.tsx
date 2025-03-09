'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { FaFileUpload, FaCheck, FaExclamationTriangle, FaTicketAlt, FaComments } from 'react-icons/fa';
import { useTickets, Ticket } from '@/context/TicketContext';
import { useConversations, Conversation } from '@/context/ConversationContext';

// Define types we'll use
type JsonData = Record<string, unknown> | unknown[] | unknown;

// Define a more specific type for the preview data
interface TicketPreviewData {
  original: JsonData;
  tickets: Ticket[];
}

interface ConversationPreviewData {
  original: JsonData;
  conversations: Conversation[];
}

type ImportDataType = 'tickets' | 'conversations';

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [ticketPreviewData, setTicketPreviewData] = useState<TicketPreviewData | null>(null);
  const [conversationPreviewData, setConversationPreviewData] = useState<ConversationPreviewData | null>(null);
  const [dataType, setDataType] = useState<ImportDataType>('tickets');
  const { setTickets } = useTickets();
  const { setConversations } = useConversations();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const uploadedFile = e.dataTransfer.files[0];
      handleFileSelection(uploadedFile);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFile = e.target.files[0];
      handleFileSelection(uploadedFile);
    }
  };

  const extractTickets = (data: JsonData): Ticket[] => {
    // Try to extract tickets from various structures
    if (Array.isArray(data)) {
      console.log('Found array with', data.length, 'items');
      return data as Ticket[];
    }
    
    if (typeof data !== 'object' || data === null) {
      console.warn('Data is not an object or array');
      return [];
    }
    
    const obj = data as Record<string, unknown>;
    
    // Check for nested structures
    if (obj.result && typeof obj.result === 'object') {
      // Look for tickets array inside result
      const result = obj.result as Record<string, unknown>;
      
      if (result.tickets && Array.isArray(result.tickets)) {
        console.log('Found tickets array in result.tickets with', result.tickets.length, 'items');
        return result.tickets as Ticket[];
      }
      
      // Standard ServiceNow structure
      if (Array.isArray(obj.result)) {
        console.log('Found array in result with', obj.result.length, 'items');
        return obj.result as Ticket[];
      }
    }
    
    // Other common structures
    if (obj.records && Array.isArray(obj.records)) {
      console.log('Found records array with', obj.records.length, 'items');
      return obj.records as Ticket[];
    }
    
    if (obj.data && Array.isArray(obj.data)) {
      console.log('Found data array with', obj.data.length, 'items');
      return obj.data as Ticket[];
    }
    
    if (obj.items && Array.isArray(obj.items)) {
      console.log('Found items array with', obj.items.length, 'items');
      return obj.items as Ticket[];
    }
    
    if (obj.tickets && Array.isArray(obj.tickets)) {
      console.log('Found tickets array with', obj.tickets.length, 'items');
      return obj.tickets as Ticket[];
    }
    
    // Check for ticket properties to determine if it's a single ticket
    if (obj.ticket_id || obj.number || obj.sys_id) {
      console.log('Found single ticket object');
      return [obj as Ticket];
    }
    
    // Last resort: search recursively for any array property that might contain tickets
    console.log('Searching recursively for ticket arrays...');
    
    // First, look for any property that's an array with objects that look like tickets
    for (const key in obj) {
      if (Array.isArray(obj[key]) && obj[key].length > 0) {
        // Check if first item looks like a ticket
        const firstItem = obj[key][0];
        if (typeof firstItem === 'object' && 
            (firstItem.ticket_id || firstItem.number || 
             firstItem.short_description || firstItem.status || 
             firstItem.priority)) {
          console.log(`Found likely ticket array in "${key}" with ${obj[key].length} items`);
          return obj[key] as Ticket[];
        }
      }
    }
    
    // Then, look for nested objects that might contain ticket arrays
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        const nestedTickets = extractTickets(obj[key]);
        if (nestedTickets.length > 0) {
          return nestedTickets;
        }
      }
    }
    
    console.warn('No ticket data found in the structure');
    return [];
  };

  const extractConversations = (data: JsonData): Conversation[] => {
    // Similar pattern to extractTickets but for conversations
    if (Array.isArray(data)) {
      console.log('Found array with', data.length, 'items');
      if (data.length > 0 && isLikelyConversation(data[0])) {
        return data as Conversation[];
      }
    }
    
    if (typeof data !== 'object' || data === null) {
      console.warn('Data is not an object or array');
      return [];
    }
    
    const obj = data as Record<string, unknown>;
    
    // Check for nested structures
    if (obj.conversations && Array.isArray(obj.conversations)) {
      console.log('Found conversations array with', obj.conversations.length, 'items');
      return obj.conversations as Conversation[];
    }
    
    if (obj.data && Array.isArray(obj.data) && obj.data.length > 0 && isLikelyConversation(obj.data[0])) {
      console.log('Found conversations in data array with', obj.data.length, 'items');
      return obj.data as Conversation[];
    }
    
    // Check for properties that might indicate this is a single conversation
    if (isLikelyConversation(obj)) {
      console.log('Found single conversation object');
      return [obj as Conversation];
    }
    
    // Search recursively for conversation arrays
    for (const key in obj) {
      if (Array.isArray(obj[key]) && obj[key].length > 0 && isLikelyConversation(obj[key][0])) {
        console.log(`Found likely conversation array in "${key}" with ${obj[key].length} items`);
        return obj[key] as Conversation[];
      }
    }
    
    console.warn('No conversation data found in the structure');
    return [];
  };

  // Helper to check if an object looks like a conversation
  const isLikelyConversation = (obj: unknown): boolean => {
    if (typeof obj !== 'object' || obj === null) return false;
    
    const possibleConversation = obj as Record<string, unknown>;
    
    // Check for conversation-specific properties
    if (possibleConversation.messages && Array.isArray(possibleConversation.messages)) {
      return true;
    }
    
    if (possibleConversation.channel && 
       (typeof possibleConversation.resolved === 'boolean') && 
       possibleConversation.id) {
      return true;
    }
    
    return false;
  };

  const handleFileSelection = (uploadedFile: File) => {
    // Check if file is JSON
    if (uploadedFile.type !== 'application/json' && !uploadedFile.name.endsWith('.json')) {
      setUploadStatus('error');
      setErrorMessage('Please upload a JSON file.');
      return;
    }

    setFile(uploadedFile);
    setUploadStatus('idle');
    setErrorMessage('');
    setTicketPreviewData(null);
    setConversationPreviewData(null);

    // Read file preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawData = event.target?.result as string;
        console.log('Raw JSON data (first 200 chars):', rawData.substring(0, 200) + '...');
        
        const jsonData = JSON.parse(rawData);
        console.log('Parsed JSON type:', typeof jsonData);
        
        // First, try to determine if this is ticket or conversation data
        const tickets = extractTickets(jsonData);
        const conversations = extractConversations(jsonData);
        
        if (tickets.length > 0 && (conversations.length === 0 || tickets.length > conversations.length)) {
          // This appears to be ticket data
          setDataType('tickets');
          setTicketPreviewData({
            original: jsonData,
            tickets: tickets
          });
          console.log(`Successfully identified as ticket data with ${tickets.length} tickets`);
        } else if (conversations.length > 0) {
          // This appears to be conversation data
          setDataType('conversations');
          setConversationPreviewData({
            original: jsonData,
            conversations: conversations
          });
          console.log(`Successfully identified as conversation data with ${conversations.length} conversations`);
        } else {
          throw new Error('Could not identify the data format as either tickets or conversations');
        }
      } catch (error: unknown) {
        console.error('Error parsing JSON:', error);
        setUploadStatus('error');
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        setErrorMessage('Invalid JSON format. Please check your file: ' + errorMsg);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    if (dataType === 'tickets' && !ticketPreviewData) {
      setErrorMessage('No valid ticket data found');
      return;
    }
    
    if (dataType === 'conversations' && !conversationPreviewData) {
      setErrorMessage('No valid conversation data found');
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      if (dataType === 'tickets' && ticketPreviewData) {
        // Process ticket data
        const tickets = ticketPreviewData.tickets;
        console.log(`Processing ${tickets.length} tickets`);
        setTickets(tickets);
      } else if (dataType === 'conversations' && conversationPreviewData) {
        // Process conversation data
        const conversations = conversationPreviewData.conversations;
        console.log(`Processing ${conversations.length} conversations`);
        setConversations(conversations);
      }
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadStatus('success');
    } catch (error: unknown) {
      setUploadStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage('An error occurred during processing: ' + errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const renderPreview = () => {
    if (dataType === 'tickets') {
      return renderTicketPreview();
    } else {
      return renderConversationPreview();
    }
  };

  const renderTicketPreview = () => {
    if (!ticketPreviewData) {
      return (
        <div className="mt-4 bg-yellow-50 text-yellow-700 p-3 rounded-md flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <span>No ticket data loaded yet. Please select a file.</span>
        </div>
      );
    }

    try {
      const tickets = ticketPreviewData.tickets;
      
      if (!tickets || tickets.length === 0) {
        throw new Error('No ticket data found in the JSON');
      }
      
      // Take first 3 tickets for preview
      const sample = tickets.slice(0, 3);
      
      // Format the JSON with proper indentation for better readability
      const formattedJson = JSON.stringify(sample, null, 2);

      return (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Ticket Data Preview</h3>
          <div className="bg-slate-800 p-4 rounded border border-slate-700 overflow-auto max-h-80">
            <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap">{formattedJson}</pre>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total tickets found:</span> {tickets.length}
            </p>
            {tickets.length > 3 && (
              <p className="text-sm text-gray-500">
                Showing first 3 of {tickets.length} records
              </p>
            )}
          </div>
        </div>
      );
    } catch (error: unknown) {
      console.error('Error rendering ticket preview:', error);
      return (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <div>
            <p>Invalid ticket data format. Please check your JSON structure.</p>
            <p className="text-sm opacity-75 mt-1">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
            <p className="text-sm mt-2">
              Try uploading a standard ServiceNow export file or check the console for debugging information.
            </p>
          </div>
        </div>
      );
    }
  };

  const renderConversationPreview = () => {
    if (!conversationPreviewData) {
      return (
        <div className="mt-4 bg-yellow-50 text-yellow-700 p-3 rounded-md flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <span>No conversation data loaded yet. Please select a file.</span>
        </div>
      );
    }

    try {
      const conversations = conversationPreviewData.conversations;
      
      if (!conversations || conversations.length === 0) {
        throw new Error('No conversation data found in the JSON');
      }
      
      // Take first conversation for preview
      const sample = conversations.slice(0, 1);
      
      // Format the JSON with proper indentation for better readability
      const formattedJson = JSON.stringify(sample, null, 2);

      return (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Conversation Data Preview</h3>
          <div className="bg-slate-800 p-4 rounded border border-slate-700 overflow-auto max-h-80">
            <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap">{formattedJson}</pre>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total conversations found:</span> {conversations.length}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Total messages:</span> {conversations.reduce((total, conv) => total + conv.messages.length, 0)}
            </p>
            {conversations.length > 1 && (
              <p className="text-sm text-gray-500">
                Showing first of {conversations.length} conversations
              </p>
            )}
          </div>
        </div>
      );
    } catch (error: unknown) {
      console.error('Error rendering conversation preview:', error);
      return (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <div>
            <p>Invalid conversation data format. Please check your JSON structure.</p>
            <p className="text-sm opacity-75 mt-1">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
            <p className="text-sm mt-2">
              Try uploading a standard conversation export file or check the console for debugging information.
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Import Data</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Upload JSON Data</h2>
            
            <div className="flex space-x-2">
              <button 
                onClick={() => setDataType('tickets')}
                className={`flex items-center px-3 py-2 rounded ${
                  dataType === 'tickets' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaTicketAlt className="mr-2" />
                Ticket Data
              </button>
              <button 
                onClick={() => setDataType('conversations')}
                className={`flex items-center px-3 py-2 rounded ${
                  dataType === 'conversations' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FaComments className="mr-2" />
                Conversation History
              </button>
            </div>
          </div>
          
          <p className="text-gray-600 mb-6">
            {dataType === 'tickets' 
              ? 'Export your tickets from ServiceNow in JSON format and upload the file here. We&apos;ll automatically parse and analyze the data.'
              : 'Upload your conversation history JSON file to analyze customer interactions. We&apos;ll automatically parse and analyze the conversation data.'
            }
          </p>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            } transition-colors`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
          >
            <FaFileUpload className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Drag and drop your JSON file here, or click to select a file
            </p>
            <input
              type="file"
              id="fileInput"
              className="hidden"
              accept=".json,application/json"
              onChange={handleFileInput}
            />
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
            >
              Select File
            </button>
          </div>
          
          {file && (
            <div className="mt-4">
              <div className="flex items-center">
                <FaFileUpload className="text-blue-500 mr-2" />
                <span className="font-medium">{file.name}</span>
                <span className="ml-2 text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              
              {renderPreview()}
              
              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || uploadStatus === 'success' || (!ticketPreviewData && !conversationPreviewData)}
                  className={`font-medium py-2 px-6 rounded ${
                    isUploading || uploadStatus === 'success' || (!ticketPreviewData && !conversationPreviewData)
                      ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isUploading ? 'Uploading...' : 
                   uploadStatus === 'success' ? 'Uploaded Successfully' : 
                   'Process File'}
                </button>
              </div>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
              <FaExclamationTriangle className="mr-2" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="mt-4 bg-green-50 text-green-700 p-3 rounded-md flex items-center">
              <FaCheck className="mr-2" />
              <span>
                {dataType === 'tickets'
                  ? 'Ticket data processed successfully! You can now analyze your ticket data.'
                  : 'Conversation data processed successfully! You can now analyze your conversation history.'
                }
              </span>
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">
            {dataType === 'tickets'
              ? 'How to Export ServiceNow Tickets'
              : 'How to Export Conversation History'
            }
          </h2>
          {dataType === 'tickets' ? (
            <ol className="list-decimal pl-5 space-y-2 text-blue-800">
              <li>Log in to your ServiceNow instance</li>
              <li>Navigate to the <strong>Incident</strong> list view</li>
              <li>Use filters to select the tickets you want to analyze</li>
              <li>Click the <strong>Export</strong> button (usually in the upper right)</li>
              <li>Select <strong>JSON</strong> as the export format</li>
              <li>Download the file and upload it here</li>
            </ol>
          ) : (
            <>
              <ol className="list-decimal pl-5 space-y-2 text-blue-800">
                <li>Log in to your customer service platform</li>
                <li>Navigate to the <strong>Conversation History</strong> section</li>
                <li>Use filters to select the date range and agents</li>
                <li>Click the <strong>Export</strong> button</li>
                <li>Select <strong>JSON</strong> as the export format</li>
                <li>Download the file and upload it here</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-100 rounded-md">
                <p className="text-blue-800 font-medium">
                  Not sure about the format? 
                  <a href="/sample-conversation.json" download className="text-blue-600 ml-1 underline hover:text-blue-800">
                    Download our sample conversation JSON
                  </a> 
                  to see the expected structure.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-6 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>ServiceNow Ticket Analysis Dashboard &copy; 2024</p>
        </div>
      </footer>
    </div>
  );
} 