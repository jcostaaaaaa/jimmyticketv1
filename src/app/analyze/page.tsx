'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useTickets } from '@/context/TicketContext';
import { FaExclamationCircle, FaCheckCircle, FaClock, FaUserCog, FaInfoCircle, FaLightbulb, FaChartBar } from 'react-icons/fa';

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
      averageResolutionTime: calculateAverageResolutionTime(closedTickets),
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
    // Check if analytics data is available
    if (!analytics) {
      console.error('Analytics data not available');
      return;
    }
    
    setIsLoadingAI(true);
    
    try {
      // Process the company context and ticket data
      let contextPrompt = '';
      
      if (companyContext && companyContext.trim() !== '') {
        contextPrompt = `
        DEPARTMENT CONTEXT:
        ${companyContext}
        
        Please consider this department context when analyzing the ticket data.
        `;
      }
      
      // Prepare ticket data for analysis
      const ticketSummary = {
        totalTickets: analytics.totalTickets,
        openTickets: analytics.openTickets,
        resolvedTickets: analytics.resolvedTickets,
        averageResolutionTime: analytics.averageResolutionTime,
        priorityDistribution: analytics.priorityDistribution,
        categoryDistribution: analytics.categoryDistribution,
        topAssignees: analytics.topAssignees.slice(0, 5),
        monthlyTrends: analytics.monthlyTrends,
        commonIssues: analytics.commonIssues,
        resolutionEfficiency: analytics.resolutionEfficiency
      };
      
      // Construct the prompt for OpenAI
      const prompt = `
      You are an IT analytics expert analyzing support ticket data.
      
      ${contextPrompt}
      
      TICKET DATA SUMMARY:
      ${JSON.stringify(ticketSummary, null, 2)}
      
      Based on this data, please provide:
      1. ONLY if there is sufficient data: 2-5 specific data-driven insights about patterns, trends, or issues that are directly supported by the provided ticket data. Do not generate generic insights that aren't clearly evident in the data.
      2. ONLY if there is sufficient data: 2-5 actionable recommendations that directly address the specific issues found in the ticket data. Do not provide generic recommendations.
      3. ONLY if there is sufficient historical data to make meaningful projections: A comprehensive prediction of future trends and challenges that are specifically related to the patterns in the provided ticket data. Include relevant projections about ticket volume changes, emerging issue categories, staffing implications, and technology adoption impacts, but ONLY if these can be reasonably inferred from the actual data provided.
      
      IMPORTANT: If there is insufficient data to make meaningful insights, recommendations, or predictions for any of the above categories, return an empty array for that category or a message stating "Insufficient data to generate reliable predictions" instead of creating generic content. Quality over quantity - only include items that are directly supported by the data.
      
      Format your response as a JSON object with the following structure:
      {
        "insights": ["insight1", "insight2", ...],
        "recommendations": ["recommendation1", "recommendation2", ...],
        "predictionText": "Your prediction text here..."
      }
      `;
      
      // Make API call to our secure API route that handles the OpenAI API key
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are an IT analytics expert providing insights on support ticket data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 3000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenAI API error:', errorData);
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();
      
      if (!content) {
        throw new Error('No content returned from API');
      }
      
      // Parse the JSON response
      try {
        const aiResults = JSON.parse(content);
        
        // Ensure the response has the expected structure and handle insufficient data cases
        const aiAnalysisResults: AIAnalysis = {
          insights: Array.isArray(aiResults.insights) ? aiResults.insights : 
                   (aiResults.insights === "Insufficient data to generate reliable insights" ? [] : []),
          recommendations: Array.isArray(aiResults.recommendations) ? aiResults.recommendations : 
                          (aiResults.recommendations === "Insufficient data to generate reliable recommendations" ? [] : []),
          predictionText: typeof aiResults.predictionText === 'string' ? 
                         (aiResults.predictionText === "Insufficient data to generate reliable predictions" ? 
                         "There is currently insufficient historical ticket data to generate reliable predictions. Continue collecting more ticket data with diverse categories, priorities, and resolution times to enable meaningful future projections." : 
                         aiResults.predictionText) : '',
          companyContext: companyContext
        };  
        
        setAIAnalysis(aiAnalysisResults);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        
        // Fallback to simulated data if parsing fails
        const aiAnalysisResults: AIAnalysis = {
          insights: generateDataDrivenInsights(),
          recommendations: generateDataDrivenRecommendations(),
          predictionText: generateDataDrivenPredictions(),
          companyContext: companyContext
        };
        
        setAIAnalysis(aiAnalysisResults);
      }
    } catch (error) {
      console.error("Error running AI analysis:", error);
      
      // Fallback to simulated data on error
      const aiAnalysisResults: AIAnalysis = {
        insights: generateDataDrivenInsights(),
        recommendations: generateDataDrivenRecommendations(),
        predictionText: generateDataDrivenPredictions(),
        companyContext: companyContext
      };
      
      setAIAnalysis(aiAnalysisResults);
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Generate insights based on actual ticket data
  const generateDataDrivenInsights = (): string[] => {
    // Check if we have enough data to generate meaningful insights
    if (!analytics || analytics.totalTickets < 10) {
      return [];
    }
    
    const insights: string[] = [];
    
    // Only add insights if the relevant data exists and shows clear patterns
    if (analytics.categoryDistribution && Object.keys(analytics.categoryDistribution).length > 0) {
      // Find the category with the highest percentage
      const categories = Object.entries(analytics.categoryDistribution);
      if (categories.length > 0) {
        categories.sort((a, b) => b[1] - a[1]);
        const [topCategory, percentage] = categories[0];
        if (typeof percentage === 'number' && percentage > 20) { // Only if it's a significant percentage
          insights.push(`${topCategory} issues account for ${Math.round(percentage)}% of all tickets, making it the most common category.`);
        }
      }
    }
    
    // Add insight about resolution time if data exists
    if (analytics.averageResolutionTime && typeof analytics.averageResolutionTime === 'number' && analytics.averageResolutionTime > 0) {
      const resolutionTime = Number(analytics.averageResolutionTime);
      insights.push(`The average resolution time for tickets is ${resolutionTime.toFixed(1)} hours.`);
    }
    
    // Add insight about open vs. resolved tickets if data exists
    if (analytics.openTickets > 0 && analytics.resolvedTickets > 0) {
      const openPercentage = (analytics.openTickets / analytics.totalTickets) * 100;
      insights.push(`Currently, ${Math.round(openPercentage)}% of tickets remain open, which may indicate ${openPercentage > 30 ? 'potential resource constraints' : 'normal operational flow'}.`);
    }
    
    return insights;
  };

  // Generate recommendations based on actual ticket data
  const generateDataDrivenRecommendations = (): string[] => {
    // Check if we have enough data to generate meaningful recommendations
    if (!analytics || analytics.totalTickets < 10) {
      return [];
    }
    
    const recommendations: string[] = [];
    
    // Only add recommendations if the relevant data exists and shows clear patterns
    if (analytics.categoryDistribution && Object.keys(analytics.categoryDistribution).length > 0) {
      // Find the categories with the highest percentages
      const categories = Object.entries(analytics.categoryDistribution);
      if (categories.length > 0) {
        categories.sort((a, b) => b[1] - a[1]);
        const [topCategory, percentage] = categories[0];
        if (typeof percentage === 'number' && percentage > 20) {
          recommendations.push(`Develop specialized training for support staff focused on ${topCategory} issues, which account for a significant portion of tickets.`);
        }
      }
    }
    
    // Add recommendation about resolution time if data exists
    if (analytics.averageResolutionTime) {
      const resolutionTime = typeof analytics.averageResolutionTime === 'number' ? 
        analytics.averageResolutionTime : 
        parseFloat(analytics.averageResolutionTime);
        
      if (!isNaN(resolutionTime) && resolutionTime > 8) {
        recommendations.push(`Create detailed troubleshooting guides to reduce the current average resolution time of ${resolutionTime.toFixed(1)} hours.`);
      }
    }
    
    // Add recommendation about staffing if there are assignees data
    if (analytics.topAssignees && analytics.topAssignees.length > 0) {
      const topAssignee = analytics.topAssignees[0];
      if (topAssignee && topAssignee.count > analytics.totalTickets * 0.3) {
        recommendations.push(`Consider redistributing workload more evenly among team members, as ${topAssignee.name} is currently handling a disproportionate number of tickets.`);
      }
    }
    
    return recommendations;
  };
  
  // Generate predictions based on actual ticket data
  const generateDataDrivenPredictions = (): string => {
    // Check if we have enough data to generate meaningful predictions
    if (!analytics || analytics.totalTickets < 20 || !analytics.monthlyTrends || Object.keys(analytics.monthlyTrends).length < 3) {
      return "There is currently insufficient historical ticket data to generate reliable predictions. Continue collecting more ticket data with diverse categories, priorities, and resolution times to enable meaningful future projections.";
    }
    
    // Only generate predictions if we have enough monthly data to establish trends
    const months = Object.keys(analytics.monthlyTrends);
    if (months.length < 3) {
      return "At least three months of historical data is needed to identify meaningful trends and make reliable predictions. Continue collecting ticket data to enable future projections.";
    }
    
    // Analyze monthly trends to detect patterns
    // Extract ticket counts from monthly trends with proper type handling
    const monthlyTicketCounts = months.map(month => {
      const monthData = analytics.monthlyTrends[month as keyof typeof analytics.monthlyTrends];
      return typeof monthData === 'number' ? monthData : 0;
    });
    const isIncreasing = monthlyTicketCounts.every((count, i) => i === 0 || count >= monthlyTicketCounts[i-1]);
    const isDecreasing = monthlyTicketCounts.every((count, i) => i === 0 || count <= monthlyTicketCounts[i-1]);
    
    // Calculate average monthly change
    let trendDescription = "";
    if (monthlyTicketCounts.length >= 2) {
      const firstMonth = monthlyTicketCounts[0];
      const lastMonth = monthlyTicketCounts[monthlyTicketCounts.length - 1];
      const monthsElapsed = monthlyTicketCounts.length - 1;
      
      if (firstMonth > 0) {
        const monthlyChangeRate = (lastMonth - firstMonth) / firstMonth / monthsElapsed;
        
        if (isIncreasing && monthlyChangeRate > 0.05) {
          trendDescription = `Based on your historical data, ticket volume is showing a consistent upward trend of approximately ${(monthlyChangeRate * 100).toFixed(1)}% per month.`;
        } else if (isDecreasing && monthlyChangeRate < -0.05) {
          trendDescription = `Based on your historical data, ticket volume is showing a consistent downward trend of approximately ${Math.abs(monthlyChangeRate * 100).toFixed(1)}% per month.`;
        } else {
          trendDescription = "Based on your historical data, ticket volume appears to be relatively stable with minor fluctuations.";
        }
      }
    }
    
    // Analyze category distribution if available
    let categoryTrends = "";
    if (analytics.categoryDistribution && Object.keys(analytics.categoryDistribution).length > 0) {
      const categories = Object.entries(analytics.categoryDistribution);
      categories.sort((a, b) => b[1] - a[1]);
      
      if (categories.length > 0) {
        const [topCategory, percentage] = categories[0];
        if (typeof percentage === 'number' && percentage > 20) {
          categoryTrends = `\n\nYour data shows that ${topCategory} issues currently account for ${Math.round(percentage)}% of all tickets. If this trend continues, you may want to consider specialized training or resources focused on this area.`;
        }
      }
    }
    
    // Analyze resolution efficiency if available
    let resolutionTrends = "";
    if (analytics.resolutionEfficiency && typeof analytics.resolutionEfficiency === 'number') {
      const efficiency = Number(analytics.resolutionEfficiency);
      if (efficiency < 50) {
        resolutionTrends = "\n\nYour current resolution efficiency is below average, which may lead to increasing backlogs if ticket volume grows. Consider reviewing support processes and resources to improve efficiency.";
      } else if (efficiency > 80) {
        resolutionTrends = "\n\nYour team is demonstrating high resolution efficiency, which positions you well to handle potential increases in ticket volume.";
      }
    }
    
    // Combine all analyses into a comprehensive prediction
    return `${trendDescription}${categoryTrends}${resolutionTrends}\n\nContinue collecting more detailed ticket data to enable more comprehensive predictions about future trends, staffing needs, and potential process improvements.`;
  };

  // State for tab selection
  const [activeTab, setActiveTab] = useState<'analysis' | 'context'>('analysis');

  if (tickets.length === 0) {
    return (
      <div className="min-h-screen bg-[#1A1A1A]">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-[#2B2B2B] rounded-lg shadow-md p-6 mb-8 border border-[#3C3C3C]">
            <h2 className="text-2xl font-bold mb-4 text-[#E0E0E0]">Analytics Dashboard</h2>
            <p className="text-[#E0E0E0]">No tickets available for analysis. Please import tickets first.</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-4 py-2 bg-[#E69500] text-[#E0E0E0] rounded-md hover:bg-[#CC8400] transition-colors"
            >
              Go to Import
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A]">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[#2B2B2B] rounded-lg shadow-md p-6 mb-8 border border-[#3C3C3C]">
          <h2 className="text-2xl font-bold mb-4 text-[#E0E0E0]">Analytics Dashboard</h2>
          
          {/* Tab Navigation */}
          <div className="flex border-b border-[#3C3C3C] mb-6">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'analysis' ? 'text-[#FFA500] border-b-2 border-[#FFA500]' : 'text-[#A0A0A0] hover:text-[#E0E0E0]'}`}
              onClick={() => setActiveTab('analysis')}
            >
              Analysis
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'context' ? 'text-[#FFA500] border-b-2 border-[#FFA500]' : 'text-[#A0A0A0] hover:text-[#E0E0E0]'}`}
              onClick={() => setActiveTab('context')}
            >
              Department Context
            </button>
          </div>
          
          {/* Context Tab Content */}
          {activeTab === 'context' && (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-[#E0E0E0]">Department Context</h3>
                <p className="text-[#A0A0A0] mb-4">
                  Provide context about your department to get more relevant insights. This information will be processed first to inform the AI analysis of your tickets.
                </p>
                <textarea
                  value={companyContext}
                  onChange={(e) => setCompanyContext(e.target.value)}
                  placeholder="Describe your department (e.g., team size, key responsibilities, common challenges, recent changes, current initiatives)"
                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3C3C3C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFA500] min-h-[200px] text-[#E0E0E0]"
                />
              </div>
              
              <div className="flex justify-end">
                <button
                  onClick={() => setActiveTab('analysis')}
                  className="px-4 py-2 bg-[#E69500] text-[#E0E0E0] rounded-md hover:bg-[#CC8400] transition-colors"
                >
                  Continue to Analysis
                </button>
              </div>
            </div>
          )}
          
          {/* Analysis Tab Content */}
          {activeTab === 'analysis' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
              <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm mb-8 border border-[#3C3C3C]">
                <h2 className="text-lg font-semibold mb-4 text-[#E0E0E0]">Key Insights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="border-l-4 border-[#FFA500] pl-4 py-2">
                      <p className="text-[#E0E0E0]">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Charts and Distributions */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Priority Distribution */}
                <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm border border-[#3C3C3C]">
                  <h2 className="text-lg font-semibold mb-4 text-[#E0E0E0]">Priority Distribution</h2>
                  <div className="space-y-2">
                    {analytics?.priorityDistribution && Object.entries(analytics.priorityDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([priority, count]) => (
                        <div key={priority} className="flex flex-wrap items-center mb-2">
                          <span className="w-20 sm:w-32 text-sm text-[#A0A0A0] mb-1 sm:mb-0">{priority || 'Unspecified'}</span>
                          <div className="flex-1 mx-2 min-w-[100px]">
                            <div className="h-4 bg-[#3C3C3C] rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#E69500]"
                                style={{
                                  width: `${(count / analytics.totalTickets) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                          <span className="text-sm text-[#A0A0A0] whitespace-nowrap">{count} ({Math.round((count / analytics.totalTickets) * 100)}%)</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Category Distribution */}
                <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm relative border border-[#3C3C3C]">
                  <h2 className="text-lg font-semibold mb-4 text-[#E0E0E0]">Category Distribution</h2>
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
                            <span className="w-20 sm:w-32 text-sm text-[#A0A0A0] mb-1 sm:mb-0">{category || 'Unspecified'}</span>
                            <div className="flex-1 mx-2 min-w-[100px]">
                              <div className="h-4 bg-[#3C3C3C] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#FFA500]"
                                  style={{
                                    width: `${(count / analytics.totalTickets) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-[#A0A0A0] flex items-center whitespace-nowrap">
                              {count} ({Math.round((count / analytics.totalTickets) * 100)}%)
                              <span className="ml-1 text-[#FFA500] cursor-pointer" title="View subcategories">
                                <FaInfoCircle />
                              </span>
                            </span>
                          </div>

                          {/* Subcategory tooltip - position it differently on mobile */}
                          {hoveredCategory === category && analytics.categoryToSubcategory[category] && (
                            <div className="absolute left-0 right-0 sm:left-auto sm:right-auto mt-1 sm:w-full bg-[#1A1A1A] border border-[#3C3C3C] rounded-md shadow-lg p-3 z-10">
                              <h3 className="text-sm font-medium mb-2 text-[#E0E0E0]">{category} Breakdown</h3>
                              <div className="space-y-3">
                                <div className="flex items-start">
                                  <div className="bg-[#2B2B2B] p-3 rounded-lg border border-[#3C3C3C] text-[#E0E0E0] text-sm italic mb-3 w-full">
                                    &quot;{category}&quot;
                                  </div>
                                </div>
                                <div className="text-[#E0E0E0] font-medium">
                                  <p className="mb-3">Based on your category context, our analysis has been tailored to address your specific organizational needs. The insights and recommendations take into account your particular environment, challenges, and goals.</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Top Assignees */}
                <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm border border-[#3C3C3C]">
                  <h2 className="text-lg font-semibold mb-4 text-[#E0E0E0]">Top Assignees</h2>
                  <div className="space-y-2">
                    {analytics?.topAssignees.map(({ name, count }) => (
                      <div key={name} className="flex flex-wrap items-center mb-2">
                        <span className="w-20 sm:w-40 text-sm text-[#A0A0A0] mb-1 sm:mb-0">{name || 'Unassigned'}</span>
                        <div className="flex-1 mx-2 min-w-[100px]">
                          <div className="h-4 bg-[#3C3C3C] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#E69500]"
                              style={{
                                width: `${(count / analytics.totalTickets) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-[#A0A0A0] whitespace-nowrap">{count} tickets</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Trends */}
                <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm border border-[#3C3C3C]">
                  <h2 className="text-lg font-semibold mb-4 text-[#E0E0E0]">Monthly Trends</h2>
                  <div className="space-y-2">
                    {analytics?.monthlyTrends.map(({ month, count }) => (
                      <div key={month} className="flex flex-wrap items-center mb-2">
                        <span className="w-20 sm:w-24 text-sm text-[#A0A0A0] mb-1 sm:mb-0">{month}</span>
                        <div className="flex-1 mx-2 min-w-[100px]">
                          <div className="h-4 bg-[#3C3C3C] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FFA500]"
                              style={{
                                width: `${(count / Math.max(...analytics.monthlyTrends.map(t => t.count))) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                        <span className="text-sm text-[#A0A0A0] whitespace-nowrap">{count} tickets</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Common Issues */}
                <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm border border-[#3C3C3C]">
                  <h2 className="text-lg font-semibold mb-4 text-[#E0E0E0]">Common Issues</h2>
                  <ul className="list-disc pl-5 space-y-2">
                    {analytics?.commonIssues.map((issue, index) => (
                      <li key={index} className="text-[#E0E0E0]">{issue}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Resolution Efficiency */}
                <div className="bg-[#2B2B2B] p-6 rounded-xl shadow-sm border border-[#3C3C3C]">
                  <h2 className="text-lg font-semibold mb-4 text-[#E0E0E0]">Resolution Efficiency</h2>
                  <div className="flex flex-col items-center">
                    <div className="relative w-40 h-40">
                      <div className="w-full h-full rounded-full bg-[#3C3C3C] flex items-center justify-center">
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background: `conic-gradient(#FFA500 ${analytics?.resolutionEfficiency || 0}%, #1A1A1A 0%)`,
                            clipPath: 'circle(50% at 50% 50%)',
                          }}
                        />
                        <div className="w-32 h-32 bg-[#1A1A1A] rounded-full flex items-center justify-center z-10">
                          <span 
                            className="text-3xl font-bold text-[#E0E0E0] cursor-pointer hover:text-[#FFA500] transition-colors"
                            onClick={() => router.push('/journal')}
                            title="View Learning Journal"
                          >
                            {analytics?.resolutionEfficiency || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 text-center text-[#A0A0A0]">
                      Based on resolution time, response time, and satisfaction ratings
                    </p>
                  </div>
                </div>
              </div>
              
              {/* AI-Powered Analysis Section */}
              <div className="bg-[#2B2B2B] rounded-xl shadow-sm p-6 mb-8 border border-[#3C3C3C]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-[#E0E0E0]">AI-Powered Analysis</h2>
                  
                  <button
                    onClick={runAIAnalysis}
                    disabled={isLoadingAI}
                    className={`px-4 py-2 rounded-md ${
                      isLoadingAI 
                        ? 'bg-[#3C3C3C] text-[#A0A0A0] cursor-not-allowed' 
                        : 'bg-[#E69500] text-[#E0E0E0] hover:bg-[#CC8400]'
                    } transition-colors`}
                  >
                    {isLoadingAI ? 'Analyzing...' : 'Generate AI Analysis'}
                  </button>
                </div>
                
                {aiAnalysis ? (
                  <div className="space-y-6">
                    {/* AI Insights */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-[#E0E0E0] flex items-center">
                        <FaLightbulb className="text-[#FFA500] mr-2" /> 
                        Data-Driven Insights
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {aiAnalysis.insights.map((insight, index) => (
                          <div key={index} className="bg-[#1A1A1A] p-3 rounded-lg border border-[#3C3C3C]">
                            <p className="text-[#E0E0E0]">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* AI Recommendations */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-[#E0E0E0] flex items-center">
                        <FaCheckCircle className="text-[#FFA500] mr-2" /> 
                        Actionable Recommendations
                      </h3>
                      <div className="grid grid-cols-1 gap-3">
                        {aiAnalysis.recommendations.map((recommendation, index) => (
                          <div key={index} className="bg-[#1A1A1A] p-3 rounded-lg border border-[#3C3C3C]">
                            <p className="text-[#E0E0E0]">{recommendation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* AI Predictions */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-[#E0E0E0] flex items-center">
                        <FaChartBar className="text-[#FFA500] mr-2" /> 
                        Future Trends & Predictions
                      </h3>
                      <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#3C3C3C]">
                        <p className="text-[#E0E0E0] whitespace-pre-line">{aiAnalysis.predictionText}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#1A1A1A] p-6 rounded-lg border border-dashed border-[#3C3C3C] text-center">
                    <p className="text-[#A0A0A0] mb-4">
                      Generate an AI analysis of your ticket data to receive data-driven insights, 
                      actionable recommendations, and future trend predictions.
                    </p>
                    <p className="text-[#A0A0A0] text-sm">
                      This analysis uses advanced AI to identify patterns and opportunities in your support data.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    
    <footer className="bg-[#1A1A1A] text-[#A0A0A0] py-8 mt-auto border-t border-[#3C3C3C]">
      <div className="container mx-auto px-4 text-center">
        <p className="mb-0">ServiceNow Ticket Analysis Dashboard &copy; 2024</p>
      </div>
    </footer>
  );
}

// MetricCard component
function MetricCard({ title, value, icon, color }: { 
  title: string; 
  value: number | string; 
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'purple';
}) {
  // Map color names to actual color values
  const colorMap = {
    blue: {
      bg: 'bg-[#1A1A1A]',
      border: 'border-[#3C3C3C]',
      icon: 'text-[#FFA500]'
    },
    yellow: {
      bg: 'bg-[#1A1A1A]',
      border: 'border-[#3C3C3C]',
      icon: 'text-[#FFA500]'
    },
    green: {
      bg: 'bg-[#1A1A1A]',
      border: 'border-[#3C3C3C]',
      icon: 'text-[#FFA500]'
    },
    purple: {
      bg: 'bg-[#1A1A1A]',
      border: 'border-[#3C3C3C]',
      icon: 'text-[#FFA500]'
    }
  };

  return (
    <div className={`${colorMap[color].bg} p-4 rounded-xl shadow-sm border ${colorMap[color].border}`}>
      <div className="flex items-center mb-2">
        <div className={`${colorMap[color].icon} mr-2`}>
          {icon}
        </div>
        <h3 className="text-sm font-medium text-[#A0A0A0]">{title}</h3>
      </div>
      <div className="text-2xl font-bold text-[#E0E0E0]">{value}</div>
    </div>
  );
}

// Helper functions
function calculateAverageResolutionTime(resolvedTickets: Ticket[]): string {
  if (resolvedTickets.length === 0) return 'N/A';

  // Calculate total time to resolution
  let totalTime = 0;
  let validTicketCount = 0;
  
  resolvedTickets.forEach(ticket => {
    // Get the creation date (try multiple possible fields)
    const createdDate = ticket.created_at || ticket.created || ticket.opened_at || ticket.sys_created_on || '';
    // Get the resolution date (try multiple possible fields)
    const closedDate = ticket.closed_at || ticket.resolved_at || ticket.sys_closed_at || '';
    
    if (createdDate && closedDate) {
      try {
        // Only proceed if we have non-empty strings
        if (typeof createdDate === 'string' && createdDate.trim() !== '' &&
            typeof closedDate === 'string' && closedDate.trim() !== '') {
          const created = new Date(createdDate);
          const closed = new Date(closedDate);
          
          // Calculate time difference in milliseconds
          const timeDiff = closed.getTime() - created.getTime();
          
          // Only add valid positive time differences
          if (timeDiff > 0) {
            totalTime += timeDiff;
            validTicketCount++;
          }
        }
      }
      catch (error) {
        console.error(`Error calculating time difference for ticket ${ticket.number}:`, error);
      }
    }
  });
  
  if (validTicketCount === 0) return 'N/A';
  
  const avgTimeInHours = totalTime / (validTicketCount * 1000 * 60 * 60);
  
  // Format the time in a human-readable way
  if (avgTimeInHours < 1) {
    return `${Math.round(avgTimeInHours * 60)} minutes`;
  } else if (avgTimeInHours < 24) {
    return `${Math.round(avgTimeInHours)} hours`;
  } else {
    return `${Math.round(avgTimeInHours / 24)} days`;
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
          try {
            const created = new Date(createdDate);
            const closed = new Date(closedDate);
            
            // Log for debugging
            console.log(`Ticket ${ticket.number}: Created ${createdDate}, Closed ${closedDate}`);
            
            // Calculate time difference in milliseconds
            const timeDiff = closed.getTime() - created.getTime();
            
            // Only add valid positive time differences
            if (timeDiff > 0) {
              // Add to the category's total resolution time
              if (!categoriesWithResolutionTimes[ticket.category]) {
                categoriesWithResolutionTimes[ticket.category] = { total: 0, count: 0 };
              }
              categoriesWithResolutionTimes[ticket.category].total += timeDiff;
              categoriesWithResolutionTimes[ticket.category].count++;
            }
          } catch (error) {
            console.error(`Error processing dates for ticket ${ticket.number}:`, error);
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
      insights.push(`${longestCategory} issues take the longest to resolve with an average of ${Math.round(longestTime / 1000 / 60 / 60)} hours.`);
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
  // Filter for resolved tickets
  const resolvedTickets = tickets.filter(ticket => {
    const status = (ticket.status || '').toLowerCase();
    const state = (ticket.state || '').toLowerCase();
    const closeCode = (typeof ticket.close_code === 'string' ? ticket.close_code : '').toLowerCase();
    
    const closedStatusValues = ['closed', 'resolved', 'complete', 'completed', 'fixed', 'done', 
                              'cancelled', 'canceled', 'rejected', 'solved', 'finished'];
    
    return closedStatusValues.some(value => 
      status.includes(value) || state.includes(value) || closeCode.includes(value)
    ) || (closeCode !== '');
  });
  
  if (resolvedTickets.length === 0) return 0;
  
  // Calculate average resolution time
  let totalResolutionTime = 0;
  let validTicketCount = 0;
  
  resolvedTickets.forEach(ticket => {
    const createdDate = ticket.created_at || ticket.created || ticket.opened_at || ticket.sys_created_on || '';
    const closedDate = ticket.closed_at || ticket.resolved_at || ticket.sys_closed_at || '';
    
    if (createdDate && closedDate) {
      try {
        if (typeof createdDate === 'string' && createdDate.trim() !== '' &&
            typeof closedDate === 'string' && closedDate.trim() !== '') {
          const created = new Date(createdDate);
          const closed = new Date(closedDate);
          
          const timeDiff = closed.getTime() - created.getTime();
          
          if (timeDiff > 0) {
            totalResolutionTime += timeDiff;
            validTicketCount++;
          }
        }
      }
      catch (error) {
        console.error(`Error calculating time difference for ticket ${ticket.number}:`, error);
      }
    }
  });
  
  if (validTicketCount === 0) return 0;
  
  // Calculate average resolution time in hours
  const avgResolutionTimeHours = totalResolutionTime / (validTicketCount * 1000 * 60 * 60);
  
  // Calculate efficiency score based on resolution time
  let efficiencyScore = 0;
  
  // Resolution time efficiency (lower is better)
  if (avgResolutionTimeHours < 4) {
    efficiencyScore += 40;
  } else if (avgResolutionTimeHours < 8) {
    efficiencyScore += 35;
  } else if (avgResolutionTimeHours < 24) {
    efficiencyScore += 30;
  } else if (avgResolutionTimeHours < 72) {
    efficiencyScore += 20;
  } else if (avgResolutionTimeHours < 168) {
    efficiencyScore += 10;
  } else {
    efficiencyScore += 5;
  }
  
  // Resolution rate (higher is better, max 30 points)
  const resolutionRate = resolvedTickets.length / tickets.length;
  if (resolutionRate > 0.9) {
    efficiencyScore += 30;
  } else if (resolutionRate > 0.8) {
    efficiencyScore += 25;
  } else if (resolutionRate > 0.7) {
    efficiencyScore += 20;
  } else if (resolutionRate > 0.6) {
    efficiencyScore += 15;
  } else if (resolutionRate > 0.5) {
    efficiencyScore += 10;
  } else {
    efficiencyScore += 5;
  }
  
  // Priority handling (higher percentage of high priority tickets resolved is better, max 20 points)
  // This would require additional data we don't have, so we'll use a placeholder
  efficiencyScore += 15;
  
  // First response time (lower is better, max 10 points)
  // This would require additional data we don't have, so we'll use a placeholder
  efficiencyScore += 8;
  
  return Math.round(efficiencyScore);
}