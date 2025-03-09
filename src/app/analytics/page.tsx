import { Header } from "@/components/Header";
import { Ticket } from "@/components/TicketCard";

// Mock data - in a real app, this would come from an API or database
const mockTickets: Ticket[] = [
  {
    id: "TKT-001",
    title: "Login page not working on mobile",
    description: "Users are reporting that they cannot log in when using the mobile app. The login button appears to be unresponsive.",
    status: "open",
    priority: "high",
    createdAt: "2024-03-01T12:00:00Z",
    assignedTo: "Jane Smith"
  },
  {
    id: "TKT-002",
    title: "Update payment gateway",
    description: "We need to update our payment gateway to the latest version to support new security features and payment methods.",
    status: "in-progress",
    priority: "medium",
    createdAt: "2024-02-28T10:30:00Z",
    assignedTo: "John Doe"
  },
  {
    id: "TKT-003",
    title: "Create new admin dashboard",
    description: "Design and develop a new admin dashboard with improved analytics and user management features.",
    status: "in-progress",
    priority: "medium",
    createdAt: "2024-02-27T09:15:00Z",
    assignedTo: "Alex Johnson"
  },
  {
    id: "TKT-004",
    title: "Fix server timeout issue",
    description: "Server is timing out during peak hours causing service disruption for users. Need to investigate and optimize database queries.",
    status: "open",
    priority: "critical",
    createdAt: "2024-03-02T14:20:00Z",
    assignedTo: "Michael Chen"
  },
  {
    id: "TKT-005",
    title: "Update privacy policy",
    description: "We need to update our privacy policy to comply with new regulations. Legal team has provided the new text.",
    status: "resolved",
    priority: "low",
    createdAt: "2024-02-25T11:45:00Z",
    assignedTo: "Sarah Williams"
  },
  {
    id: "TKT-006",
    title: "Add dark mode support",
    description: "Implement dark mode theme across the entire application to improve user experience in low-light environments.",
    status: "closed",
    priority: "low",
    createdAt: "2024-02-20T08:30:00Z",
    assignedTo: "David Lee"
  },
  {
    id: "TKT-007",
    title: "Improve loading time",
    description: "The application takes too long to load on slower connections. Need to optimize assets and implement lazy loading.",
    status: "open",
    priority: "high",
    createdAt: "2024-03-03T16:10:00Z"
  },
  {
    id: "TKT-008",
    title: "Fix navigation menu bug",
    description: "The navigation menu disappears when clicking on certain elements. This seems to be related to z-index issues.",
    status: "resolved",
    priority: "medium",
    createdAt: "2024-02-26T13:25:00Z",
    assignedTo: "Emily Garcia"
  }
];

export default function AnalyticsPage() {
  // Calculate statistics
  const totalTickets = mockTickets.length;
  const openTickets = mockTickets.filter(ticket => ticket.status === 'open').length;
  const inProgressTickets = mockTickets.filter(ticket => ticket.status === 'in-progress').length;
  const resolvedTickets = mockTickets.filter(ticket => ticket.status === 'resolved').length;
  const closedTickets = mockTickets.filter(ticket => ticket.status === 'closed').length;
  
  const completionRate = Math.round(((resolvedTickets + closedTickets) / totalTickets) * 100);
  
  // Priority breakdown
  const criticalPriority = mockTickets.filter(ticket => ticket.priority === 'critical').length;
  const highPriority = mockTickets.filter(ticket => ticket.priority === 'high').length;
  const mediumPriority = mockTickets.filter(ticket => ticket.priority === 'medium').length;
  const lowPriority = mockTickets.filter(ticket => ticket.priority === 'low').length;
  
  // Analyze assignment
  const assignedTickets = mockTickets.filter(ticket => ticket.assignedTo).length;
  const unassignedTickets = totalTickets - assignedTickets;
  
  // Get assignees and count their tickets
  const assigneeMap = mockTickets.reduce((acc, ticket) => {
    if (ticket.assignedTo) {
      acc[ticket.assignedTo] = (acc[ticket.assignedTo] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  const assignees = Object.entries(assigneeMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-8">Ticket Analytics</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Status Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Status Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Open</span>
                  <span className="text-sm font-medium">{openTickets} ({Math.round((openTickets / totalTickets) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(openTickets / totalTickets) * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">In Progress</span>
                  <span className="text-sm font-medium">{inProgressTickets} ({Math.round((inProgressTickets / totalTickets) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-yellow-600 h-2.5 rounded-full" style={{ width: `${(inProgressTickets / totalTickets) * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Resolved</span>
                  <span className="text-sm font-medium">{resolvedTickets} ({Math.round((resolvedTickets / totalTickets) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${(resolvedTickets / totalTickets) * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Closed</span>
                  <span className="text-sm font-medium">{closedTickets} ({Math.round((closedTickets / totalTickets) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-gray-600 h-2.5 rounded-full" style={{ width: `${(closedTickets / totalTickets) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Priority Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Priority Distribution</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Critical</span>
                  <span className="text-sm font-medium">{criticalPriority} ({Math.round((criticalPriority / totalTickets) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-red-600 h-2.5 rounded-full" style={{ width: `${(criticalPriority / totalTickets) * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">High</span>
                  <span className="text-sm font-medium">{highPriority} ({Math.round((highPriority / totalTickets) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-orange-600 h-2.5 rounded-full" style={{ width: `${(highPriority / totalTickets) * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Medium</span>
                  <span className="text-sm font-medium">{mediumPriority} ({Math.round((mediumPriority / totalTickets) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${(mediumPriority / totalTickets) * 100}%` }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Low</span>
                  <span className="text-sm font-medium">{lowPriority} ({Math.round((lowPriority / totalTickets) * 100)}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div className="bg-gray-600 h-2.5 rounded-full" style={{ width: `${(lowPriority / totalTickets) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Assignment Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Assignment Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{assignedTickets}</p>
                <p className="text-sm text-gray-500">{Math.round((assignedTickets / totalTickets) * 100)}% of total</p>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Unassigned</p>
                <p className="text-2xl font-bold text-red-600">{unassignedTickets}</p>
                <p className="text-sm text-gray-500">{Math.round((unassignedTickets / totalTickets) * 100)}% of total</p>
              </div>
            </div>
          </div>
          
          {/* Assignee Distribution */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Tickets per Assignee</h2>
            {assignees.length > 0 ? (
              <div className="space-y-3">
                {assignees.map(({ name, count }) => (
                  <div key={name}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium truncate">{name}</span>
                      <span className="text-sm font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-purple-600 h-2.5 rounded-full" 
                        style={{ width: `${(count / totalTickets) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No assigned tickets</p>
            )}
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Insights</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              {openTickets > highPriority + criticalPriority 
                ? "There are more open tickets than high/critical priority tickets, suggesting efficient prioritization."
                : "All high/critical tickets are still open, which may indicate challenges in addressing urgent issues."}
            </li>
            <li>
              {completionRate >= 25 
                ? `The ${completionRate}% completion rate shows good progress in resolving tickets.`
                : `The ${completionRate}% completion rate suggests there may be bottlenecks in ticket resolution.`}
            </li>
            <li>
              {unassignedTickets === 0 
                ? "All tickets have been assigned, showing good resource allocation."
                : `There are ${unassignedTickets} unassigned tickets that need attention.`}
            </li>
          </ul>
        </div>
      </main>
      
      <footer className="bg-gray-800 text-white py-4 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <p>Ticket Analysis Dashboard &copy; 2024</p>
        </div>
      </footer>
    </div>
  );
} 