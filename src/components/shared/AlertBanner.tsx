import { AlertCircle, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface AlertBannerProps {
  variant: 'warning' | 'error' | 'info' | 'success';
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

const variantConfig = {
  warning: {
    Icon: AlertTriangle,
    className: 'border-amber-200 bg-amber-50 text-amber-800',
    iconClass: 'text-amber-600',
  },
  error: {
    Icon: AlertCircle,
    className: 'border-red-200 bg-red-50 text-red-800',
    iconClass: 'text-red-600',
  },
  info: {
    Icon: Info,
    className: 'border-sky-200 bg-sky-50 text-sky-800',
    iconClass: 'text-sky-600',
  },
  success: {
    Icon: CheckCircle,
    className: 'border-green-200 bg-green-50 text-green-800',
    iconClass: 'text-green-600',
  },
};

export function AlertBanner({
  variant,
  title,
  description,
  action,
  dismissible = false,
}: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const config = variantConfig[variant];
  const { Icon } = config;

  return (
    <Alert className={cn(config.className, 'relative')}>
      <Icon className={cn('h-4 w-4', config.iconClass)} />
      <AlertTitle className="font-medium">{title}</AlertTitle>
      {description && <AlertDescription>{description}</AlertDescription>}

      <div className="flex items-center gap-2 mt-2">
        {action && (
          <Button
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="h-7 text-xs"
          >
            {action.label}
          </Button>
        )}
      </div>

      {dismissible && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-3 right-3 rounded-full p-1 hover:bg-black/5"
          aria-label="Sluiten"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </Alert>
  );
}
