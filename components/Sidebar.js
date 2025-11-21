// components/Sidebar.js
import Link from "next/link";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  PenSquare,
  Bot,
  MessageCircle,
  Settings,
  Users,
  Calendar,
  BarChart3,
  HelpCircle,
  Building2, // icon for company profile
} from "lucide-react";

export default function Sidebar({ role = "CANDIDATE", active }) {
  const router = useRouter();
  const roleSafe = String(role || "CANDIDATE").toUpperCase();
  const isCandidate = roleSafe === "CANDIDATE";

  // Always use the real path for route-based matching
  const path = router.pathname || "";

  /* ---------------------------------------------
     CANDIDATE NAVIGATION
  ----------------------------------------------*/
  const candidateLinks = [
    {
      id: "dashboard",
      href: "/candidate/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "profile",
      href: "/candidate/profile",
      label: "My Profile",
      icon: User,
    },
    {
      id: "jobs",
      href: "/candidate/job-profiles",
      label: "Job Profiles",
      icon: Briefcase,
    },
    {
      id: "resume",
      href: "/candidate/resume-ats",
      label: "Resume ATS",
      icon: FileText,
    },
    {
      id: "mock",
      href: "/candidate/mock-aptitude",
      label: "Mock Test",
      icon: PenSquare,
    },
    {
      id: "ai-mock",
      href: "/candidate/ai-mock-interview",
      label: "AI Mock Interview",
      icon: Bot,
    },
    {
      id: "forum",
      href: "/candidate/forum",
      label: "Forum",
      icon: MessageCircle,
    },
    {
      id: "settings",
      href: "/candidate/settings",
      label: "Settings",
      icon: Settings,
    },
  ];

  /* ---------------------------------------------
     RECRUITER NAVIGATION
  ----------------------------------------------*/
  const recruiterLinks = [
    {
      id: "dashboard",
      label: "Dashboard",
      href: "/recruiter/dashboard",
      icon: LayoutDashboard,
    },

    // Company Profile ABOVE Jobs
    {
      id: "company-profile",
      label: "Company Profile",
      href: "/recruiter/profile",
      icon: Building2,
    },

    {
      id: "jobs",
      label: "Jobs",
      href: "/recruiter/job-profiles",
      icon: Briefcase,
    },
    {
      id: "candidates",
      label: "Candidates",
      href: "/recruiter/candidates",
      icon: Users,
    },
    {
      id: "calendar",
      label: "Calendar",
      href: "/recruiter/calendar",
      icon: Calendar,
    },
    {
      id: "analytics",
      label: "Analytics",
      href: "/recruiter/analytics",
      icon: BarChart3,
    },
    {
      id: "settings",
      label: "Settings",
      href: "/recruiter/settings",
      icon: Settings,
    },
  ];

  const links = isCandidate ? candidateLinks : recruiterLinks;
  const helpHref = isCandidate ? "/candidate/help" : "/recruiter/help";
  const portalLabel = isCandidate ? "Candidate Portal" : "Recruiter Portal";

  return (
    <aside className="dashboard-sidebar card flex flex-col justify-between">
      <div>
        <div className="text-xs font-semibold text-gray-500 tracking-wide uppercase mb-1">
          Recruiver
        </div>
        <div className="text-sm text-gray-400 mb-4">{portalLabel}</div>

        <nav className="space-y-1">
          {links.map((link) => {
            const Icon = link.icon;

            const isActive =
              // explicit active id from layout
              active === link.id ||
              // special case: job-profiles page passing active="job-profiles"
              (link.id === "jobs" && active === "job-profiles") ||
              // route-based matching
              path === link.href ||
              (typeof path === "string" && path.startsWith(link.href));

            return (
              <Link
                key={link.id}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={[
                  "sidebar-link",
                  "w-full",
                  isActive ? "active" : "",
                ].join(" ")}
              >
                <Icon size={18} className="shrink-0" />
                <span className="truncate text-sm">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-4 mt-4 border-t border-gray-100">
        <Link
          href={helpHref}
          className="sidebar-link text-gray-500 hover:text-gray-700"
        >
          <HelpCircle size={18} className="shrink-0" />
          <span className="truncate text-sm">Help</span>
        </Link>
      </div>
    </aside>
  );
}
