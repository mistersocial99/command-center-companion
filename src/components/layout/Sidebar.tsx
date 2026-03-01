import { useLocation, Link } from 'react-router-dom';
import {
  Users,
  Building2,
  BarChart3,
  LayoutDashboard,
  PenLine,
  CalendarCheck,
  ClipboardList,
  Target,
  UserCheck,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  onNavigate: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const location = useLocation();
  const { profile, signOut, isAdmin, isManager } = useAuth();

  const adminSection: NavSection = {
    title: 'BEHEER',
    items: [
      { label: 'Gebruikers', href: ROUTES.ADMIN_USERS, icon: Users },
      { label: 'Afdelingen', href: ROUTES.ADMIN_DEPARTMENTS, icon: Building2 },
      { label: 'KPI Configuratie', href: ROUTES.ADMIN_KPIS, icon: BarChart3 },
    ],
  };

  const managerSection: NavSection = {
    title: 'MIJN AFDELING',
    items: [
      { label: 'Dashboard', href: ROUTES.DEPARTMENT, icon: LayoutDashboard },
      { label: 'Sub-KPIs beheren', href: ROUTES.DEPARTMENT_SUB_KPIS, icon: Target },
      { label: 'Team check-ins', href: ROUTES.DEPARTMENT_CHECKINS, icon: UserCheck },
    ],
  };

  const employeeSection: NavSection = {
    title: 'MIJN DASHBOARD',
    items: [
      { label: 'Overzicht', href: ROUTES.DASHBOARD, icon: LayoutDashboard },
      { label: 'Data invoeren', href: ROUTES.DASHBOARD_INPUT, icon: PenLine },
      { label: 'Weekplan', href: ROUTES.DASHBOARD_PLAN, icon: CalendarCheck },
      { label: 'Weekreview', href: ROUTES.DASHBOARD_REVIEW, icon: ClipboardList },
    ],
  };

  const sections: NavSection[] = [];
  if (isAdmin) sections.push(adminSection);
  if (isManager) sections.push(managerSection);
  sections.push(employeeSection);

  const isActive = (href: string): boolean => {
    if (href === ROUTES.DEPARTMENT && location.pathname === ROUTES.DEPARTMENT) {
      return true;
    }
    return location.pathname.startsWith(href) && href !== ROUTES.DEPARTMENT;
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate();
  };

  return (
    <div className="flex h-full flex-col bg-sky-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <Link
          to="/"
          onClick={onNavigate}
          className="text-lg font-bold text-white tracking-tight"
        >
          Voltafy CCC
        </Link>
      </div>

      <Separator className="bg-sky-700" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" role="navigation" aria-label="Hoofdnavigatie">
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sky-300/70">
              {section.title}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-150',
                        active
                          ? 'bg-sky-600 text-white'
                          : 'text-white/70 hover:bg-sky-700/50 hover:text-white/90'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <Separator className="bg-sky-700" />

      {/* User info + logout */}
      <div className="p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-sky-600 text-white text-xs">
              {profile ? getInitials(profile.naam) : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {profile?.naam ?? 'Laden...'}
            </p>
            <p className="text-xs text-sky-300/70 capitalize">
              {profile?.rol ?? ''}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-sky-700/50 hover:text-white/90 transition-colors duration-150 mt-1"
        >
          <LogOut className="h-4 w-4" />
          Uitloggen
        </button>
      </div>
    </div>
  );
}
