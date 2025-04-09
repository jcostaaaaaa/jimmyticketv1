import { Header } from "@/components/Header";
import { TicketList } from "@/components/TicketList";
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

export default function TicketsPage() {
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#E0E0E0]">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[#E0E0E0]">All Tickets</h1>
          <button className="bg-[#E69500] hover:bg-[#FFA500] text-white font-medium py-2 px-4 rounded transition-colors">
            + New Ticket
          </button>
        </div>
        
        <TicketList tickets={mockTickets} />
      </main>
      
      <footer className="bg-[#1A1A1A] text-[#A0A0A0] py-8 mt-auto border-t border-[#3C3C3C]">
        <div className="container mx-auto px-4 text-center">
          <p className="mb-0">ServiceNow Ticket Analysis Dashboard &copy; 2024</p>
        </div>
      </footer>
    </div>
  );
}