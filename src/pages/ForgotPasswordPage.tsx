import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const schema = z.object({
  email: z.string().email('Ongeldig e-mailadres'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    setStatus('idle');

    const result = await resetPassword(data.email);

    if (result.error) {
      setStatus('error');
      setErrorMessage(result.error);
    } else {
      setStatus('success');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-sky-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          <h1 className="text-2xl font-bold text-slate-900">Voltafy</h1>
          <p className="text-sm text-slate-500">Wachtwoord herstellen</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 mb-4">
            Voer je e-mailadres in en we sturen een herstellink.
          </p>

          {status === 'success' && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                Herstelmail verzonden. Controleer je inbox.
              </AlertDescription>
            </Alert>
          )}

          {status === 'error' && errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="jouw@voltafy.nl"
                {...form.register('email')}
                aria-required="true"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600" role="alert">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Versturen...
                </>
              ) : (
                'Herstelmail sturen'
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link
              to={ROUTES.LOGIN}
              className="text-sm text-sky-600 hover:underline"
            >
              Terug naar inloggen
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
