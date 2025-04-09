import { Header } from "@/components/Header";
import Link from "next/link";
import { FaFileUpload, FaChartBar, FaSearch, FaLightbulb, FaServer, FaNetworkWired, FaDatabase, FaComments, FaChartPie } from "react-icons/fa";
import { ResolutionEfficiencyChart } from "@/components/ResolutionEfficiencyChart";

// Note: For client components that need these imports, create a separate file with 'use client' directive
// import Image from "next/image";
// import { useRouter } from "next/navigation";
// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1A1A1A]">

      
      <Header />
      
      <main className="container mx-auto py-12 px-4">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#FF8000] to-[#FFA700] bg-clip-text text-transparent orange-gradient">
            ServiceNow Ticket Analysis
          </h1>
          <p className="text-xl text-[#E0E0E0] mb-10 leading-relaxed">
            Transform your ServiceNow ticket data and customer conversations into actionable insights using advanced 
            analytics and machine learning.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/import" 
              className="bg-[#FF8000] hover:bg-[#F76B00] text-[#E0E0E0] font-medium py-3 px-8 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-lg orange-bg"
            >
              <FaFileUpload /> Import Data
            </Link>
            <Link 
              href="/analyze" 
              className="bg-[#3C3C3C] hover:bg-[#2B2B2B] text-[#FF8000] border border-[#3C3C3C] font-medium py-3 px-8 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 text-lg orange-text"
            >
              <FaSearch /> Query Data
            </Link>
          </div>
        </div>
        
        {/* Analytics Dashboard Preview */}
        <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-lg p-6 mb-16">
          <h2 className="text-2xl font-bold mb-6 text-[#E0E0E0]">Analytics Dashboard Preview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Resolution Efficiency KPI */}
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#3C3C3C] flex flex-col items-center justify-center">
              <h3 className="font-semibold text-[#E0E0E0] mb-4">Resolution Efficiency</h3>
              <ResolutionEfficiencyChart 
                score={78} 
                size={180} 
                strokeWidth={12} 
                className="mb-4" 
                tooltipText="Click to view journal"
                journalPath="/journal"
              />
              <p className="text-[#A0A0A0] text-sm text-center mt-2">
                Based on 1,248 tickets resolved in the last 30 days
              </p>
            </div>
            
            {/* Other KPI cards can be added here */}
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#3C3C3C]">
              <h3 className="font-semibold text-[#E0E0E0] mb-4">Average Resolution Time</h3>
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <span className="text-4xl font-bold text-[#FF8000]">4.2</span>
                  <span className="text-xl text-[#E0E0E0] ml-2">hours</span>
                  <p className="text-[#A0A0A0] text-sm mt-2">↓ 12% from last month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#3C3C3C]">
              <h3 className="font-semibold text-[#E0E0E0] mb-4">Customer Satisfaction</h3>
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <span className="text-4xl font-bold text-[#4CAF50]">92</span>
                  <span className="text-xl text-[#E0E0E0] ml-2">%</span>
                  <p className="text-[#A0A0A0] text-sm mt-2">↑ 5% from last month</p>
                </div>
              </div>
            </div>
            
            <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#3C3C3C]">
              <h3 className="font-semibold text-[#E0E0E0] mb-4">First Response Time</h3>
              <div className="flex items-center justify-center h-40">
                <div className="text-center">
                  <span className="text-4xl font-bold text-[#FF8000]">18</span>
                  <span className="text-xl text-[#E0E0E0] ml-2">min</span>
                  <p className="text-[#A0A0A0] text-sm mt-2">↓ 22% from last month</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              href="/analytics" 
              className="bg-[#3C3C3C] hover:bg-[#2B2B2B] text-[#FF8000] border border-[#3C3C3C] font-medium py-2 px-6 rounded-lg inline-flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all"
            >
              <FaChartBar /> View Full Analytics Dashboard
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-[#FF8000] orange-border">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3C3C3C] mb-4">
                <FaFileUpload className="text-[#FF8000] text-2xl orange-text" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#E0E0E0]">Import & Parse</h2>
            </div>
            <p className="text-lg text-[#E0E0E0]">
              Import your ServiceNow ticket data and conversation history in JSON format. Our system automatically parses the structure 
              and prepares it for in-depth analysis.
            </p>
          </div>
          
          <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-[#FF8000] orange-border">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3C3C3C] mb-4">
                <FaChartBar className="text-[#FF8000] text-2xl orange-text" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#E0E0E0]">Analyze & Visualize</h2>
            </div>
            <p className="text-lg text-[#E0E0E0]">
              Automatically categorize tickets by issue type and analyze conversations for sentiment, 
              agent performance, and resolution efficiency with intuitive visualizations.
            </p>
          </div>
          
          <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-[#FF8000] orange-border">
            <div className="text-center mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#3C3C3C] mb-4">
                <FaLightbulb className="text-[#FF8000] text-2xl orange-text" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[#E0E0E0]">Query & Learn</h2>
            </div>
            <p className="text-lg text-[#E0E0E0]">
              Ask natural language questions about your ticket data and get instant insights. 
              Our AI-powered system learns from your queries to provide better recommendations.
            </p>
          </div>
        </div>
        
        <div className="bg-[#2B2B2B] rounded-xl shadow-md border border-[#3C3C3C] mb-16 overflow-hidden">
          <div className="bg-[#1A1A1A] text-[#E0E0E0] p-6 border-b border-[#3C3C3C]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaServer className="text-[#FFA500]" />
              <span>Comprehensive IT Support Analytics</span>
            </h2>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="bg-[#3C3C3C] p-2 rounded-full">
                    <FaNetworkWired className="text-[#FFA500] text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#E0E0E0]">Identify Recurring Issues</h3>
                  <p className="text-[#E0E0E0]">
                    Discover patterns in support tickets to proactively address common problems 
                    before they impact more users and systems.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="bg-[#3C3C3C] p-2 rounded-full">
                    <FaDatabase className="text-[#FFA500] text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#E0E0E0]">Optimize Resource Allocation</h3>
                  <p className="text-[#E0E0E0]">
                    Understand which software systems or departments require the most support 
                    to better allocate your IT resources and budget.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="bg-[#3C3C3C] p-2 rounded-full">
                    <FaChartBar className="text-[#FFA500] text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#E0E0E0]">Improve Resolution Time</h3>
                  <p className="text-[#E0E0E0]">
                    Analyze resolution methods and time metrics to streamline your support 
                    process and reduce ticket resolution time.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="mt-1">
                  <div className="bg-[#3C3C3C] p-2 rounded-full">
                    <FaLightbulb className="text-[#FFA500] text-xl" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-3 text-[#E0E0E0]">Data-Driven Decisions</h3>
                  <p className="text-[#E0E0E0]">
                    Make informed IT strategy decisions based on concrete data rather than 
                    anecdotal evidence or assumptions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resolution Efficiency Metrics Section */}
        <div className="bg-[#2B2B2B] rounded-xl shadow-md border border-[#3C3C3C] mb-16 overflow-hidden">
          <div className="bg-[#3C3C3C] text-[#E0E0E0] p-6 border-b border-[#3C3C3C]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaChartBar className="text-[#FFA500]" />
              <span>Resolution Efficiency Metrics</span>
            </h2>
          </div>
          
          <div className="p-8">
            <p className="text-xl text-[#E0E0E0] mb-6">
              Track and analyze resolution efficiency across different categories to identify areas for improvement.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#3C3C3C] flex flex-col items-center">
                <h3 className="font-semibold text-[#E0E0E0] mb-4">Hardware Issues</h3>
                <ResolutionEfficiencyChart 
                  score={92} 
                  size={100} 
                  animated={true} 
                  tooltipText="Hardware resolution efficiency"
                />
              </div>
              
              <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#3C3C3C] flex flex-col items-center">
                <h3 className="font-semibold text-[#E0E0E0] mb-4">Software Issues</h3>
                <ResolutionEfficiencyChart 
                  score={78} 
                  size={100} 
                  animated={true}
                  tooltipText="Software resolution efficiency"
                />
              </div>
              
              <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#3C3C3C] flex flex-col items-center">
                <h3 className="font-semibold text-[#E0E0E0] mb-4">Network Issues</h3>
                <ResolutionEfficiencyChart 
                  score={85} 
                  size={100} 
                  animated={true}
                  tooltipText="Network resolution efficiency"
                />
              </div>
              
              <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#3C3C3C] flex flex-col items-center">
                <h3 className="font-semibold text-[#E0E0E0] mb-4">Overall Efficiency</h3>
                <ResolutionEfficiencyChart 
                  score={84} 
                  size={100} 
                  animated={true}
                  tooltipText="Overall resolution efficiency"
                />
              </div>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={() => window.location.href = '/journal'}
                className="px-6 py-3 bg-[#FF8000] hover:bg-[#F76B00] text-[#E0E0E0] rounded-lg flex items-center gap-2 transition-colors"
              >
                <FaChartBar />
                View Detailed Efficiency Journal
              </button>
            </div>
          </div>
        </div>
        
        {/* Conversation History Analysis Section */}
        <div className="bg-[#2B2B2B] rounded-xl shadow-md border border-[#3C3C3C] mb-16 overflow-hidden">
          <div className="bg-[#3C3C3C] text-[#E0E0E0] p-6 border-b border-[#3C3C3C]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaComments className="text-[#FFA500]" />
              <span>New: Conversation History Analysis</span>
            </h2>
          </div>
          
          <div className="p-8">
            <p className="text-xl text-[#E0E0E0] mb-6">
              Our platform now supports conversation history analysis, helping you gain deeper insights into customer 
              interactions and support agent performance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#3C3C3C]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-[#3C3C3C] p-2 rounded-full">
                    <FaChartPie className="text-[#FF8000]" />
                  </div>
                  <h3 className="font-semibold text-[#E0E0E0]">Sentiment Analysis</h3>
                </div>
                <p className="text-[#E0E0E0]">
                  Automatically detect customer sentiment to identify pain points and measure satisfaction throughout interactions.
                </p>
              </div>
              
              <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#3C3C3C]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-[#3C3C3C] p-2 rounded-full">
                    <FaLightbulb className="text-[#FF8000]" />
                  </div>
                  <h3 className="font-semibold text-[#E0E0E0]">Topic Detection</h3>
                </div>
                <p className="text-[#E0E0E0]">
                  Identify common topics and categorize conversations to understand what issues are most frequently discussed.
                </p>
              </div>
              
              <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#3C3C3C]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-[#3C3C3C] p-2 rounded-full">
                    <FaChartBar className="text-[#FF8000]" />
                  </div>
                  <h3 className="font-semibold text-[#E0E0E0]">Agent Performance</h3>
                </div>
                <div className="flex flex-col items-center mt-4">
                  <p className="text-[#E0E0E0] text-center">
                    Track agent performance metrics including response times and resolution rates.
                  </p>
                </div>
                <p className="text-[#E0E0E0]">
                  Analyze response times, resolution rates, and customer satisfaction scores to evaluate and improve agent performance.
                </p>
              </div>
            </div>
            
            <div className="text-center">
              <Link 
                href="/conversations" 
                className="bg-[#FF8000] hover:bg-[#F76B00] text-[#E0E0E0] font-medium py-2 px-6 rounded-lg inline-flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all"
              >
                <FaComments /> Explore Conversation Analysis
              </Link>
            </div>
          </div>
        </div>
        
        <div className="text-center bg-gradient-to-r from-[#2B2B2B] to-[#3C3C3C] p-10 rounded-xl shadow-md border border-[#3C3C3C]">
          <h2 className="text-3xl font-bold mb-4 text-[#E0E0E0]">Ready to analyze your IT support data?</h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto text-[#E0E0E0]">
            Import your ServiceNow ticket data and customer conversations to discover insights that will transform 
            how your IT department operates and responds to issues.
          </p>
          <Link 
            href="/import" 
            className="bg-[#FF8000] text-[#E0E0E0] hover:bg-[#F76B00] font-semibold py-3 px-8 rounded-lg inline-flex items-center justify-center gap-2 text-lg shadow-sm hover:shadow transition-all"
          >
            <FaFileUpload /> Get Started
          </Link>
        </div>
        
        {/* Dedicated Analytics Section */}
        <div className="bg-[#2B2B2B] rounded-xl shadow-md border border-[#3C3C3C] mb-16 overflow-hidden">
          <div className="bg-[#3C3C3C] text-[#E0E0E0] p-6 border-b border-[#3C3C3C]">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <FaChartBar className="text-[#FFA500]" />
              <span>Resolution Efficiency Analytics</span>
            </h2>
          </div>
          <div className="p-8">
            <div className="flex justify-center">
              <ResolutionEfficiencyChart 
                score={84} 
                size={200} 
                animated={true}
                tooltipText="Click to view journal"
                journalPath="/journal"
              />
            </div>
          </div>
        </div>
        
        {/* Version indicator */}
        <div className="fixed bottom-2 right-2 text-[#A0A0A0] text-sm font-mono">
          v28
        </div>
      </main>
      
      <footer className="bg-[#1A1A1A] text-[#A0A0A0] py-8 mt-auto border-t border-[#3C3C3C]">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-0">ServiceNow Ticket Analysis Dashboard &copy; 2024</p>
        </div>
      </footer>
    </div>
  );
}
