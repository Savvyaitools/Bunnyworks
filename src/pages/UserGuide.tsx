import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  LayoutDashboard, 
  Users, 
  UserCog, 
  CheckSquare, 
  Calendar,
  FileText,
  MessageSquare,
  TrendingUp,
  CalendarClock,
  UserPlus,
  BookOpen,
  Upload,
  Plug,
  Search,
  Globe,
  ClipboardList,
  Rocket,
  MousePointer,
  Plus,
  Eye,
  RefreshCw,
  Link2,
  Clock,
  Settings,
  Shield
} from "lucide-react";

const guideData = [
  {
    category: "Getting Started",
    icon: Rocket,
    items: [
      {
        title: "Set Up Your Agency",
        steps: [
          "Go to Settings → Agency to update your agency name and logo",
          "Set your default commission rate (typically 30-50%)",
          "Configure your subscription tier if needed"
        ]
      },
      {
        title: "Add Your First Creator",
        steps: [
          "Navigate to Creators page",
          "Click 'Add Creator' button",
          "Enter their name, email, and platform details",
          "After adding, go to their profile → Social Accounts to connect OnlyFans"
        ]
      },
      {
        title: "Build Your Team",
        steps: [
          "Go to Team page → Add Employee",
          "Fill in employee details and select their role (Chatter, Manager, etc.)",
          "Click 'Create Login' on their card to generate credentials",
          "Share credentials so they can access the Employee Portal"
        ]
      },
      {
        title: "Connect OnlyFans Accounts",
        steps: [
          "Navigate to Browser Sync",
          "Install the Chrome extension or use manual session import",
          "Log into the creator's OnlyFans account",
          "Once connected, earnings and messages will sync automatically"
        ]
      }
    ]
  },
  {
    category: "Daily Operations",
    icon: LayoutDashboard,
    items: [
      {
        title: "Check Your Dashboard",
        steps: [
          "View today's revenue, messages sent, and active chatters",
          "Switch between Overview, Business, and Performance tabs",
          "Click 'Sync' to refresh OnlyFans data",
          "Review the activity feed for recent updates"
        ]
      },
      {
        title: "Manage Tasks",
        steps: [
          "Create tasks with 'Create Task' button",
          "Assign to employees and link to specific creators",
          "Drag tasks between columns: To Do → In Progress → Review → Completed",
          "Filter by status or request type"
        ]
      },
      {
        title: "Use Subscriber DMs",
        steps: [
          "Navigate to Subscriber DMs",
          "Select a creator account from the dropdown",
          "View and respond to fan messages",
          "Use the Fan CRM tab to see high-value subscribers"
        ]
      },
      {
        title: "Schedule Shifts",
        steps: [
          "Go to Shift Roster",
          "Click on a time block to assign a chatter",
          "Select the chatter and creator for that shift",
          "Ensure 24/7 coverage across timezones"
        ]
      }
    ]
  },
  {
    category: "Creator Management",
    icon: Users,
    items: [
      {
        title: "View Creator Earnings",
        steps: [
          "Click on a creator card → Earnings tab",
          "See monthly breakdown: Subscriptions, Tips, Messages",
          "Click 'How Earnings Work' for explanations",
          "Review commission split between creator and agency"
        ]
      },
      {
        title: "Create Marketing Links",
        steps: [
          "Go to creator profile → Marketing tab",
          "Click 'Create Link'",
          "Add a unique tracking code (e.g., 'ig-bio')",
          "Select traffic source and campaign",
          "Share the link and track clicks/conversions"
        ]
      },
      {
        title: "Manage Content Plans",
        steps: [
          "Navigate to creator → Content Plans tab",
          "Create a new content plan with description",
          "Add reference media for the creator to follow",
          "Track submission status and approve content"
        ]
      },
      {
        title: "Handle Custom Requests",
        steps: [
          "Go to creator → Custom Requests tab",
          "Create requests for special content orders",
          "Set price and due date",
          "Track progress from Pending → In Progress → Completed"
        ]
      }
    ]
  },
  {
    category: "Team Communication",
    icon: MessageSquare,
    items: [
      {
        title: "Message Your Team",
        steps: [
          "Go to Team Chat (OnlyFans section)",
          "Select an employee from the list",
          "Type your message and press Enter",
          "Messages sync in real-time"
        ]
      },
      {
        title: "Message Creators",
        steps: [
          "Navigate to Creator Messages",
          "Select a creator to chat with",
          "Use for content requests and updates",
          "Keep communication organized"
        ]
      }
    ]
  },
  {
    category: "Recruiting",
    icon: UserPlus,
    items: [
      {
        title: "Track Recruiting Pipeline",
        steps: [
          "Go to Recruiting page",
          "Add new leads with 'Add Lead' button",
          "Move through stages: Lead → Contacted → Negotiating → Signed",
          "Convert signed leads to active creators"
        ]
      },
      {
        title: "Use OF Discovery",
        steps: [
          "Navigate to OF Discovery",
          "Search for creators by username or criteria",
          "Add promising creators to your pipeline",
          "Track outreach progress"
        ]
      },
      {
        title: "Review Applications",
        steps: [
          "Check Applications page for new submissions",
          "Review creator and employee applications",
          "Approve or reject with notes",
          "Share your application link for inbound leads"
        ]
      }
    ]
  },
  {
    category: "Data & Analytics",
    icon: TrendingUp,
    items: [
      {
        title: "Import Earnings Data",
        steps: [
          "Go to Data Import",
          "Upload screenshots or files of earnings",
          "System extracts revenue figures automatically",
          "Review and approve imported data"
        ]
      },
      {
        title: "Track Marketing ROI",
        steps: [
          "Create tracking links per traffic source",
          "Monitor clicks and conversions over time",
          "Compare revenue by source and campaign",
          "Double down on top-performing channels"
        ]
      }
    ]
  }
];

