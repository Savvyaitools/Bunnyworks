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
  Lightbulb,
  Rocket
} from "lucide-react";

const guideData = [
  {
    category: "Getting Started",
    icon: Rocket,
    items: [
      {
        title: "Welcome to Creator OS",
        description: "Creator OS is an all-in-one agency management platform designed for OnlyFans management agencies. It helps you manage creators, employees, content, messaging, and revenue tracking in one place."
      },
      {
        title: "First Steps",
        description: "1. Add your creators in the Creators section\n2. Invite your team members via the Team page\n3. Set up shifts and assign chatters to creators\n4. Connect OnlyFans accounts via Browser Sync\n5. Start tracking tasks and revenue!"
      }
    ]
  },
  {
    category: "Main Features",
    icon: LayoutDashboard,
    items: [
      {
        title: "Dashboard",
        icon: LayoutDashboard,
        description: "Your command center showing key metrics, revenue stats, task progress, and team activity. Switch between Overview, Business, and Performance tabs for different insights."
      },
      {
        title: "Creators",
        icon: Users,
        description: "Manage all your creators here. Add new creators, view their profiles, track revenue, and manage their platform accounts. Click on a creator to see detailed stats, content plans, and earnings."
      },
      {
        title: "Creator Messages",
        icon: MessageSquare,
        description: "Internal messaging between your agency and creators. Use this for content requests, updates, and coordination—not for fan messaging."
      },
      {
        title: "Team",
        icon: UserCog,
        description: "Manage your employees (chatters, managers, QC staff). Assign roles, set permissions, track performance, and manage payroll. Use sub-tabs for Chatters and Performance views."
      },
      {
        title: "Tasks",
        icon: CheckSquare,
        description: "Kanban-style task board to track work across your agency. Create tasks, assign to team members, link to creators, and move through statuses: To Do → In Progress → Review → Completed."
      },
      {
        title: "Calendar",
        icon: Calendar,
        description: "Visual calendar for scheduling content, shifts, deadlines, and events. Great for planning content drops and coordinating team schedules."
      },
      {
        title: "Invoices",
        icon: FileText,
        description: "Track and manage creator invoices. Create invoices, mark as paid, and keep financial records organized."
      }
    ]
  },
  {
    category: "OnlyFans Management",
    icon: MessageSquare,
    items: [
      {
        title: "Subscriber DMs",
        icon: MessageSquare,
        description: "View and manage fan conversations synced from OnlyFans. Chatters use this to respond to subscribers. Requires OnlyFans account connection via Browser Sync."
      },
      {
        title: "Shift Roster",
        icon: CalendarClock,
        description: "Schedule chatter shifts across your creators. Assign time blocks, track who's covering which account, and ensure 24/7 coverage."
      },
      {
        title: "Team Chat",
        icon: MessageSquare,
        description: "Internal real-time chat for your team. Communicate with employees, share updates, and coordinate without leaving the platform."
      },
      {
        title: "Marketing",
        icon: TrendingUp,
        description: "Create tracking links for each traffic source (Reddit, TikTok, Instagram, etc.). Monitor clicks, conversions, and revenue attribution to see which campaigns perform best."
      }
    ]
  },
  {
    category: "Recruiting",
    icon: UserPlus,
    items: [
      {
        title: "Recruiting Pipeline",
        icon: UserPlus,
        description: "Track potential creators through your recruiting funnel. Add leads, update their status (Lead → Contacted → Negotiating → Signed), and convert them to active creators."
      },
      {
        title: "OF Discovery",
        icon: Search,
        description: "Search and discover new creators on OnlyFans. Filter by criteria and add promising creators to your recruiting pipeline."
      },
      {
        title: "Web Scraper",
        icon: Globe,
        description: "Scrape public data from social media profiles and websites. Useful for researching potential creators and gathering contact info."
      },
      {
        title: "Applications",
        icon: ClipboardList,
        description: "Review incoming applications from creators and employees. Share your application links publicly and process submissions here."
      }
    ]
  },
  {
    category: "Resources & Tools",
    icon: BookOpen,
    items: [
      {
        title: "SOP Library",
        icon: BookOpen,
        description: "Store and organize your Standard Operating Procedures. Create training docs, guides, and reference materials for your team."
      },
      {
        title: "Data Import",
        icon: Upload,
        description: "Import earnings data from screenshots or files. The system extracts revenue figures and attributes them to creators automatically."
      },
      {
        title: "Browser Sync",
        icon: Plug,
        description: "Connect OnlyFans accounts securely. This enables fan data sync, messaging, and real-time stats. Use the Chrome extension or manual session import."
      }
    ]
  },
  {
    category: "Tips & Best Practices",
    icon: Lightbulb,
    items: [
      {
        title: "Maximize Team Efficiency",
        description: "• Assign chatters to specific creators based on timezone coverage\n• Use the shift roster to ensure no gaps in DM response time\n• Track performance metrics to reward top chatters"
      },
      {
        title: "Content Planning",
        description: "• Create content plans in advance for each creator\n• Use the calendar to schedule posts and content drops\n• Reference media helps creators understand what's needed"
      },
      {
        title: "Revenue Tracking",
        description: "• Import earnings screenshots regularly for accurate data\n• Use marketing tracking links to measure campaign ROI\n• Review the dashboard daily to spot trends"
      },
      {
        title: "Security",
        description: "• Browser Sync sessions expire regularly for security\n• Use role-based permissions to limit access\n• Employee OF permissions control what each chatter can see"
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
          <h1 className="text-3xl font-bold text-foreground">User Guide</h1>
          <p className="text-muted-foreground mt-1">
            Learn how to use Creator OS to manage your agency effectively
          </p>
        </div>

        {/* Quick Start Card */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Quick Start</CardTitle>
            </div>
            <CardDescription>
              New to Creator OS? Here's how to get up and running in 5 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li><strong className="text-foreground">Add Creators:</strong> Go to Creators → Add Creator to set up your talent roster</li>
              <li><strong className="text-foreground">Build Your Team:</strong> Navigate to Team → Add employees with appropriate roles</li>
              <li><strong className="text-foreground">Connect OnlyFans:</strong> Use Browser Sync to link creator accounts</li>
              <li><strong className="text-foreground">Set Up Shifts:</strong> Schedule chatters in Shift Roster for coverage</li>
              <li><strong className="text-foreground">Track Everything:</strong> Use Dashboard to monitor performance daily</li>
            </ol>
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
                      <AccordionTrigger className="text-left">
                        <div className="flex items-center gap-2">
                          {item.icon && <item.icon className="h-4 w-4 text-muted-foreground" />}
                          <span>{item.title}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-muted-foreground whitespace-pre-line pl-6">
                          {item.description}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Footer */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              Need more help? Contact your agency administrator or reach out to support.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
