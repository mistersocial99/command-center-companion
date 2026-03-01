import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Topbar() {
  const { profile } = useAuth();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 lg:px-8">
      {/* Left: App name (visible on mobile where sidebar is hidden) */}
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-slate-900 lg:hidden pl-10">
          Voltafy CCC
        </h1>
        <span className="hidden lg:block text-sm text-slate-500">
          Company Command Center
        </span>
      </div>

      {/* Right: User info */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-sm font-medium text-slate-900">
            {profile?.naam ?? 'Laden...'}
          </p>
          <p className="text-xs text-slate-500 capitalize">
            {profile?.rol ?? ''}
          </p>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-sky-100 text-sky-700 text-xs font-medium">
            {profile ? getInitials(profile.naam) : '?'}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
