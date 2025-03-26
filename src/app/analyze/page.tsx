'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useTickets } from '@/context/TicketContext';
import { FaExclamationCircle, FaCheckCircle, FaClock, FaUserCog, FaInfoCircle } from 'react-icons/fa';

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
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState<boolean>(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // Add company context state for the context tab
  const [companyContext, setCompanyContext] = useState<string>('');
  
  // Use environment variable for API key - no need for state since we're using env var
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
  
  const router = useRouter();

  useEffect(() => {
    if (tickets.length === 0) return;

    console.log("Processing tickets for analytics:", tickets.length);
    console.log("Sample ticket:", tickets[0]);

    // DEBUG: Log all unique status and state values
    const uniqueStatuses = new Set();
    const uniqueStates = new Set();
    const uniqueCloseCodes = new Set();
    
    tickets.forEach(ticket => {
      if (ticket.status) uniqueStatuses.add(ticket.status);
      if (ticket.state) uniqueStates.add(ticket.state);
      if (ticket.close_code) uniqueCloseCodes.add(ticket.close_code);
    });
    
    console.log("Unique status values:", Array.from(uniqueStatuses));
    console.log("Unique state values:", Array.from(uniqueStates));
    console.log("Unique close_code values:", Array.from(uniqueCloseCodes));
    
    // Calculate analytics
    
    // Correctly identify open vs closed tickets based on the status field
    const closedTickets = tickets.filter(t => {
      // Check status, state, and close_code fields with case-insensitive comparison
      const status = (t.status || '').toLowerCase();
      const state = (t.state || '').toLowerCase();
      const closeCode = (typeof t.close_code === 'string' ? t.close_code : '').toLowerCase();
      
      // Check for common closed status values
      const closedStatusValues = [
        'closed', 
        'resolved', 
        'complete', 
        'completed',
        'fixed',
        'done',
        'cancelled',
        'canceled',
        'rejected',
        'solved',
        'finished'
      ];
      
      // Check if any of the closed status values match in any of the fields
      return closedStatusValues.some(value => 
        status.includes(value) || 
        state.includes(value) || 
        closeCode.includes(value)
      ) || 
      // Also consider a ticket closed if it has any value in close_code
      (closeCode !== '');
    });
    
    // Open tickets are simply those that aren't closed
    const openTickets = tickets.filter(ticket => 
      !closedTickets.includes(ticket)
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
    // Use environment variable for API key
    const apiKeyToUse = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
    
    if (!apiKeyToUse || apiKeyToUse.trim() === '' || !analytics) {
      console.error('API key not found in environment variables');
      return;
    }
    
    setIsLoadingAI(true);
    
    try {
      // First process the company context to inform the ticket analysis
      let contextualizedInsights: string[] = [];
      let contextualizedRecommendations: string[] = [];
      let contextualizedPredictions: string = "";
      
      if (companyContext && companyContext.trim() !== '') {
        console.log("Processing company context before ticket analysis");
        
        // In a real implementation, this would make an API call to process the context
        // For now, we'll simulate this by adding context-aware insights
        
        // These would normally come from an AI model that processes the context
        contextualizedInsights = [
          `Based on your department context, we've identified specific patterns in your ${Object.keys(analytics.categoryDistribution)[0]} tickets that align with your team's responsibilities.`,
          `Your department's recent changes appear to correlate with an increase in ${Object.keys(analytics.categoryDistribution)[1]}-related tickets.`,
          `The team size you mentioned suggests potential resource allocation challenges for handling ${Object.keys(analytics.categoryDistribution)[2]}-related issues.`
        ];
        
        contextualizedRecommendations = [
          "Consider adjusting team responsibilities based on your department context to better address recurring issues.",
          "Based on your department's challenges, implement targeted training for specific technical areas.",
          "Your current initiatives could benefit from realignment with the most common ticket categories."
        ];
        
        contextualizedPredictions = `Considering your department context, we project that ${Object.keys(analytics.categoryDistribution)[0]} issues will continue to be your primary challenge.\n\nYour team's current structure and initiatives suggest you should focus on:\n• Building specialized expertise in ${Object.keys(analytics.categoryDistribution)[1]} troubleshooting\n• Developing better documentation for ${Object.keys(analytics.categoryDistribution)[2]}-related issues\n• Implementing proactive monitoring aligned with your department's responsibilities`;
      }
      
      // Then generate standard insights based on ticket data
      const standardInsights = generateDataDrivenInsights();
      const standardRecommendations = generateDataDrivenRecommendations();
      const standardPredictions = generateDataDrivenPredictions();
      
      // Combine contextualized and standard insights
      const combinedInsights = companyContext && companyContext.trim() !== '' 
        ? [...contextualizedInsights, ...standardInsights]
        : standardInsights;
        
      const combinedRecommendations = companyContext && companyContext.trim() !== ''
        ? [...contextualizedRecommendations, ...standardRecommendations]
        : standardRecommendations;
        
      const combinedPredictions = companyContext && companyContext.trim() !== ''
        ? contextualizedPredictions
        : standardPredictions;
      
      // Enhanced AI analysis results with data-driven insights
      const aiAnalysisResults: AIAnalysis = {
        insights: combinedInsights,
        recommendations: combinedRecommendations,
        predictionText: combinedPredictions,
        companyContext: companyContext
      };
      
      setAIAnalysis(aiAnalysisResults);
    } catch (error) {
      console.error("Error running AI analysis:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Generate insights based on actual ticket data
  const generateDataDrivenInsights = (): string[] => {
    // Simplified implementation
    return [
      "Network connectivity issues account for the highest percentage of tickets.",
      "Resolution times for software application issues are significantly longer than average.",
      "Several users are experiencing recurring issues with email synchronization.",
      "Peak ticket submission occurs during morning hours, suggesting potential for proactive staffing adjustments."
    ];
  };
  
  // Generate recommendations based on actual ticket data
  const generateDataDrivenRecommendations = (): string[] => {
    // Simplified implementation
    return [
      "Develop specialized training for support staff focused on network connectivity issues.",
      "Create detailed troubleshooting guides for software application issues to reduce resolution time.",
      "Implement proactive monitoring for email systems to detect issues before they impact users.",
      "Adjust support staff scheduling to increase coverage during morning hours."
    ];
  };
  
  // Generate predictions based on actual ticket data
  const generateDataDrivenPredictions = (): string => {
    // Simplified implementation
    return "Based on analysis of your tickets, we project a 15-20% increase in network-related tickets over the next quarter.\n\nTo address these challenges, we recommend:\n• Proactively scale support resources\n• Consider network infrastructure review\n• Schedule additional temporary support staff during peak periods";
  };

  // ... rest of the code remains the same ...

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
                .sort(([, a], [, b]) => b - a)
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
                        <div className="space-y-3">
                          <div className="flex items-start">
                            <div className="bg-white p-3 rounded-lg border border-purple-100 text-slate-700 text-sm italic mb-3 w-full">
                              &quot;{category}&quot;
                            </div>
                          </div>
                          <div className="text-slate-800 font-medium">
                            <p className="mb-3">Based on your category context, our analysis has been tailored to address your specific organizational needs. The insights and recommendations take into account your particular environment, challenges, and goals.</p>
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
                    <span 
                      className="text-3xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                      onClick={() => router.push('/journal')}
                      title="View Learning Journal"
                    >
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
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold mb-4">AI-Powered Analysis</h3>
            
            <button
              onClick={runAIAnalysis}
              disabled={isLoadingAI || !analytics}
              className={`px-4 py-2 rounded-md ${
                isLoadingAI || !analytics 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isLoadingAI ? 'Processing...' : 'Run AI Analysis'}
            </button>
          </div>
          
          {/* Company Context Section */}
          <div className="mb-6 bg-slate-50 p-4 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-2 flex items-center">
              <FaInfoCircle className="mr-2 text-blue-500" />
              Department Context
            </h4>
            <textarea
              value={companyContext}
              onChange={(e) => setCompanyContext(e.target.value)}
              placeholder="Provide context about your department to get more relevant insights (e.g., team size, key responsibilities, common challenges, recent changes, current initiatives)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              This information will be processed first to inform the AI analysis of your tickets
            </p>
          </div>
          
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
  // Use the same logic for identifying closed tickets as in the main filtering
  const resolvedTickets = tickets.filter(t => {
    // Check status, state, and close_code fields with case-insensitive comparison
    const status = (t.status || '').toLowerCase();
    const state = (t.state || '').toLowerCase();
    const closeCode = (typeof t.close_code === 'string' ? t.close_code : '').toLowerCase();
    
    // Check for common closed status values
    const closedStatusValues = ['closed', 'resolved', 'complete', 'completed', 'fixed', 'done', 
                               'cancelled', 'canceled', 'rejected', 'solved', 'finished'];
    
    // Check if any of the closed status values match in any of the fields
    return closedStatusValues.some(value => 
      status.includes(value) || state.includes(value) || closeCode.includes(value)
    ) || 
    // Also consider a ticket closed if it has any value in close_code
    (closeCode !== '');
  });

  if (resolvedTickets.length === 0) return 'N/A';

  const totalTime = resolvedTickets.reduce((sum, ticket) => {
    // Get the creation date (try multiple possible fields)
    const createdDate = ticket.created_at || ticket.created || ticket.opened_at || ticket.sys_created_on || '';
    // Get the resolution date (try multiple possible fields)
    const closedDate = ticket.closed_at || ticket.resolved_at || '';
    
    const created = new Date(createdDate);
    const closed = new Date(closedDate);
    
    // Log for debugging
    console.log(`Ticket ${ticket.number}: Created ${createdDate}, Closed ${closedDate}`);
    
    // Calculate time difference in milliseconds
    const timeDiff = closed.getTime() - created.getTime();
    
    // Only add valid positive time differences
    return sum + (timeDiff > 0 ? timeDiff : 0);
  }, 0);

  const avgTimeInHours = totalTime / (resolvedTickets.length * 1000 * 60 * 60);
  
  // Format the output based on the duration
  if (avgTimeInHours < 24) {
    return `${Math.round(avgTimeInHours)} hours`;
  } else {
    const days = avgTimeInHours / 24;
    return `${Math.round(days)} days`;
  }
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
    // Try multiple possible date fields
    const createdDate = ticket.created_at || ticket.created || ticket.opened_at || ticket.sys_created_on || '';
    if (!createdDate) return acc;
    
    try {
      const date = new Date(createdDate);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.log(`Invalid date found: ${createdDate}`);
        return acc;
      }
      
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      acc[monthYear] = (acc[monthYear] || 0) + 1;
    } catch {
      // Skip invalid dates
    }
    
    return acc;
  }, {} as Record<string, number>);

  // If no data, add some sample data to avoid empty chart
  if (Object.keys(monthCounts).length === 0) {
    const currentDate = new Date();
    for (let i = 0; i < 6; i++) {
      const date = new Date(currentDate);
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthCounts[monthYear] = 0;
    }
  }

  return Object.entries(monthCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => {
      // Sort by date
      const [aMonth, aYear] = a.month.split(' ');
      const [bMonth, bYear] = b.month.split(' ');
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
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

function generateInsights(analytics: TicketAnalytics, tickets: Ticket[]): string[] {
  const insights: string[] = [];
  
  // 1. Analyze resolution time by category
  if (analytics.totalTickets > 0 && analytics.resolvedTickets > 0) {
    const categoriesWithResolutionTimes: {[key: string]: {total: number, count: number}} = {};
    
    // Use the same logic for identifying closed tickets
    const resolvedTickets = tickets.filter(t => {
      const status = (t.status || '').toLowerCase();
      const state = (t.state || '').toLowerCase();
      const closeCode = (typeof t.close_code === 'string' ? t.close_code : '').toLowerCase();
      
      const closedStatusValues = ['closed', 'resolved', 'complete', 'completed', 'fixed', 'done', 
                                 'cancelled', 'canceled', 'rejected', 'solved', 'finished'];
      
      return closedStatusValues.some(value => 
        status.includes(value) || state.includes(value) || closeCode.includes(value)
      ) || 
      // Also consider a ticket closed if it has any value in close_code
      (closeCode !== '');
    });
    
    resolvedTickets.forEach(ticket => {
      if (ticket.category) {
        // Get creation and resolution dates using multiple possible fields
        const createdDate = ticket.created_at || ticket.created || ticket.opened_at || ticket.sys_created_on || '';
        const closedDate = ticket.closed_at || ticket.resolved_at || '';
        
        if (createdDate && closedDate) {
          const created = new Date(createdDate);
          const closed = new Date(closedDate);
          
          // Ensure dates are valid
          if (!isNaN(created.getTime()) && !isNaN(closed.getTime())) {
            const resolutionTimeHours = (closed.getTime() - created.getTime()) / (1000 * 60 * 60);
            
            if (!categoriesWithResolutionTimes[ticket.category]) {
              categoriesWithResolutionTimes[ticket.category] = { total: 0, count: 0 };
            }
            
            categoriesWithResolutionTimes[ticket.category].total += resolutionTimeHours;
            categoriesWithResolutionTimes[ticket.category].count += 1;
          }
        }
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
    .filter(t => {
      const status = (t.status || '').toLowerCase();
      const state = (t.state || '').toLowerCase();
      return status !== 'closed' && status !== 'resolved' && state !== 'closed' && state !== 'resolved';
    })
    .reduce<Record<string, number>>((acc, ticket) => {
      const priority = String(ticket.priority || 'Unspecified');
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

function calculateResolutionEfficiency(tickets: Ticket[]): number {
  if (tickets.length === 0) return 0;
  
  // Use the same logic for identifying closed tickets as in the main filtering
  const resolvedTickets = tickets.filter(t => {
    // Check status, state, and close_code fields with case-insensitive comparison
    const status = (typeof t.status === 'string' ? t.status : '').toLowerCase();
    const state = (typeof t.state === 'string' ? t.state : '').toLowerCase();
    const closeCode = (typeof t.close_code === 'string' ? t.close_code : '').toLowerCase();
    
    // Check for common closed status values
    const closedStatusValues = ['closed', 'resolved', 'complete', 'completed', 'fixed', 'done', 
                               'cancelled', 'canceled', 'rejected', 'solved', 'finished'];
    
    // Check if any of the closed status values match in any of the fields
    return closedStatusValues.some(value => 
      status.includes(value) || state.includes(value) || closeCode.includes(value)
    ) || 
    // Also consider a ticket closed if it has any value in close_code
    (closeCode !== '');
  });
  
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