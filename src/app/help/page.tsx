import React from 'react';
import { Header } from '@/components/Header';
import { FaLightbulb, FaFileUpload, FaServer, FaChartBar, FaDatabase, FaNetworkWired } from 'react-icons/fa';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#E0E0E0]">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-[#E0E0E0]">Help & Documentation</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-[#FF8000] orange-border">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3C3C3C] mr-3">
                <FaLightbulb className="text-[#FF8000] text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-[#E0E0E0]">Getting Started</h2>
            </div>
            <p className="mb-4 text-[#E0E0E0]">
              Welcome to the Jimmy Ticket Analyzer! This application helps you analyze IT support tickets to gain insights 
              and improve your support processes. Here&apos;s how to get started:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-[#E0E0E0]">
              <li>Import your ticket data using the Import page</li>
              <li>View analytics and insights on the Analyze page</li>
              <li>Track learning points in the Journal page</li>
              <li>Browse individual tickets on the Tickets page</li>
            </ol>
          </div>
          
          <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-[#FF8000] orange-border">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3C3C3C] mr-3">
                <FaFileUpload className="text-[#FF8000] text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-[#E0E0E0]">Supported File Formats</h2>
            </div>
            <p className="mb-4 text-[#E0E0E0]">
              The application supports the following file formats for ticket data import:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[#E0E0E0]">
              <li>CSV files (.csv)</li>
              <li>JSON files (.json)</li>
              <li>Excel files (.xlsx, .xls)</li>
              <li>ServiceNow export files</li>
              <li>Jira export files</li>
              <li>Zendesk export files</li>
            </ul>
            <p className="mt-4 text-[#E0E0E0]">
              Files should contain ticket data with fields such as ID, description, status, creation date, and resolution date.
            </p>
          </div>
        </div>
        
        <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 mb-8 border-l-4 border-l-[#FF8000] orange-border">
          <div className="flex items-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3C3C3C] mr-3">
              <FaServer className="text-[#FF8000] text-xl" />
            </div>
            <h2 className="text-xl font-semibold text-[#E0E0E0]">Features & Functionality</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-[#FF8000]">Ticket Analysis</h3>
              <p className="text-[#E0E0E0]">
                The Analyze page provides comprehensive analytics on your ticket data, including:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-[#E0E0E0]">
                <li>Ticket volume trends over time</li>
                <li>Average resolution time</li>
                <li>Category distribution</li>
                <li>Priority distribution</li>
                <li>Top assignees</li>
                <li>Resolution efficiency</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2 text-[#FF8000]">Learning Journal</h3>
              <p className="text-[#E0E0E0]">
                The Journal page helps you track learning points from resolved tickets:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-[#E0E0E0]">
                <li>Automatically extract technical issues from tickets</li>
                <li>Identify specific hardware and software components that failed</li>
                <li>Track resolution methods for common problems</li>
                <li>Tag entries for easy categorization and searching</li>
                <li>Generate AI-powered journal entries with detailed technical analysis</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-[#FF8000] orange-border">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3C3C3C] mr-3">
                <FaChartBar className="text-[#FF8000] text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-[#E0E0E0]">Analytics Guide</h2>
            </div>
            <p className="text-[#E0E0E0]">
              Learn how to interpret the analytics data and use it to improve your support processes.
              The analytics dashboard provides actionable insights based on historical ticket data.
            </p>
            <button className="mt-4 bg-[#FF8000] hover:bg-[#F76B00] text-[#E0E0E0] font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all">
              View Guide
            </button>
          </div>
          
          <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-[#FF8000] orange-border">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3C3C3C] mr-3">
                <FaDatabase className="text-[#FF8000] text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-[#E0E0E0]">Data Management</h2>
            </div>
            <p className="text-[#E0E0E0]">
              Learn how to manage your imported data, update existing records, and ensure data quality.
              Proper data management ensures accurate analytics and insights.
            </p>
            <button className="mt-4 bg-[#FF8000] hover:bg-[#F76B00] text-[#E0E0E0] font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all">
              View Guide
            </button>
          </div>
          
          <div className="bg-[#2B2B2B] border border-[#3C3C3C] rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border-l-4 border-l-[#FF8000] orange-border">
            <div className="flex items-center mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#3C3C3C] mr-3">
                <FaNetworkWired className="text-[#FF8000] text-xl" />
              </div>
              <h2 className="text-xl font-semibold text-[#E0E0E0]">API Integration</h2>
            </div>
            <p className="text-[#E0E0E0]">
              Learn how to integrate with ticket systems via API to automate data import.
              The application supports OpenAI API integration for enhanced journal entry generation.
            </p>
            <button className="mt-4 bg-[#FF8000] hover:bg-[#F76B00] text-[#E0E0E0] font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all">
              View Guide
            </button>
          </div>
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