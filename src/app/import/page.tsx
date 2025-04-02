'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { FaFileUpload, FaCheck, FaExclamationTriangle, FaTicketAlt, FaComments, FaLayerGroup } from 'react-icons/fa';
import { useTickets, Ticket } from '@/context/TicketContext';
import { useConversations, Conversation } from '@/context/ConversationContext';

// Define types we'll use
type JsonData = Record<string, unknown> | unknown[] | unknown;

// Define a more specific type for the preview data
interface CombinedPreviewData {
  original: JsonData;
  tickets: Ticket[];
  conversations: Conversation[];
}

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewData, setPreviewData] = useState<CombinedPreviewData | null>(null);
  const { setTickets, tickets } = useTickets();
  const { setConversations, conversations } = useConversations();

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
      const uploadedFiles = Array.from(e.dataTransfer.files).filter(file => 
        file.type === 'application/json' || file.name.endsWith('.json')
      );
      
      if (uploadedFiles.length === 0) {
        setUploadStatus('error');
        setErrorMessage('Please upload JSON files only.');
        return;
      }
      
      handleFilesSelection(uploadedFiles);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const uploadedFiles = Array.from(e.target.files).filter(file => 
        file.type === 'application/json' || file.name.endsWith('.json')
      );
      
      if (uploadedFiles.length === 0) {
        setUploadStatus('error');
        setErrorMessage('Please upload JSON files only.');
        return;
      }
      
      handleFilesSelection(uploadedFiles);
    }
  };

  const extractTickets = (data: JsonData): Ticket[] => {
    // Try to extract tickets from various structures
    if (Array.isArray(data)) {
      console.log('Found array with', data.length, 'items');
      // Check if the array looks like tickets
      if (data.length > 0 && (
        data[0].hasOwnProperty('ticket_id') || 
        data[0].hasOwnProperty('number') || 
        data[0].hasOwnProperty('short_description') ||
        data[0].hasOwnProperty('status')
      )) {
        return data as Ticket[];
      }
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
    
    if (obj.data && Array.isArray(obj.data) && obj.data.length > 0 && !isLikelyConversation(obj.data[0])) {
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
        if (typeof firstItem === 'object' && firstItem !== null &&
            !isLikelyConversation(firstItem) &&
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
       (typeof possibleConversation.resolved === 'boolean' || possibleConversation.hasOwnProperty('resolved')) && 
       possibleConversation.id) {
      return true;
    }
    
    return false;
  };

  const handleFilesSelection = async (uploadedFiles: File[]) => {
    // Reset state
    setFiles(uploadedFiles);
    setUploadStatus('idle');
    setErrorMessage('');
    setPreviewData(null);

    // Initialize combined data
    let combinedTickets: Ticket[] = [];
    let combinedConversations: Conversation[] = [];
    let combinedData: JsonData = {};

    try {
      // Process all files
      for (const file of uploadedFiles) {
        const fileData = await readFileAsJson(file);
        
        if (!fileData) continue;
        
        // Extract data from this file
        const tickets = extractTickets(fileData);
        const conversations = extractConversations(fileData);
        
        // Add to combined data
        combinedTickets = [...combinedTickets, ...tickets];
        combinedConversations = [...combinedConversations, ...conversations];
        
        // Track original data
        if (Array.isArray(combinedData)) {
          combinedData = [...(combinedData as unknown[]), ...(Array.isArray(fileData) ? fileData : [fileData])];
        } else if (typeof fileData === 'object' && fileData !== null) {
          combinedData = { ...combinedData as Record<string, unknown>, ...(fileData as Record<string, unknown>) };
        }
      }

      // Create preview data
      if (combinedTickets.length > 0 || combinedConversations.length > 0) {
        setPreviewData({
          original: combinedData,
          tickets: combinedTickets,
          conversations: combinedConversations
        });
        
        console.log(`Successfully processed ${combinedTickets.length} tickets and ${combinedConversations.length} conversations`);
      } else {
        throw new Error('Could not identify any tickets or conversations in the uploaded files');
      }
    } catch (error: unknown) {
      console.error('Error processing files:', error);
      setUploadStatus('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage('Error processing files: ' + errorMsg);
    }
  };

  const readFileAsJson = async (file: File): Promise<JsonData | null> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const rawData = event.target?.result as string;
          const jsonData = JSON.parse(rawData);
          resolve(jsonData);
        } catch (error) {
          console.error(`Error parsing JSON from ${file.name}:`, error);
          reject(error);
        }
      };
      
      reader.onerror = (error) => {
        console.error(`Error reading ${file.name}:`, error);
        reject(error);
      };
      
      reader.readAsText(file);
    });
  };

  const handleSubmit = async () => {
    if (!files.length || !previewData) return;
    
    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Process both types of data
      if (previewData.tickets.length > 0) {
        console.log(`Processing ${previewData.tickets.length} tickets`);
        setTickets([...tickets, ...previewData.tickets]);
      }
      
      if (previewData.conversations.length > 0) {
        console.log(`Processing ${previewData.conversations.length} conversations`);
        setConversations([...conversations, ...previewData.conversations]);
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
    if (!previewData) {
      return (
        <div className="mt-4 bg-[#3A2A2A] text-red-400 p-3 rounded-md flex items-center border border-red-900">
          <FaExclamationTriangle className="mr-2" />
          <span>No data loaded yet. Please select a file.</span>
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-6">
        {/* Display ticket data if available */}
        {previewData.tickets.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center text-[#E0E0E0]">
              <FaTicketAlt className="mr-2 text-[#FFA500]" />
              Ticket Data Preview
            </h3>
            <div className="bg-[#333333] p-4 rounded border border-gray-700 overflow-auto max-h-80">
              <pre className="text-sm text-[#E0E0E0] font-mono whitespace-pre-wrap">
                {JSON.stringify(previewData.tickets.slice(0, 3), null, 2)}
              </pre>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-[#E0E0E0]">
                <span className="font-medium">Total tickets found:</span> {previewData.tickets.length}
              </p>
              {previewData.tickets.length > 3 && (
                <p className="text-sm text-[#E0E0E0]">
                  Showing first 3 of {previewData.tickets.length} records
                </p>
              )}
            </div>
          </div>
        )}

        {/* Display conversation data if available */}
        {previewData.conversations.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-2 flex items-center text-[#E0E0E0]">
              <FaComments className="mr-2 text-[#FFA500]" />
              Conversation Data Preview
            </h3>
            <div className="bg-[#333333] p-4 rounded border border-gray-700 overflow-auto max-h-80">
              <pre className="text-sm text-[#E0E0E0] font-mono whitespace-pre-wrap">
                {JSON.stringify(previewData.conversations.slice(0, 1), null, 2)}
              </pre>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-[#E0E0E0]">
                <span className="font-medium">Total conversations found:</span> {previewData.conversations.length}
              </p>
              <p className="text-sm text-[#E0E0E0]">
                <span className="font-medium">Total messages:</span> {previewData.conversations.reduce((total, conv) => total + conv.messages.length, 0)}
              </p>
              {previewData.conversations.length > 1 && (
                <p className="text-sm text-[#E0E0E0]">
                  Showing first of {previewData.conversations.length} conversations
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#E0E0E0]">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-[#E0E0E0]">Import Data</h1>
        
        <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm border border-gray-700 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center text-[#E0E0E0]">
              <FaLayerGroup className="mr-2 text-[#FFA500]" />
              Upload JSON Data
            </h2>
          </div>
          
          <p className="text-[#E0E0E0] mb-6">
            Upload your ServiceNow tickets and conversation history in JSON format. The system will automatically detect and extract both types of data from the same file or from multiple files.
          </p>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center ${
              isDragging ? 'border-[#FFA500] bg-[#333333]' : 'border-gray-600'
            } transition-colors`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleFileDrop}
          >
            <FaFileUpload className="mx-auto text-4xl text-[#E69500] mb-4" />
            <p className="text-[#E0E0E0] mb-4">
              Drag and drop your JSON file(s) here, or click to select file(s)
            </p>
            <input
              type="file"
              id="fileInput"
              className="hidden"
              accept=".json,application/json"
              onChange={handleFileInput}
              multiple
            />
            <button
              onClick={() => document.getElementById('fileInput')?.click()}
              className="bg-[#E69500] hover:bg-[#FFA500] text-white font-medium py-2 px-4 rounded transition-colors"
            >
              Select Files
            </button>
          </div>
          
          {files.length > 0 && (
            <div className="mt-4">
              <h3 className="font-medium mb-2 text-[#E0E0E0]">Selected Files:</h3>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center bg-[#333333] p-2 rounded">
                    <FaFileUpload className="text-[#FFA500] mr-2" />
                    <span className="font-medium text-[#E0E0E0]">{file.name}</span>
                    <span className="ml-2 text-[#E0E0E0]">({(file.size / 1024).toFixed(1)} KB)</span>
                  </div>
                ))}
              </div>
              
              {renderPreview()}
              
              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || uploadStatus === 'success' || !previewData}
                  className={`font-medium py-2 px-6 rounded ${
                    isUploading || uploadStatus === 'success' || !previewData
                      ? 'bg-gray-600 cursor-not-allowed text-gray-400' 
                    : 'bg-[#E69500] hover:bg-[#FFA500] text-white transition-colors'
                  }`}
                >
                  {isUploading ? 'Processing...' : 
                   uploadStatus === 'success' ? 'Processed Successfully' : 
                   'Process Files'}
                </button>
              </div>
            </div>
          )}
          
          {uploadStatus === 'error' && (
            <div className="mt-4 bg-[#3A2A2A] text-red-400 p-3 rounded-md flex items-center border border-red-900">
              <FaExclamationTriangle className="mr-2" />
              <span>{errorMessage}</span>
            </div>
          )}
          
          {uploadStatus === 'success' && (
            <div className="mt-4 bg-[#2A3A2A] text-green-400 p-3 rounded-md flex items-center border border-green-900">
              <FaCheck className="mr-2" />
              <div>
                <p className="font-medium">Data processed successfully!</p>
                <div className="flex flex-wrap gap-3 mt-2">
                  {previewData?.tickets.length ? (
                    <div className="bg-[#333333] text-[#E0E0E0] px-3 py-1 rounded-full text-sm flex items-center border border-[#FFA500]">
                      <FaTicketAlt className="mr-1 text-[#FFA500]" /> {previewData.tickets.length} tickets imported
                    </div>
                  ) : null}
                  
                  {previewData?.conversations.length ? (
                    <div className="bg-[#333333] text-[#E0E0E0] px-3 py-1 rounded-full text-sm flex items-center border border-[#FFA500]">
                      <FaComments className="mr-1 text-[#FFA500]" /> {previewData.conversations.length} conversations imported
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-[#2B2B2B] p-6 rounded-xl border border-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-[#E0E0E0]">Data Format Information</h2>
          <p className="text-[#E0E0E0] mb-3">
            The system can extract both ticket data and conversation history from the same JSON file, or from separate files. Simply upload your file(s) and we&apos;ll identify the data types automatically.
          </p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border border-gray-700 bg-[#333333] p-4 rounded-lg">
              <h3 className="font-medium text-[#E0E0E0] mb-2 flex items-center">
                <FaTicketAlt className="mr-2 text-[#FFA500]" />
                Ticket Data Format
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-[#E0E0E0] text-sm">
                <li>ServiceNow exports in JSON format</li>
                <li>Standard ticket fields like number, status, priority</li>
                <li>Data can be in arrays or nested objects</li>
                <li>Common paths: result, records, data, tickets</li>
              </ul>
              <a href="/sample-ticket.json" download className="text-[#FFA500] mt-3 text-sm flex items-center hover:underline">
                <FaFileUpload className="mr-1" />
                Download sample ticket data
              </a>
            </div>
            
            <div className="border border-gray-700 bg-[#333333] p-4 rounded-lg">
              <h3 className="font-medium text-[#E0E0E0] mb-2 flex items-center">
                <FaComments className="mr-2 text-[#FFA500]" />
                Conversation Data Format
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-[#E0E0E0] text-sm">
                <li>JSON format with messages array</li>
                <li>Fields like id, customer_id, channel, resolved</li>
                <li>Messages with sender, timestamp, content</li>
                <li>Optional sentiment analysis and categorization</li>
              </ul>
              <a href="/sample-conversation.json" download className="text-[#FFA500] mt-3 text-sm flex items-center hover:underline">
                <FaFileUpload className="mr-1" />
                Download sample conversation data
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-[#2B2B2B] text-[#E0E0E0] py-6 mt-auto border-t border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <p>Jimmy Ticket Analyzer v27 &copy; 2025</p>
        </div>
      </footer>
    </div>
  );
} 