export default function UserGuide() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">How to Use Creator OS</h1>
          <p className="text-muted-foreground mt-1">
            Step-by-step guides to help you manage your agency effectively
          </p>
        </div>

        {/* Quick Start Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quick Start Checklist</CardTitle>
            </div>
            <CardDescription>
              Complete these steps to get your agency running
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">1</div>
                <div>
                  <p className="font-medium text-foreground">Add Creators</p>
                  <p className="text-sm text-muted-foreground">Creators → Add Creator</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">2</div>
                <div>
                  <p className="font-medium text-foreground">Build Your Team</p>
                  <p className="text-sm text-muted-foreground">Team → Add Employee</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">3</div>
                <div>
                  <p className="font-medium text-foreground">Connect OnlyFans</p>
                  <p className="text-sm text-muted-foreground">Browser Sync → Connect Account</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-background/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">4</div>
                <div>
                  <p className="font-medium text-foreground">Set Up Shifts</p>
                  <p className="text-sm text-muted-foreground">Shift Roster → Assign Chatters</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guide Sections */}
        <div className="grid gap-6">
          {guideData.map((section) => (
            <Card key={section.category}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <section.icon className="h-5 w-5 text-primary" />
                  <CardTitle>{section.category}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {section.items.map((item, index) => (
                    <AccordionItem key={index} value={`${section.category}-${index}`}>
                      <AccordionTrigger className="text-left hover:no-underline">
                        <div className="flex items-center gap-2">
                          <MousePointer className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{item.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ol className="space-y-2 pl-6">
                          {item.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center">
                                {stepIndex + 1}
                              </span>
                              <span className="text-muted-foreground pt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              <AccordionItem value="faq-1">
                <AccordionTrigger>How does OnlyFans data sync work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Browser Sync captures a secure session from the creator's OnlyFans account. This session is used to fetch earnings, messages, and subscriber data. Sessions expire periodically for security and need to be refreshed.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-2">
                <AccordionTrigger>What permissions do employees have?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Employee permissions are set per creator. Go to a creator's profile → Team Access to configure what each employee can see (chats, earnings, vault, etc.). Chatters typically get messaging access, while managers get broader visibility.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-3">
                <AccordionTrigger>How do tracking links attribute revenue?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  When a fan subscribes through a tracking link, the system detects the campaign code and attributes subsequent purchases to that link. Check each creator's Marketing tab to see performance by source.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="faq-4">
                <AccordionTrigger>Can I customize commission rates per creator?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes! Each creator can have a custom commission rate. Edit the creator's profile → Overview tab to set their specific rate. This overrides the default agency rate for that creator.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Help Footer */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              Need more help? Check the in-app guides on each page (look for the 💡 icon) or contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
