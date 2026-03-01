import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MoreHorizontal } from 'lucide-react';
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '@/hooks/useDepartments';
import { useUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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

const departmentSchema = z.object({
  naam: z.string().min(2, 'Minimaal 2 tekens').max(100),
  manager_id: z.string().nullable(),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

export function AdminDepartmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: departments, isLoading } = useDepartments();
  const { data: managers = [] } = useUsers({ rol: 'manager' });
  const { data: admins = [] } = useUsers({ rol: 'admin' });
  const possibleManagers = [...(admins ?? []), ...(managers ?? [])];

  const createDept = useCreateDepartment();
  const updateDept = useUpdateDepartment();
  const deleteDept = useDeleteDepartment();

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: { naam: '', manager_id: null },
  });

  const handleEdit = (dept: NonNullable<typeof departments>[number]) => {
    setEditId(dept.id);
    form.reset({ naam: dept.naam, manager_id: dept.manager_id });
    setDialogOpen(true);
  };

  const handleSave = async (data: DepartmentFormData) => {
    if (editId) {
      await updateDept.mutateAsync({ id: editId, updates: data });
    } else {
      await createDept.mutateAsync(data);
    }
    setDialogOpen(false);
    setEditId(null);
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDept.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Afdelingen</h1>
        <Button
          onClick={() => {
            setEditId(null);
            form.reset({ naam: '', manager_id: null });
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Afdeling toevoegen
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : !departments || departments.length === 0 ? (
        <EmptyState
          title="Nog geen afdelingen"
          description="Maak de eerste afdeling aan."
          actionLabel="Afdeling toevoegen"
          onAction={() => setDialogOpen(true)}
        />
      ) : (
        <div className="rounded-xl border bg-white">
          <Table aria-label="Afdelingen overzicht">
            <TableHeader>
              <TableRow>
                <TableHead>Afdeling</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead className="w-16">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.naam}</TableCell>
                  <TableCell className="text-slate-500">
                    {dept.manager?.naam ?? 'Niet toegewezen'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(dept)}>
                          Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setDeleteId(dept.id)}
                        >
                          Verwijderen
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

      {/* Create/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? 'Afdeling bewerken' : 'Afdeling toevoegen'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="naam">Naam</Label>
              <Input id="naam" {...form.register('naam')} />
              {form.formState.errors.naam && (
                <p className="text-xs text-red-600">
                  {form.formState.errors.naam.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Manager</Label>
              <Select
                value={form.watch('manager_id') ?? ''}
                onValueChange={(v) => form.setValue('manager_id', v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer manager" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geen manager</SelectItem>
                  {possibleManagers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.naam} ({m.rol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button type="submit">Opslaan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Afdeling verwijderen?</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze afdeling wilt verwijderen? Medewerkers in
              deze afdeling verliezen hun afdelingskoppeling.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
