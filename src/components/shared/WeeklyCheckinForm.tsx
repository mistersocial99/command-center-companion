import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WEEK_PLAN_LIMITS, REVIEW_LIMITS } from '@/lib/constants';

const planSchema = z.object({
  items: z
    .array(
      z.object({
        value: z
          .string()
          .min(WEEK_PLAN_LIMITS.MIN_ITEM_LENGTH, `Minimaal ${WEEK_PLAN_LIMITS.MIN_ITEM_LENGTH} tekens`)
          .max(WEEK_PLAN_LIMITS.MAX_ITEM_LENGTH, `Maximaal ${WEEK_PLAN_LIMITS.MAX_ITEM_LENGTH} tekens`),
      })
    )
    .min(1, 'Vul minimaal 1 commitment in')
    .max(WEEK_PLAN_LIMITS.MAX_ITEMS, `Maximaal ${WEEK_PLAN_LIMITS.MAX_ITEMS} commitments`),
});

const reviewSchema = z.object({
  vrijdag_review: z
    .string()
    .min(REVIEW_LIMITS.MIN_LENGTH, `Schrijf minimaal ${REVIEW_LIMITS.MIN_LENGTH} tekens`)
    .max(REVIEW_LIMITS.MAX_LENGTH, `Maximaal ${REVIEW_LIMITS.MAX_LENGTH} tekens`),
  score_eigen: z
    .number()
    .min(0, 'Minimaal 0')
    .max(100, 'Maximaal 100')
    .nullable()
    .optional(),
});

type PlanFormData = z.infer<typeof planSchema>;
type ReviewFormData = z.infer<typeof reviewSchema>;

interface WeeklyCheckinFormProps {
  type: 'plan' | 'review';
  week: string;
  initialData?: {
    plan?: string[];
    review?: string;
    scoreEigen?: number;
  };
  existingPlan?: string[];
  onSubmit: (data: { plan?: string[]; review?: string; scoreEigen?: number | null }) => void;
  isLoading?: boolean;
}

export function WeeklyCheckinForm({
  type,
  week,
  initialData,
  existingPlan,
  onSubmit,
  isLoading = false,
}: WeeklyCheckinFormProps) {
  if (type === 'plan') {
    return (
      <PlanForm
        week={week}
        initialItems={initialData?.plan}
        onSubmit={(items) => onSubmit({ plan: items })}
        isLoading={isLoading}
      />
    );
  }

  return (
    <ReviewForm
      week={week}
      existingPlan={existingPlan}
      initialReview={initialData?.review}
      initialScore={initialData?.scoreEigen}
      onSubmit={(review, scoreEigen) => onSubmit({ review, scoreEigen })}
      isLoading={isLoading}
    />
  );
}

function PlanForm({
  week,
  initialItems,
  onSubmit,
  isLoading,
}: {
  week: string;
  initialItems?: string[];
  onSubmit: (items: string[]) => void;
  isLoading: boolean;
}) {
  const form = useForm<PlanFormData>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      items: initialItems?.map((v) => ({ value: v })) || [{ value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleSubmit = (data: PlanFormData) => {
    onSubmit(data.items.map((item) => item.value));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekplan - {week}</CardTitle>
        <p className="text-sm text-slate-500">
          Wat ga je deze week bereiken? Vul maximaal {WEEK_PLAN_LIMITS.MAX_ITEMS} concrete commitments in.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <span className="mt-2.5 text-sm font-medium text-slate-500 w-6">
                {index + 1}.
              </span>
              <div className="flex-1">
                <Input
                  {...form.register(`items.${index}.value`)}
                  placeholder="Beschrijf je commitment..."
                />
                {form.formState.errors.items?.[index]?.value && (
                  <p className="mt-1 text-xs text-red-600">
                    {form.formState.errors.items[index]?.value?.message}
                  </p>
                )}
              </div>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-1"
                  onClick={() => remove(index)}
                  aria-label="Verwijder punt"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}

          {fields.length < WEEK_PLAN_LIMITS.MAX_ITEMS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ value: '' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              Punt toevoegen
            </Button>
          )}

          {form.formState.errors.items?.message && (
            <p className="text-xs text-red-600">
              {form.formState.errors.items.message}
            </p>
          )}

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading
              ? 'Opslaan...'
              : initialItems
              ? 'Bijwerken'
              : 'Opslaan'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function ReviewForm({
  week,
  existingPlan,
  initialReview,
  initialScore,
  onSubmit,
  isLoading,
}: {
  week: string;
  existingPlan?: string[];
  initialReview?: string;
  initialScore?: number;
  onSubmit: (review: string, scoreEigen: number | null) => void;
  isLoading: boolean;
}) {
  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      vrijdag_review: initialReview ?? '',
      score_eigen: initialScore ?? null,
    },
  });

  const handleSubmit = (data: ReviewFormData) => {
    onSubmit(data.vrijdag_review, data.score_eigen ?? null);
  };

  return (
    <div className="space-y-6">
      {existingPlan && existingPlan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Jouw weekplan</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-1">
              {existingPlan.map((item, index) => (
                <li key={index} className="text-sm text-slate-700">
                  {item}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {!existingPlan && (
        <Card className="border-dashed">
          <CardContent className="py-4">
            <p className="text-sm text-slate-500">
              Je hebt geen weekplan ingevuld. Je kunt toch een review invullen.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Weekreview - {week}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="review">Hoe is je week verlopen?</Label>
              <Textarea
                id="review"
                {...form.register('vrijdag_review')}
                placeholder="Beschrijf hoe je week is verlopen..."
                rows={4}
              />
              {form.formState.errors.vrijdag_review && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.vrijdag_review.message}
                </p>
              )}
              <p className="text-xs text-slate-400">
                {form.watch('vrijdag_review')?.length ?? 0} / {REVIEW_LIMITS.MAX_LENGTH} tekens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scoreEigen">
                Hoe beoordeel je je eigen week? (optioneel, 0-100)
              </Label>
              <Input
                id="scoreEigen"
                type="number"
                min={0}
                max={100}
                {...form.register('score_eigen', { valueAsNumber: true })}
                placeholder="0-100"
                className="w-32"
              />
              {form.formState.errors.score_eigen && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.score_eigen.message}
                </p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading
                ? 'Opslaan...'
                : initialReview
                ? 'Bijwerken'
                : 'Opslaan'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
