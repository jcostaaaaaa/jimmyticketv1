import { Badge } from './ui/Badge';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  assignedTo?: string;
}

interface TicketCardProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
}

export function TicketCard({ ticket, onClick }: TicketCardProps) {
  const statusColors = {
    'open': 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    'resolved': 'bg-green-100 text-green-800',
    'closed': 'bg-gray-100 text-gray-800',
  };

  const priorityColors = {
    'low': 'bg-gray-100 text-gray-800',
    'medium': 'bg-blue-100 text-blue-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800',
  };

  return (
    <div 
      className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white"
      onClick={() => onClick?.(ticket)}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-medium text-gray-900 truncate">{ticket.title}</h3>
        <div className="flex space-x-2">
          <Badge className={statusColors[ticket.status]}>
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </Badge>
          <Badge className={priorityColors[ticket.priority]}>
            {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
          </Badge>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ticket.description}</p>
      <div className="flex justify-between text-xs text-gray-500">
        <span>ID: {ticket.id}</span>
        <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
      </div>
      {ticket.assignedTo && (
        <div className="mt-2 text-xs text-gray-500">
          Assigned to: {ticket.assignedTo}
        </div>
      )}
    </div>
  );
} 