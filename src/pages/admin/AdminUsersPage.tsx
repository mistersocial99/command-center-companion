import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MoreHorizontal, Search } from 'lucide-react';
import { useUsers, useUpdateUser, useToggleUserActive, useInviteUser } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useDepartments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/EmptyState';

const userFormSchema = z
  .object({
    naam: z.string().min(2, 'Minimaal 2 tekens').max(100),
    email: z.string().email('Ongeldig e-mailadres'),
    rol: z.enum(['admin', 'manager', 'medewerker']),
    afdeling_id: z.string().nullable(),
  })
  .refine((data) => data.rol === 'admin' || data.afdeling_id !== null, {
    message: 'Afdeling is verplicht voor managers en medewerkers',
    path: ['afdeling_id'],
  });

type UserFormData = z.infer<typeof userFormSchema>;

const rolBadgeColors: Record<string, string> = {
  admin: 'bg-sky-100 text-sky-700',
  manager: 'bg-amber-100 text-amber-800',
  medewerker: 'bg-slate-100 text-slate-700',
};

export function AdminUsersPage() {
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState<string>('');
  const [filterAfdeling, setFilterAfdeling] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  const { data: users, isLoading } = useUsers({
    search: search || undefined,
    rol: filterRol || undefined,
    afdelingId: filterAfdeling || undefined,
  });

  const { data: departments = [] } = useDepartments();
  const updateUser = useUpdateUser();
  const inviteUser = useInviteUser();
  const toggleActive = useToggleUserActive();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: { naam: '', email: '', rol: 'medewerker', afdeling_id: null },
  });

  const handleEdit = (user: (typeof users extends (infer T)[] | undefined ? T : never)) => {
    if (!user) return;
    setEditUserId(user.id);
    form.reset({
      naam: user.naam,
      email: user.email,
      rol: user.rol,
      afdeling_id: user.afdeling_id,
    });
    setDialogOpen(true);
  };

  const handleSave = async (data: UserFormData) => {
    if (editUserId) {
      await updateUser.mutateAsync({
        id: editUserId,
        updates: {
          naam: data.naam,
          rol: data.rol,
          afdeling_id: data.afdeling_id,
        },
      });
    } else {
      await inviteUser.mutateAsync({
        email: data.email,
        naam: data.naam,
        rol: data.rol,
        afdelingId: data.afdeling_id,
      });
    }
    setDialogOpen(false);
    setEditUserId(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Gebruikers</h1>
        <Button onClick={() => {
          setEditUserId(null);
          form.reset({ naam: '', email: '', rol: 'medewerker', afdeling_id: null });
          setDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Gebruiker toevoegen
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <Select value={filterAfdeling} onValueChange={setFilterAfdeling}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Alle afdelingen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle afdelingen</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.naam}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterRol} onValueChange={setFilterRol}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Alle rollen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle rollen</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="medewerker">Medewerker</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Zoek op naam of e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !users || users.length === 0 ? (
        <EmptyState
          title="Nog geen gebruikers"
          description="Nodig de eerste gebruiker uit om aan de slag te gaan."
          actionLabel="Gebruiker toevoegen"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="rounded-xl border bg-white">
          <Table aria-label="Gebruikers overzicht">
            <TableHeader>
              <TableRow>
                <TableHead>Naam</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Afdeling</TableHead>
                <TableHead className="w-16">Actief</TableHead>
                <TableHead className="w-16">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.naam}</TableCell>
                  <TableCell className="text-slate-500">{user.email}</TableCell>
                  <TableCell>
                    <Badge className={rolBadgeColors[user.rol]} variant="secondary">
                      {user.rol}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {user.departments?.naam ?? '--'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        user.is_actief ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {user.is_actief ? 'Ja' : 'Nee'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            toggleActive.mutate({
                              id: user.id,
                              isActief: !user.is_actief,
                            })
                          }
                        >
                          {user.is_actief ? 'Deactiveren' : 'Activeren'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editUserId ? 'Gebruiker bewerken' : 'Gebruiker toevoegen'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Naam</Label>
              <Input id="naam" {...form.register('naam')} />
              {form.formState.errors.naam && (
                <p className="text-xs text-red-600">{form.formState.errors.naam.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...form.register('email')} disabled={!!editUserId} />
              {form.formState.errors.email && (
                <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select
                value={form.watch('rol')}
                onValueChange={(v) => form.setValue('rol', v as UserFormData['rol'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medewerker">Medewerker</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Afdeling</Label>
              <Select
                value={form.watch('afdeling_id') ?? ''}
                onValueChange={(v) => form.setValue('afdeling_id', v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer afdeling" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geen afdeling</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.naam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.afdeling_id && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.afdeling_id.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" disabled={updateUser.isPending || inviteUser.isPending}>
                {editUserId ? 'Opslaan' : 'Uitnodigen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
