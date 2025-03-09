import { Header } from "@/components/Header";
import Link from "next/link";
import { FaFileUpload, FaChartBar, FaSearch, FaLightbulb, FaServer, FaNetworkWired, FaDatabase } from "react-icons/fa";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto py-12 px-4">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            ServiceNow Ticket Analysis
          </h1>
          <p className="text-xl text-slate-700 mb-10 leading-relaxed">
            Transform your ServiceNow ticket data into actionable insights using advanced 
            analytics and machine learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/import" 
              className="btn-primary flex items-center justify-center gap-2 text-lg py-3 px-8"
            >
              <FaFileUpload /> Import Tickets
            </Link>
            <Link 
              href="/analyze" 
              className="btn-secondary flex items-center justify-center gap-2 text-lg py-3 px-8"
            >
              <FaSearch /> Query Data
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="card border-l-4 border-blue-500">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <FaFileUpload className="text-blue-600 text-2xl" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Import & Parse</h2>
            </div>
            <p className="text-lg text-slate-700">
              Import your ServiceNow ticket data in JSON format. Our system automatically parses the structure 
              and prepares it for in-depth analysis.
            </p>
          </div>
          
          <div className="card border-l-4 border-teal-500">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-100 mb-4">
                <FaChartBar className="text-teal-600 text-2xl" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Analyze & Visualize</h2>
            </div>
            <p className="text-lg text-slate-700">
              Automatically categorize tickets by issue type, affected software, resolution methods, 
              and time metrics with intuitive visualizations.
            </p>
          </div>
          
          <div className="card border-l-4 border-purple-500">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <FaLightbulb className="text-purple-600 text-2xl" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-slate-900">Query & Learn</h2>
            </div>
            <p className="text-lg text-slate-700">
              Ask questions about your ticket data in natural language. Our AI assistant provides 
              insights based on your historical data and patterns.
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md border border-slate-200 mb-16 overflow-hidden">
          <div className="bg-slate-800 text-white p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaServer className="text-cyan-400" />
              <span>Why Analyze ServiceNow Tickets?</span>
            </h2>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="bg-blue-100 p-2 rounded-full">
                    <FaNetworkWired className="text-blue-600 text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">Identify Recurring Issues</h3>
                  <p className="text-slate-700">
                    Discover patterns in support tickets to proactively address common problems 
                    before they impact more users and systems.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="bg-teal-100 p-2 rounded-full">
                    <FaDatabase className="text-teal-600 text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">Optimize Resource Allocation</h3>
                  <p className="text-slate-700">
                    Understand which software systems or departments require the most support 
                    to better allocate your IT resources and budget.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="bg-amber-100 p-2 rounded-full">
                    <FaChartBar className="text-amber-600 text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">Improve Resolution Time</h3>
                  <p className="text-slate-700">
                    Analyze resolution methods and time metrics to streamline your support 
                    process and reduce ticket resolution time.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="bg-indigo-100 p-2 rounded-full">
                    <FaLightbulb className="text-indigo-600 text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-slate-900">Data-Driven Decisions</h3>
                  <p className="text-slate-700">
                    Make informed IT strategy decisions based on concrete data rather than 
                    anecdotal evidence or assumptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="text-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-10 rounded-xl shadow-md">
          <h2 className="text-3xl font-bold mb-4">Ready to analyze your ServiceNow data?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto">
            Import your ServiceNow ticket data and discover insights that will transform 
            how your IT department operates and responds to issues.
          </p>
          <Link 
            href="/import" 
            className="bg-white text-blue-600 hover:bg-blue-50 font-semibold py-3 px-8 rounded-lg inline-flex items-center justify-center gap-2 text-lg shadow-sm hover:shadow transition-all"
          >
            <FaFileUpload /> Get Started
          </Link>
        </div>
      </main>
      
      <footer className="bg-slate-900 text-slate-300 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-0">ServiceNow Ticket Analysis Dashboard &copy; 2024</p>
        </div>
      </footer>
    </div>
  );
}
