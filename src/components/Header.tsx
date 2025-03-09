"use client";

import Link from 'next/link';
import { FaFileUpload, FaChartBar, FaSearch, FaQuestion, FaServer, FaHome, FaComments } from 'react-icons/fa';
import { useState } from 'react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-slate-800 text-white shadow-lg border-b border-slate-700">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center py-4 w-full sm:w-auto justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <FaServer className="text-cyan-400" />
              <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
                ServiceNow Analytics
              </span>
            </Link>
            <button 
              className="sm:hidden p-2 focus:outline-none" 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                )}
              </svg>
            </button>
          </div>
          
          <nav className={`${isMobileMenuOpen ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row w-full sm:w-auto py-2 sm:py-0 space-y-2 sm:space-y-0 sm:space-x-1`}>
            <NavLink href="/" icon={<FaHome />} text="Home" />
            <NavLink href="/import" icon={<FaFileUpload />} text="Import" />
            <NavLink href="/analyze" icon={<FaChartBar />} text="Analytics" />
            <NavLink href="/conversations" icon={<FaComments />} text="Conversations" />
            <NavLink href="/query" icon={<FaSearch />} text="Query" />
            <NavLink href="/help" icon={<FaQuestion />} text="Help" />
          </nav>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, icon, text }: { href: string; icon: React.ReactNode; text: string }) {
  return (
    <Link 
      href={href} 
      className="flex items-center gap-2 px-4 py-3 rounded-md font-medium transition-colors hover:bg-slate-700 text-slate-200 hover:text-white"
    >
      <span className="text-cyan-400">{icon}</span>
      <span>{text}</span>
    </Link>
  );
} 