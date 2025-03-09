export interface ServiceNowTicket {
  number: string;
  short_description: string;
  description?: string;
  sys_created_on: string;
  closed_at?: string;
  state: string;
  priority: string;
  assigned_to?: { display_value: string };
  category?: string;
  subcategory?: string;
  cmdb_ci?: { display_value: string }; // Configuration item (affected software/hardware)
  comments_and_work_notes?: string;
  resolution_notes?: string;
}

// Mock ServiceNow tickets data
export const mockServiceNowData: ServiceNowTicket[] = [
  {
    number: "INC0001234",
    short_description: "Unable to login to email",
    description: "User reports being unable to log into their email account. Gets 'incorrect password' error even though password was recently reset.",
    sys_created_on: "2024-02-15T08:23:45Z",
    closed_at: "2024-02-15T14:45:21Z",
    state: "Closed",
    priority: "3 - Moderate",
    assigned_to: { display_value: "John Smith" },
    category: "Software",
    subcategory: "Email",
    cmdb_ci: { display_value: "Email Client" },
    resolution_notes: "Reset user's password and cleared browser cache. Verified login successful."
  },
  {
    number: "INC0001235",
    short_description: "Microsoft Word crashing when opening large documents",
    description: "User reports Word crashes whenever attempting to open documents larger than 20MB. Error message mentions memory issues.",
    sys_created_on: "2024-02-16T09:12:33Z",
    closed_at: "2024-02-17T11:30:15Z",
    state: "Closed",
    priority: "3 - Moderate",
    assigned_to: { display_value: "Jane Doe" },
    category: "Software",
    subcategory: "Office Suite",
    cmdb_ci: { display_value: "Microsoft Office" },
    resolution_notes: "Updated Microsoft Office to latest version and increased application memory allocation."
  },
  {
    number: "INC0001236",
    short_description: "Printer not connecting to network",
    description: "Department printer on 3rd floor not showing up on network. Users unable to print documents.",
    sys_created_on: "2024-02-17T13:45:22Z",
    closed_at: "2024-02-17T16:20:10Z",
    state: "Closed",
    priority: "2 - High",
    assigned_to: { display_value: "Michael Johnson" },
    category: "Hardware",
    subcategory: "Printer",
    cmdb_ci: { display_value: "HP LaserJet 4050" },
    resolution_notes: "Printer needed IP reset. Configured static IP and updated print server settings."
  },
  {
    number: "INC0001237",
    short_description: "VPN connection failing for remote worker",
    description: "Remote employee unable to establish VPN connection from home office. Gets 'connection timeout' error.",
    sys_created_on: "2024-02-18T07:55:12Z",
    closed_at: "2024-02-18T13:10:45Z",
    state: "Closed",
    priority: "2 - High",
    assigned_to: { display_value: "Sarah Williams" },
    category: "Network",
    subcategory: "VPN",
    cmdb_ci: { display_value: "VPN" },
    resolution_notes: "User's ISP was blocking VPN ports. Provided configuration for alternative port and verified connection."
  },
  {
    number: "INC0001238",
    short_description: "Unable to access shared drive",
    description: "Marketing team unable to access the shared network drive where campaign assets are stored.",
    sys_created_on: "2024-02-19T10:30:21Z",
    closed_at: "2024-02-19T11:45:33Z",
    state: "Closed",
    priority: "3 - Moderate",
    assigned_to: { display_value: "Robert Brown" },
    category: "Access",
    subcategory: "File Share",
    cmdb_ci: { display_value: "Network Storage" },
    resolution_notes: "File server service had stopped. Restarted service and verified access for all users."
  },
  {
    number: "INC0001239",
    short_description: "CRM software extremely slow",
    description: "Sales team reporting that the CRM software is taking 30+ seconds to load each customer record.",
    sys_created_on: "2024-02-20T14:22:18Z",
    state: "In Progress",
    priority: "2 - High",
    assigned_to: { display_value: "Emily Davis" },
    category: "Software",
    subcategory: "CRM",
    cmdb_ci: { display_value: "CRM Software" }
  },
  {
    number: "INC0001240",
    short_description: "Need new user account for new hire",
    description: "New employee starting in Accounting department on Monday needs system access and email account setup.",
    sys_created_on: "2024-02-21T09:10:45Z",
    closed_at: "2024-02-21T15:30:22Z",
    state: "Closed",
    priority: "4 - Low",
    assigned_to: { display_value: "John Smith" },
    category: "Access",
    subcategory: "User Account",
    resolution_notes: "Created user account, set up email, and assigned appropriate security groups."
  },
  {
    number: "INC0001241",
    short_description: "Monitor display flickering",
    description: "User reports their monitor display is flickering intermittently throughout the day, causing eye strain.",
    sys_created_on: "2024-02-22T11:33:27Z",
    closed_at: "2024-02-23T10:15:42Z",
    state: "Closed",
    priority: "3 - Moderate",
    assigned_to: { display_value: "Michael Johnson" },
    category: "Hardware",
    subcategory: "Monitor",
    cmdb_ci: { display_value: "Dell Monitor" },
    resolution_notes: "Replaced faulty display cable and adjusted refresh rate settings."
  },
  {
    number: "INC0001242",
    short_description: "Conference room projector not working",
    description: "The projector in main conference room not displaying content from laptops. Needed for executive presentation tomorrow.",
    sys_created_on: "2024-02-23T15:22:11Z",
    closed_at: "2024-02-23T17:05:30Z",
    state: "Closed",
    priority: "1 - Critical",
    assigned_to: { display_value: "Sarah Williams" },
    category: "Hardware",
    subcategory: "Projector",
    cmdb_ci: { display_value: "Projector System" },
    resolution_notes: "Projector input had been changed to unused port. Reset settings and tested with multiple devices."
  },
  {
    number: "INC0001243",
    short_description: "Can't access ERP system after password change",
    description: "User changed network password but now cannot access the ERP system with new credentials.",
    sys_created_on: "2024-02-24T08:45:19Z",
    state: "In Progress",
    priority: "2 - High",
    assigned_to: { display_value: "Robert Brown" },
    category: "Software",
    subcategory: "ERP",
    cmdb_ci: { display_value: "ERP System" }
  }
];

// More tickets would be included in a real application to support the statistics 