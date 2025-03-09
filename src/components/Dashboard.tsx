import { Ticket } from './TicketCard';

interface DashboardProps {
  tickets: Ticket[];
}

export function Dashboard({ tickets }: DashboardProps) {
  // Calculate statistics
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(ticket => ticket.status === 'open').length;
  const inProgressTickets = tickets.filter(ticket => ticket.status === 'in-progress').length;
  const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved').length;
  const closedTickets = tickets.filter(ticket => ticket.status === 'closed').length;
  
  const highPriorityTickets = tickets.filter(ticket => ticket.priority === 'high' || ticket.priority === 'critical').length;
  
  // Calculate completion rate
  const completionRate = totalTickets > 0 
    ? Math.round(((resolvedTickets + closedTickets) / totalTickets) * 100) 
    : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Tickets */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Total Tickets</h3>
        <p className="text-3xl font-bold text-gray-900">{totalTickets}</p>
      </div>
      
      {/* Open Tickets */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Open Tickets</h3>
        <p className="text-3xl font-bold text-blue-600">{openTickets}</p>
        <p className="text-sm text-gray-500 mt-2">
          {totalTickets > 0 ? Math.round((openTickets / totalTickets) * 100) : 0}% of total
        </p>
      </div>
      
      {/* In Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium mb-2">In Progress</h3>
        <p className="text-3xl font-bold text-yellow-600">{inProgressTickets}</p>
        <p className="text-sm text-gray-500 mt-2">
          {totalTickets > 0 ? Math.round((inProgressTickets / totalTickets) * 100) : 0}% of total
        </p>
      </div>
      
      {/* Completion Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-gray-500 text-sm font-medium mb-2">Completion Rate</h3>
        <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
        <p className="text-sm text-gray-500 mt-2">
          {resolvedTickets + closedTickets} of {totalTickets} tickets
        </p>
      </div>
      
      {/* High Priority */}
      <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
        <h3 className="text-gray-500 text-sm font-medium mb-2">High Priority Tickets</h3>
        <p className="text-3xl font-bold text-red-600">{highPriorityTickets}</p>
        <p className="text-sm text-gray-500 mt-2">
          {totalTickets > 0 ? Math.round((highPriorityTickets / totalTickets) * 100) : 0}% of total
        </p>
      </div>
      
      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
        <h3 className="text-gray-500 text-sm font-medium mb-4">Status Distribution</h3>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div className="flex h-2.5 rounded-full overflow-hidden">
            <div style={{ width: `${openTickets / totalTickets * 100}%` }} className="bg-blue-600"></div>
            <div style={{ width: `${inProgressTickets / totalTickets * 100}%` }} className="bg-yellow-600"></div>
            <div style={{ width: `${resolvedTickets / totalTickets * 100}%` }} className="bg-green-600"></div>
            <div style={{ width: `${closedTickets / totalTickets * 100}%` }} className="bg-gray-600"></div>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          <span className="flex items-center"><span className="w-2 h-2 bg-blue-600 rounded-full mr-1"></span> Open</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-yellow-600 rounded-full mr-1"></span> In Progress</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-green-600 rounded-full mr-1"></span> Resolved</span>
          <span className="flex items-center"><span className="w-2 h-2 bg-gray-600 rounded-full mr-1"></span> Closed</span>
        </div>
      </div>
    </div>
  );
} 