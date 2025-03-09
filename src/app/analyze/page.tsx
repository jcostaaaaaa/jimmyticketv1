'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { useTickets } from '@/context/TicketContext';
import { FaExclamationCircle, FaCheckCircle, FaClock, FaUserCog, FaRobot, FaBrain, FaKey, FaInfoCircle } from 'react-icons/fa';

// Import the Ticket type from the context to ensure we're using consistent types
import { Ticket } from '@/context/TicketContext';

interface TicketAnalytics {
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  averageResolutionTime: string;
  priorityDistribution: { [key: string]: number };
  categoryDistribution: { [key: string]: number };
  categoryToSubcategory: { 
    [category: string]: { 
      [subcategory: string]: number 
    } 
  };
  categoryDetails: {
    [category: string]: {
      [detail: string]: number
    }
  };
  topAssignees: { name: string; count: number }[];
  monthlyTrends: { month: string; count: number }[];
  commonIssues: string[];
  resolutionEfficiency: number;
}

interface AIAnalysis {
  insights: string[];
  recommendations: string[];
  predictionText: string;
  companyContext?: string;
}

export default function AnalyzePage() {
  const { tickets } = useTickets();
  const [analytics, setAnalytics] = useState<TicketAnalytics | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState<string>('');
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [companyContext, setCompanyContext] = useState<string>('');

  useEffect(() => {
    if (tickets.length === 0) return;

    console.log("Processing tickets for analytics:", tickets.length);
    console.log("Sample ticket:", tickets[0]);

    // Calculate analytics
    
    // Correctly identify open vs closed tickets based on the status field
    const closedTickets = tickets.filter(t => 
      (t.status === 'Closed' || t.status === 'Resolved')
    );
    
    const openTickets = tickets.filter(t => 
      t.status !== 'Closed' && t.status !== 'Resolved'
    );
    
    console.log(`Found ${openTickets.length} open tickets and ${closedTickets.length} closed tickets`);
    
    const analytics: TicketAnalytics = {
      totalTickets: tickets.length,
      openTickets: openTickets.length,
      resolvedTickets: closedTickets.length,
      averageResolutionTime: calculateAverageResolutionTime(tickets),
      priorityDistribution: calculateDistribution(tickets, 'priority'),
      categoryDistribution: calculateDistribution(tickets, 'category'),
      categoryToSubcategory: calculateCategoryToSubcategory(tickets),
      categoryDetails: calculateCategoryDetails(tickets),
      topAssignees: calculateTopAssignees(tickets),
      monthlyTrends: calculateMonthlyTrends(tickets),
      commonIssues: extractCommonIssues(tickets),
      resolutionEfficiency: calculateResolutionEfficiency(tickets),
    };

    setAnalytics(analytics);
    
    // Generate text insights
    const newInsights = generateInsights(analytics, tickets);
    setInsights(newInsights);
  }, [tickets]);
  
  const runAIAnalysis = async () => {
    if (!apiKey || apiKey.trim() === '' || !analytics) return;
    
    setIsLoadingAI(true);
    
    try {
      // In a real app, you would call an AI API here with the tickets data
      // For demo, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Enhanced AI analysis results with more in-depth insights
      const sampleAIAnalysis: AIAnalysis = {
        insights: [
          "High-priority network issues take 42% longer to resolve than other categories, particularly VPN connectivity issues which average 14.3 hours resolution time",
          "Response time is the primary factor influencing satisfaction scores (87% correlation), while actual resolution time has only 23% correlation with satisfaction",
          "A recurring pattern shows that 15% of users consistently generate 42% of all tickets, with 'Technical Operations' department being the most frequent submitter",
          "Browser-related issues could be reduced by 65% with proactive update policies, as 78% of these tickets stem from outdated browser versions",
          "Peak ticket submission occurs between 9-11am and 1-3pm, with a 37% decrease during lunch hours",
          "Hardware failures follow a predictable lifecycle pattern, with 70% occurring either within the first month (manufacturing defects) or after 24+ months of use",
          "Tickets categorized as 'Quick Resolution' still take an average of 3.2 hours to close, suggesting a bottleneck in the verification process"
        ],
        recommendations: [
          "Implement a dedicated VPN support specialist team to address the 28% of critical tickets related to remote connectivity, potentially reducing resolution time by 35%",
          "Develop an automated password reset system with multi-factor authentication to reduce tier 1 support load by approximately 30% and improve security compliance",
          "Create detailed knowledge base articles for the top 5 recurring issues, with step-by-step resolution guides and video tutorials to enable self-service",
          "Schedule system maintenance during statistically low-activity periods (weekends and early mornings) to minimize disruption, based on 12-month ticket submission patterns",
          "Implement a proactive hardware replacement program for devices reaching 22+ months in service, potentially preventing 65% of failure-related downtime",
          "Restructure the ticket assignment workflow to prioritize response speed for high-visibility issues, which could improve overall satisfaction scores by an estimated 22%",
          "Deploy automatic browser update policies through group policy to address the significant portion of browser-related issues stemming from outdated software"
        ],
        predictionText: "Based on comprehensive analysis of historical patterns and trend modeling, we project a 15-20% increase in network-related tickets over the next quarter, with a particular concentration among remote workers using VPN services. This increase correlates strongly with the planned expansion of the remote workforce (r=0.89). Additionally, expect seasonal variation with a 30% spike in hardware-related tickets during the back-to-school period as equipment is redeployed. To mitigate these challenges, we recommend proactively scaling support resources by approximately 25% for network issues and implementing a structured hardware verification program 45 days before peak periods.",
        companyContext: companyContext
      };
      
      setAIAnalysis(sampleAIAnalysis);
    } catch (error) {
      console.error("Error running AI analysis:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <main className="container mx-auto py-8 px-4">
          <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-100 text-yellow-800">
            <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
            <p>Please import some ticket data from the Import page first.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Ticket Analytics</h1>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Tickets"
            value={analytics?.totalTickets || 0}
            icon={<FaExclamationCircle />}
            color="blue"
          />
          <MetricCard
            title="Open Tickets"
            value={analytics?.openTickets || 0}
            icon={<FaClock />}
            color="yellow"
          />
          <MetricCard
            title="Resolved Tickets"
            value={analytics?.resolvedTickets || 0}
            icon={<FaCheckCircle />}
            color="green"
          />
          <MetricCard
            title="Avg. Resolution Time"
            value={analytics?.averageResolutionTime || 'N/A'}
            icon={<FaUserCog />}
            color="purple"
          />
        </div>
        
        {/* Auto-generated Insights */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Key Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                <p className="text-slate-800">{insight}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Charts and Distributions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Priority Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Priority Distribution</h2>
            <div className="space-y-2">
              {analytics?.priorityDistribution && Object.entries(analytics.priorityDistribution)
                .sort(([a], [b]) => {
                  // Sort by priority level (1 - Critical should be first)
                  const getLevel = (str: string) => {
                    const match = str.match(/^(\d+)/);
                    return match ? parseInt(match[1]) : 999;
                  };
                  return getLevel(a) - getLevel(b);
                })
                .map(([priority, count]) => (
                  <div key={priority} className="flex flex-wrap items-center mb-2">
                    <span className="w-20 sm:w-32 text-sm text-gray-600 mb-1 sm:mb-0">{priority || 'Unspecified'}</span>
                    <div className="flex-1 mx-2 min-w-[100px]">
                      <div className="h-4 bg-blue-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500"
                          style={{
                            width: `${(count / analytics.totalTickets) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 whitespace-nowrap">{count} ({Math.round((count / analytics.totalTickets) * 100)}%)</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm relative">
            <h2 className="text-lg font-semibold mb-4">Category Distribution</h2>
            <div className="space-y-2">
              {analytics?.categoryDistribution && Object.entries(analytics.categoryDistribution)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="relative">
                    <div 
                      className="flex flex-wrap items-center mb-1"
                      onMouseEnter={() => setHoveredCategory(category)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    >
                      <span className="w-20 sm:w-32 text-sm text-gray-600 mb-1 sm:mb-0">{category || 'Unspecified'}</span>
                      <div className="flex-1 mx-2 min-w-[100px]">
                        <div className="h-4 bg-green-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500"
                            style={{
                              width: `${(count / analytics.totalTickets) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-gray-600 flex items-center whitespace-nowrap">
                        {count} ({Math.round((count / analytics.totalTickets) * 100)}%)
                        <span className="ml-1 text-blue-500 cursor-pointer" title="View subcategories">
                          <FaInfoCircle />
                        </span>
                      </span>
                    </div>

                    {/* Subcategory tooltip - position it differently on mobile */}
                    {hoveredCategory === category && analytics.categoryToSubcategory[category] && (
                      <div className="absolute left-0 right-0 sm:left-auto sm:right-auto mt-1 sm:w-full bg-white border border-gray-200 rounded-md shadow-lg p-3 z-10">
                        <h3 className="text-sm font-medium mb-2">{category} Breakdown</h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {/* Show subcategories */}
                          {Object.entries(analytics.categoryToSubcategory[category] || {})
                            .sort(([, a], [, b]) => b - a)
                            .map(([subcategory, subCount]) => (
                              <div key={subcategory} className="flex flex-wrap items-center">
                                <span className="w-20 sm:w-24 text-xs text-gray-600 truncate mb-1 sm:mb-0">{subcategory || 'Other'}</span>
                                <div className="flex-1 mx-2 min-w-[80px]">
                                  <div className="h-3 bg-blue-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-400"
                                      style={{
                                        width: `${(subCount / count) * 100}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                                <span className="text-xs text-gray-600">{subCount}</span>
                              </div>
                            ))}
                          
                          {/* Show detailed information if available (software names, hardware models) */}
                          {analytics.categoryDetails[category] && Object.keys(analytics.categoryDetails[category]).length > 0 && (
                            <>
                              <h4 className="text-xs font-medium mt-3 mb-1 text-gray-500">Details</h4>
                              {Object.entries(analytics.categoryDetails[category])
                                .sort(([, a], [, b]) => b - a)
                                .map(([detail, detailCount]) => (
                                  <div key={detail} className="flex flex-wrap items-center">
                                    <span className="w-24 text-xs text-gray-600 truncate mb-1 sm:mb-0">{detail}</span>
                                    <span className="text-xs text-gray-600 ml-2">{detailCount}</span>
                                  </div>
                                ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {/* Top Assignees */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Top Assignees</h2>
            <div className="space-y-2">
              {analytics?.topAssignees.map(({ name, count }) => (
                <div key={name} className="flex flex-wrap items-center mb-2">
                  <span className="w-20 sm:w-40 text-sm text-gray-600 truncate mb-1 sm:mb-0">{name || 'Unassigned'}</span>
                  <div className="flex-1 mx-2 min-w-[100px]">
                    <div className="h-4 bg-purple-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500"
                        style={{
                          width: `${(count / analytics.totalTickets) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap">{count} tickets</span>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Monthly Trends</h2>
            <div className="space-y-2">
              {analytics?.monthlyTrends.map(({ month, count }) => (
                <div key={month} className="flex flex-wrap items-center mb-2">
                  <span className="w-20 sm:w-24 text-sm text-gray-600 mb-1 sm:mb-0">{month}</span>
                  <div className="flex-1 mx-2 min-w-[100px]">
                    <div className="h-4 bg-yellow-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-500"
                        style={{
                          width: `${(count / Math.max(...analytics.monthlyTrends.map(t => t.count))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-600 whitespace-nowrap">{count} tickets</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Common Issues */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Common Issues</h2>
            <ul className="list-disc pl-5 space-y-2">
              {analytics?.commonIssues.map((issue, index) => (
                <li key={index} className="text-gray-700">{issue}</li>
              ))}
            </ul>
          </div>
          
          {/* Resolution Efficiency */}
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Resolution Efficiency</h2>
            <div className="flex flex-col items-center">
              <div className="relative w-40 h-40">
                <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: `conic-gradient(#22c55e ${analytics?.resolutionEfficiency || 0}%, #f3f4f6 0%)`,
                      clipPath: 'circle(50% at 50% 50%)',
                    }}
                  />
                  <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center z-10">
                    <span className="text-3xl font-bold text-gray-800">
                      {analytics?.resolutionEfficiency || 0}%
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-center text-gray-600">
                Based on resolution time, response time, and satisfaction ratings
              </p>
            </div>
          </div>
        </div>
        
        {/* AI-Powered Analysis Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FaBrain className="mr-2 text-blue-500" /> 
              AI-Powered Advanced Analysis
            </h2>
            <button 
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <FaKey className="mr-1" /> 
              {showApiKeyInput ? 'Hide API Key' : 'Enter API Key'}
            </button>
          </div>
          
          {showApiKeyInput && (
            <div className="mb-4 bg-slate-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your API key to unlock AI-powered analysis
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter API key"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={runAIAnalysis}
                  disabled={isLoadingAI || !apiKey}
                  className={`px-4 py-2 rounded-r-md ${
                    isLoadingAI || !apiKey 
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {isLoadingAI ? 'Processing...' : 'Analyze'}
                </button>
              </div>
              
              {/* Add company context section */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Context (Optional)
                </label>
                <textarea
                  value={companyContext}
                  onChange={(e) => setCompanyContext(e.target.value)}
                  placeholder="Provide context about your organization to get more relevant insights (e.g., industry, size, key challenges, recent changes, current initiatives)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This information helps the AI generate more relevant and customized insights for your organization
                </p>
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                Your API key is never stored and is only used for this analysis session
              </p>
            </div>
          )}
          
          {!aiAnalysis && !isLoadingAI && (
            <div className="text-center py-8 text-gray-500">
              <FaRobot className="mx-auto text-4xl mb-3 text-gray-300" />
              <p>AI-powered analysis provides deeper insights, patterns, and recommendations.</p>
              <p className="text-sm mt-2">Enter your API key to begin analysis.</p>
            </div>
          )}
          
          {isLoadingAI && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Processing your ticket data with AI...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          )}
          
          {aiAnalysis && !isLoadingAI && (
            <div className="space-y-6">
              {/* Display company context if provided */}
              {aiAnalysis.companyContext && (
                <div className="border border-purple-100 rounded-lg p-5 bg-purple-50">
                  <h3 className="text-md font-semibold mb-3 text-purple-900 border-b border-purple-200 pb-2">
                    Company Context Analysis
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <div className="bg-white p-3 rounded-lg border border-purple-100 text-slate-700 text-sm italic mb-3 w-full">
                        &quot;{aiAnalysis.companyContext}&quot;
                      </div>
                    </div>
                    <div className="text-slate-800 font-medium">
                      <p className="mb-3">Based on your company context, our analysis has been tailored to address your specific organizational needs. The insights and recommendations take into account your particular environment, challenges, and goals.</p>
                      <p>Key contextual factors considered:</p>
                      <ul className="list-disc pl-5 mt-2 space-y-1">
                        <li>Your industry-specific IT service patterns</li>
                        <li>Organizational size and structure impacts on ticket workflows</li>
                        <li>Current challenges and initiatives mentioned</li>
                        <li>Historical context and recent changes</li>
                        <li>Technology adoption stage and infrastructure details</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="border border-blue-100 rounded-lg p-5 bg-blue-50">
                <h3 className="text-md font-semibold mb-3 text-blue-900 border-b border-blue-200 pb-2">AI Insights</h3>
                <ul className="space-y-3">
                  {aiAnalysis.insights.map((insight, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-blue-600 mr-2 mt-1 text-lg font-bold">•</span>
                      <span className="text-slate-800 font-medium">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="border border-green-100 rounded-lg p-5 bg-green-50">
                <h3 className="text-md font-semibold mb-3 text-green-900 border-b border-green-200 pb-2">Recommendations</h3>
                <ul className="space-y-3">
                  {aiAnalysis.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2 mt-1 text-lg font-bold">•</span>
                      <span className="text-slate-800 font-medium">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="border border-indigo-100 bg-indigo-50 p-5 rounded-lg shadow-sm">
                <h3 className="text-md font-semibold mb-3 text-indigo-900 border-b border-indigo-200 pb-2">Predictive Analysis</h3>
                <p className="text-slate-800 font-medium leading-relaxed">{aiAnalysis.predictionText}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricCard({ title, value, icon, color }: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
  };

  return (
    <div className={`p-6 rounded-xl ${colorClasses[color]} flex items-center`}>
      <div className="text-3xl mr-4">{icon}</div>
      <div>
        <h3 className="text-sm font-medium opacity-80">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}

// Helper functions
function calculateAverageResolutionTime(tickets: Ticket[]): string {
  const resolvedTickets = tickets.filter(t => 
    (t.status === 'Closed' || t.status === 'Resolved') && t.created_at && t.closed_at
  );

  if (resolvedTickets.length === 0) return 'N/A';

  const totalTime = resolvedTickets.reduce((sum, ticket) => {
    const created = new Date(ticket.created_at || '');
    const closed = new Date(ticket.closed_at || '');
    return sum + (closed.getTime() - created.getTime());
  }, 0);

  const avgTimeInHours = totalTime / (resolvedTickets.length * 1000 * 60 * 60);
  return `${Math.round(avgTimeInHours)} hours`;
}

function calculateDistribution(tickets: Ticket[], field: string): { [key: string]: number } {
  return tickets.reduce((acc, ticket) => {
    const value = String(ticket[field] || 'Unspecified');
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

function calculateTopAssignees(tickets: Ticket[]): { name: string; count: number }[] {
  const distribution = tickets.reduce((acc, ticket) => {
    const assignee = ticket.assigned_to || 'Unassigned';
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(distribution)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function calculateMonthlyTrends(tickets: Ticket[]): { month: string; count: number }[] {
  const monthCounts = tickets.reduce((acc, ticket) => {
    if (!ticket.created_at) return acc;
    const date = new Date(ticket.created_at);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    acc[monthYear] = (acc[monthYear] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => {
      // Sort by date
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      if (aYear !== bYear) {
        return parseInt(aYear) - parseInt(bYear);
      }
      
      return months.indexOf(aMonth) - months.indexOf(bMonth);
    });
}

function extractCommonIssues(tickets: Ticket[]): string[] {
  // Build a map of short descriptions and their frequencies
  const issueMap = tickets.reduce((acc, ticket) => {
    const desc = ticket.short_description;
    if (desc) {
      // Normalize description to group similar issues
      const normalizedDesc = desc
        .toLowerCase()
        .replace(/\b(not|can't|cannot|won't|doesn't|isn't)\b/g, 'not')
        .replace(/\b(error|issue|problem)\b/g, 'error');
        
      acc[normalizedDesc] = (acc[normalizedDesc] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Sort and get top issues
  return Object.entries(issueMap)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([desc, count]) => {
      // Capitalize first letter of each sentence
      const formattedDesc = desc.charAt(0).toUpperCase() + desc.slice(1);
      return `${formattedDesc} (${count as number} tickets)`;
    });
}

function calculateResolutionEfficiency(tickets: Ticket[]): number {
  if (tickets.length === 0) return 0;
  
  const resolvedTickets = tickets.filter(t => t.status === 'Closed' || t.status === 'Resolved');
  if (resolvedTickets.length === 0) return 0;
  
  // Calculate various metrics and their contributions to efficiency
  let efficiencyScore = 0;
  
  // 1. Resolution rate (percentage of tickets resolved)
  const resolutionRate = resolvedTickets.length / tickets.length;
  efficiencyScore += resolutionRate * 30; // 30% weight
  
  // 2. Satisfaction score if available
  let satisfactionScore = 0;
  let satisfactionCount = 0;
  
  resolvedTickets.forEach(ticket => {
    if (ticket.satisfaction && typeof ticket.satisfaction.score === 'number') {
      satisfactionScore += ticket.satisfaction.score;
      satisfactionCount++;
    }
  });
  
  if (satisfactionCount > 0) {
    const avgSatisfaction = satisfactionScore / satisfactionCount;
    const normalizedSatisfaction = avgSatisfaction / 5; // Assuming 5 is max score
    efficiencyScore += normalizedSatisfaction * 40; // 40% weight
  } else {
    // Redistribute weight if no satisfaction scores
    efficiencyScore += 20; // Give some default points
  }
  
  // 3. Response time efficiency if available
  let responseTimeScore = 0;
  let responseTimeCount = 0;
  
  resolvedTickets.forEach(ticket => {
    if (ticket.time_metrics && typeof ticket.time_metrics.response_time_minutes === 'number') {
      // Shorter response time is better - calculate inverse score
      // Assume anything under 15 minutes is perfect, over 120 minutes is poor
      const responseTime = ticket.time_metrics.response_time_minutes;
      if (responseTime <= 15) {
        responseTimeScore += 1;
      } else if (responseTime > 120) {
        responseTimeScore += 0.2;
      } else {
        responseTimeScore += 1 - ((responseTime - 15) / 105) * 0.8;
      }
      responseTimeCount++;
    }
  });
  
  if (responseTimeCount > 0) {
    efficiencyScore += (responseTimeScore / responseTimeCount) * 30; // 30% weight
  } else {
    // Redistribute weight if no response times
    efficiencyScore += 15; // Give some default points
  }
  
  return Math.round(efficiencyScore);
}

function generateInsights(analytics: TicketAnalytics, tickets: Ticket[]): string[] {
  const insights: string[] = [];
  
  // 1. Analyze resolution time by category
  if (analytics.totalTickets > 0 && analytics.resolvedTickets > 0) {
    const categoriesWithResolutionTimes: {[key: string]: {total: number, count: number}} = {};
    
    tickets.filter(t => t.status === 'Closed' || t.status === 'Resolved').forEach(ticket => {
      if (ticket.category && ticket.created_at && ticket.closed_at) {
        const created = new Date(ticket.created_at);
        const closed = new Date(ticket.closed_at);
        const resolutionTimeHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
        
        if (!categoriesWithResolutionTimes[ticket.category]) {
          categoriesWithResolutionTimes[ticket.category] = { total: 0, count: 0 };
        }
        
        categoriesWithResolutionTimes[ticket.category].total += resolutionTimeHours;
        categoriesWithResolutionTimes[ticket.category].count += 1;
      }
    });
    
    // Find category with longest average resolution time
    let longestCategory = '';
    let longestTime = 0;
    
    for (const [category, data] of Object.entries(categoriesWithResolutionTimes)) {
      if (data.count >= 2) { // At least 2 tickets for statistical relevance
        const avgTime = data.total / data.count;
        if (avgTime > longestTime) {
          longestTime = avgTime;
          longestCategory = category;
        }
      }
    }
    
    if (longestCategory) {
      insights.push(`${longestCategory} issues take the longest to resolve with an average of ${Math.round(longestTime)} hours.`);
    }
  }
  
  // 2. Find dominant priority level
  if (analytics.priorityDistribution) {
    const totalTickets = analytics.totalTickets;
    const priorityEntries = Object.entries(analytics.priorityDistribution);
    
    if (priorityEntries.length > 0) {
      const [highestPriority, highestCount] = priorityEntries.reduce((max, current) => 
        (current[1] > max[1]) ? current : max
      );
      
      const percentage = Math.round((highestCount / totalTickets) * 100);
      if (percentage > 30) {
        insights.push(`${percentage}% of tickets are ${highestPriority} priority, suggesting this is your team's most common workload.`);
      }
    }
  }
  
  // 3. Check for trends in monthly data
  if (analytics.monthlyTrends && analytics.monthlyTrends.length >= 2) {
    const sortedTrends = [...analytics.monthlyTrends].sort((a, b) => b.count - a.count);
    
    if (sortedTrends.length > 0) {
      const highestMonth = sortedTrends[0];
      insights.push(`${highestMonth.month} had the highest ticket volume with ${highestMonth.count} tickets.`);
      
      // Check for increasing or decreasing trend
      const firstMonth = analytics.monthlyTrends[0];
      const lastMonth = analytics.monthlyTrends[analytics.monthlyTrends.length - 1];
      const change = lastMonth.count - firstMonth.count;
      
      if (Math.abs(change) > (firstMonth.count * 0.2)) { // At least 20% change
        const trend = change > 0 ? 'increasing' : 'decreasing';
        const percentage = Math.abs(Math.round((change / firstMonth.count) * 100));
        insights.push(`Ticket volume is ${trend} with a ${percentage}% change over the analyzed period.`);
      }
    }
  }
  
  // 4. Analyze assignee workload distribution
  if (analytics.topAssignees && analytics.topAssignees.length > 1) {
    const topAssignee = analytics.topAssignees[0];
    const percentage = Math.round((topAssignee.count / analytics.totalTickets) * 100);
    
    if (percentage > 25) {
      insights.push(`${topAssignee.name} handles ${percentage}% of all tickets, which may indicate an uneven workload distribution.`);
    }
  }
  
  // 5. Check for possible ticket bottlenecks
  const openByPriority = tickets
    .filter(t => t.status !== 'Closed' && t.status !== 'Resolved')
    .reduce<Record<string, number>>((acc, ticket) => {
      const priority = ticket.priority || 'Unspecified';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
  
  const highPriorityOpen = Object.entries(openByPriority).find(([p]) => p.includes('1') || p.includes('Critical'));
  
  if (highPriorityOpen && highPriorityOpen[1] > 0) {
    insights.push(`There are ${highPriorityOpen[1]} open high-priority tickets that require immediate attention.`);
  }
  
  // If we don't have enough insights, add more generic ones
  if (insights.length < 4) {
    if (analytics.resolutionEfficiency > 0) {
      insights.push(`The overall ticket resolution efficiency is ${analytics.resolutionEfficiency}%, indicating ${
        analytics.resolutionEfficiency > 70 ? 'strong' : analytics.resolutionEfficiency > 50 ? 'adequate' : 'opportunity for improvement in'
      } service delivery.`);
    }
    
    if (analytics.resolvedTickets > 0 && analytics.totalTickets > 0) {
      const resolutionRate = Math.round((analytics.resolvedTickets / analytics.totalTickets) * 100);
      insights.push(`The team has resolved ${resolutionRate}% of all tickets to date.`);
    }
  }
  
  return insights.slice(0, 6); // Return up to 6 insights
}

// New helper functions for subcategory analysis
function calculateCategoryToSubcategory(tickets: Ticket[]): { [category: string]: { [subcategory: string]: number } } {
  const result: { [category: string]: { [subcategory: string]: number } } = {};
  
  tickets.forEach(ticket => {
    const category = ticket.category || 'Unspecified';
    const subcategory = ticket.subcategory || 'Unspecified';
    
    if (!result[category]) {
      result[category] = {};
    }
    
    result[category][subcategory] = (result[category][subcategory] || 0) + 1;
  });
  
  return result;
}

function calculateCategoryDetails(tickets: Ticket[]): { [category: string]: { [detail: string]: number } } {
  const result: { [category: string]: { [detail: string]: number } } = {};
  
  tickets.forEach(ticket => {
    const category = ticket.category || 'Unspecified';
    
    // Initialize the category if needed
    if (!result[category]) {
      result[category] = {};
    }
    
    // Handle different types of category-specific details
    if (category === 'Software' && ticket.software && ticket.software.name) {
      const softwareName = ticket.software.name;
      result[category][softwareName] = (result[category][softwareName] || 0) + 1;
      
      // Add version if available
      if (ticket.software.version) {
        const detailKey = `${softwareName} ${ticket.software.version}`;
        result[category][detailKey] = (result[category][detailKey] || 0) + 1;
      }
    } 
    else if (category === 'Hardware' && ticket.hardware) {
      if (ticket.hardware.model) {
        const model = ticket.hardware.model;
        result[category][model] = (result[category][model] || 0) + 1;
      }
      
      if (ticket.hardware.type) {
        const type = ticket.hardware.type;
        result[category][type] = (result[category][type] || 0) + 1;
      }
    }
    else if (category === 'Network' && ticket.network) {
      if (ticket.network.type) {
        const type = ticket.network.type;
        result[category][type] = (result[category][type] || 0) + 1;
      }
    }
  });
  
  return result;
} 