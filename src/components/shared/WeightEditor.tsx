import { cn } from '@/lib/utils';
import { ProgressBar } from './ProgressBar';
import { AlertBanner } from './AlertBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WeightItem {
  id: string;
  name: string;
  weight: number;
}

interface WeightEditorProps {
  items: WeightItem[];
  onChange: (id: string, newWeight: number) => void;
  onSave: () => void;
  isValid: boolean;
  totalWeight: number;
  isSaving?: boolean;
}

export function WeightEditor({
  items,
  onChange,
  onSave,
  isValid,
  totalWeight,
  isSaving = false,
}: WeightEditorProps) {
  const trafficLight = isValid ? 'groen' : totalWeight > 100 ? 'rood' : 'oranje';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Gewichten</CardTitle>
          <span
            className={cn(
              'font-mono text-sm font-medium',
              isValid ? 'text-green-600' : 'text-red-600'
            )}
          >
            Totaal: {totalWeight}%
          </span>
        </div>
        <ProgressBar
          value={totalWeight}
          trafficLight={trafficLight}
          showPercentage={false}
          height="sm"
        />
      </CardHeader>
      <CardContent className="space-y-3">
        {!isValid && (
          <AlertBanner
            variant={totalWeight > 100 ? 'error' : 'warning'}
            title={
              totalWeight > 100
                ? `Gewichten overschrijden 100% (${totalWeight}%)`
                : `Gewichten tellen op tot ${totalWeight}%, niet 100%.`
            }
            description="Pas de gewichten aan zodat ze exact 100% zijn."
          />
        )}

        {isValid && (
          <AlertBanner
            variant="success"
            title="Gewichten zijn correct (100%)"
          />
        )}

        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-3"
            >
              <span className="text-sm font-medium text-slate-700 flex-1 min-w-0 truncate">
                {item.name}
              </span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={item.weight}
                  onChange={(e) =>
                    onChange(item.id, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-20 text-right font-mono"
                />
                <span className="text-sm text-slate-500">%</span>
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={onSave}
          disabled={!isValid || isSaving}
          className="w-full"
        >
          {isSaving ? 'Opslaan...' : 'Opslaan'}
        </Button>
      </CardContent>
    </Card>
  );
}
