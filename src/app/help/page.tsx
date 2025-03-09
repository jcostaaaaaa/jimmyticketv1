import { Header } from '@/components/Header';
import { FaFileUpload, FaChartBar, FaSearch, FaQuestionCircle, FaInfoCircle, FaBook } from 'react-icons/fa';
import Link from 'next/link';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Help & Documentation</h1>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <FaInfoCircle className="text-blue-500" />
              <h2 className="text-xl font-semibold">About This Application</h2>
            </div>
            
            <p className="text-gray-700 mb-4">
              The ServiceNow Ticket Analysis Dashboard is designed to help IT departments analyze their support ticket data, 
              identify patterns, and optimize their workflow. This application can parse JSON data exported from ServiceNow 
              and provide insights through advanced analytics and AI-powered querying.
            </p>
            
            <p className="text-gray-700">
              Key features include ticket categorization, pattern recognition, resolution time analysis, 
              and natural language querying capabilities to help you understand your support workload.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <FaFileUpload className="text-green-500" />
                <h2 className="text-lg font-semibold">Importing Data</h2>
              </div>
              
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Export your tickets from ServiceNow in JSON format</li>
                <li>Go to the <Link href="/import" className="text-blue-600 hover:underline">Import</Link> page</li>
                <li>Drag and drop your JSON file or click to select it</li>
                <li>Click &quot;Process File&quot; to analyze your data</li>
                <li>Once processing is complete, you can view analytics or query the data</li>
              </ol>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <FaChartBar className="text-purple-500" />
                <h2 className="text-lg font-semibold">Analyzing Tickets</h2>
              </div>
              
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Navigate to the <Link href="/analyze" className="text-blue-600 hover:underline">Analytics</Link> page</li>
                <li>Use the time period filter to focus on specific timeframes</li>
                <li>Filter by category to analyze specific types of tickets</li>
                <li>Expand the advanced filters for more detailed analysis</li>
                <li>Scroll through different charts and insights about your ticket data</li>
                <li>Export reports as needed for presentations or further analysis</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <FaSearch className="text-orange-500" />
                <h2 className="text-lg font-semibold">Querying Data</h2>
              </div>
              
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li>Go to the <Link href="/query" className="text-blue-600 hover:underline">Query</Link> page</li>
                <li>Enter a natural language question about your ticket data</li>
                <li>Example questions:
                  <ul className="list-disc list-inside ml-6 space-y-1 mt-1">
                    <li>What are the most common software issues?</li>
                    <li>Which tickets took the longest to resolve?</li>
                    <li>Compare resolution times between categories</li>
                  </ul>
                </li>
                <li>The AI will analyze your data and provide insights</li>
                <li>View related tickets that support the AI&apos;s conclusion</li>
              </ul>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-4">
                <FaQuestionCircle className="text-red-500" />
                <h2 className="text-lg font-semibold">FAQ</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800">What format should my ServiceNow export be in?</h3>
                  <p className="text-gray-700">Your export should be in JSON format. The application supports both individual ticket objects and arrays of ticket objects.</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800">How are tickets categorized?</h3>
                  <p className="text-gray-700">The application uses natural language processing to analyze ticket descriptions and categorize them based on issue type, affected software, and resolution methods.</p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-800">Is my data secure?</h3>
                  <p className="text-gray-700">All data processing happens locally in your browser. Your ticket data is not sent to any external servers for analysis.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <FaBook className="text-blue-500" />
              <h2 className="text-lg font-semibold">Additional Resources</h2>
            </div>
            
            <ul className="list-disc list-inside space-y-2 text-blue-800">
              <li><a href="#" className="hover:underline">ServiceNow Export Guide</a></li>
              <li><a href="#" className="hover:underline">Understanding Ticket Analytics</a></li>
              <li><a href="#" className="hover:underline">Best Practices for IT Support</a></li>
              <li><a href="#" className="hover:underline">Contact Support</a></li>
            </ul>
          </div>
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