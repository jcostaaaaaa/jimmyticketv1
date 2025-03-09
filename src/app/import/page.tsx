'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { FaFileUpload, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { useTickets, Ticket } from '@/context/TicketContext';

// Define a more specific type for the preview data
interface PreviewData {
  original: Record<string, any>;
  tickets: Ticket[];
}

export default function ImportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const { setTickets } = useTickets();

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

  const extractTickets = (data: Record<string, any>): Ticket[] => {
    // Try to extract tickets from various structures
    if (Array.isArray(data)) {
      console.log('Found array with', data.length, 'items');
      return data;
    }
    
    if (typeof data !== 'object' || data === null) {
      console.warn('Data is not an object or array');
      return [];
    }
    
    // Check for nested structures
    if (data.result && typeof data.result === 'object') {
      // Look for tickets array inside result
      if (data.result.tickets && Array.isArray(data.result.tickets)) {
        console.log('Found tickets array in result.tickets with', data.result.tickets.length, 'items');
        return data.result.tickets;
      }
      
      // Standard ServiceNow structure
      if (Array.isArray(data.result)) {
        console.log('Found array in result with', data.result.length, 'items');
        return data.result;
      }
    }
    
    // Other common structures
    if (data.records && Array.isArray(data.records)) {
      console.log('Found records array with', data.records.length, 'items');
      return data.records;
    }
    
    if (data.data && Array.isArray(data.data)) {
      console.log('Found data array with', data.data.length, 'items');
      return data.data;
    }
    
    if (data.items && Array.isArray(data.items)) {
      console.log('Found items array with', data.items.length, 'items');
      return data.items;
    }
    
    if (data.tickets && Array.isArray(data.tickets)) {
      console.log('Found tickets array with', data.tickets.length, 'items');
      return data.tickets;
    }
    
    // Check for ticket properties to determine if it's a single ticket
    if (data.ticket_id || data.number || data.sys_id) {
      console.log('Found single ticket object');
      return [data];
    }
    
    // Last resort: search recursively for any array property that might contain tickets
    console.log('Searching recursively for ticket arrays...');
    
    // First, look for any property that's an array with objects that look like tickets
    for (const key in data) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        // Check if first item looks like a ticket
        const firstItem = data[key][0];
        if (typeof firstItem === 'object' && 
            (firstItem.ticket_id || firstItem.number || 
             firstItem.short_description || firstItem.status || 
             firstItem.priority)) {
          console.log(`Found likely ticket array in "${key}" with ${data[key].length} items`);
          return data[key];
        }
      }
    }
    
    // Then, look for nested objects that might contain ticket arrays
    for (const key in data) {
      if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
        const nestedTickets = extractTickets(data[key]);
        if (nestedTickets.length > 0) {
          return nestedTickets;
        }
      }
    }
    
    console.warn('No ticket data found in the structure');
    return [];
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

    // Read file preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawData = event.target?.result as string;
        console.log('Raw JSON data (first 200 chars):', rawData.substring(0, 200) + '...');
        
        const jsonData = JSON.parse(rawData);
        console.log('Parsed JSON type:', typeof jsonData);
        
        // Extract tickets using our helper function
        const extractedTickets = extractTickets(jsonData);
        
        if (extractedTickets.length === 0) {
          console.warn('Could not find any tickets in the JSON data');
          setUploadStatus('error');
          setErrorMessage('Could not find ticket data in this JSON file. Please check the format.');
          return;
        }
        
        console.log(`Successfully found ${extractedTickets.length} tickets`);
        // Store the original data for rendering and the extracted tickets for processing
        setPreviewData({
          original: jsonData,
          tickets: extractedTickets
        });
      } catch (error) {
        console.error('Error parsing JSON:', error);
        setUploadStatus('error');
        setErrorMessage('Invalid JSON format. Please check your file: ' + (error as Error).message);
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleSubmit = async () => {
    if (!file || !previewData) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      // Get the extracted tickets from our preview data
      const tickets = previewData.tickets;
      
      if (!tickets || tickets.length === 0) {
        throw new Error('No valid ticket data found');
      }
      
      console.log(`Processing ${tickets.length} tickets`);
      setTickets(tickets);
      
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

  const renderDataPreview = () => {
    if (!previewData) {
      return (
        <div className="mt-4 bg-yellow-50 text-yellow-700 p-3 rounded-md flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <span>No data loaded yet. Please select a file.</span>
        </div>
      );
    }

    try {
      const tickets = previewData.tickets;
      
      if (!tickets || tickets.length === 0) {
        throw new Error('No ticket data found in the JSON');
      }
      
      // Take first 3 tickets for preview
      const sample = tickets.slice(0, 3);
      
      // Format the JSON with proper indentation for better readability
      const formattedJson = JSON.stringify(sample, null, 2);

      // Try to determine the original structure
      const origData = previewData.original;
      let dataStructure = 'Custom Format';
      
      if (origData.result && origData.result.tickets) {
        dataStructure = 'Nested "result.tickets" Array';
      } else if (origData.result && Array.isArray(origData.result)) {
        dataStructure = 'ServiceNow API Result Array';
      } else if (origData.records) {
        dataStructure = 'Records Array';
      } else if (origData.tickets) {
        dataStructure = 'Tickets Array';
      } else if (Array.isArray(origData)) {
        dataStructure = 'Direct Array';
      }

      return (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Data Preview</h3>
          <div className="bg-slate-800 p-4 rounded border border-slate-700 overflow-auto max-h-80">
            <pre className="text-sm text-slate-100 font-mono whitespace-pre-wrap">{formattedJson}</pre>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Format:</span> {dataStructure}
            </p>
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
    } catch (error: any) {
      console.error('Error rendering data preview:', error);
      return (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md flex items-center">
          <FaExclamationTriangle className="mr-2" />
          <div>
            <p>Invalid ticket data format. Please check your JSON structure.</p>
            <p className="text-sm opacity-75 mt-1">Error: {error.message || 'Unknown error'}</p>
            <p className="text-sm mt-2">
              Try uploading a standard ServiceNow export file or check the console for debugging information.
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
        <h1 className="text-2xl font-bold mb-6">Import ServiceNow Tickets</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload JSON Data</h2>
          <p className="text-gray-600 mb-6">
            Export your tickets from ServiceNow in JSON format and upload the file here.
            We'll automatically parse and analyze the data.
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
              
              {renderDataPreview()}
              
              <div className="mt-6">
                <button
                  onClick={handleSubmit}
                  disabled={isUploading || uploadStatus === 'success'}
                  className={`font-medium py-2 px-6 rounded ${
                    isUploading ? 'bg-gray-400 cursor-not-allowed' : 
                    uploadStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                    'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
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
              <span>File processed successfully! You can now analyze your ticket data.</span>
            </div>
          )}
        </div>
        
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
          <h2 className="text-lg font-semibold mb-2 text-blue-900">How to Export ServiceNow Tickets</h2>
          <ol className="list-decimal pl-5 space-y-2 text-blue-800">
            <li>Log in to your ServiceNow instance</li>
            <li>Navigate to the <strong>Incident</strong> list view</li>
            <li>Use filters to select the tickets you want to analyze</li>
            <li>Click the <strong>Export</strong> button (usually in the upper right)</li>
            <li>Select <strong>JSON</strong> as the export format</li>
            <li>Download the file and upload it here</li>
          </ol>
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