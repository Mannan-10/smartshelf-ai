'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { KeyRound, Copy, Check, UserPlus, Trash2 } from 'lucide-react';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

const staffSchema = z.object({
  name: z.string().optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['STAFF', 'ADMIN', 'OWNER']),
});

export function StaffManager() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    name: string;
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Password reset dialog state
  const [resetUser, setResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const form = useForm<z.infer<typeof staffSchema>>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'STAFF',
    },
  });

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const onSubmit = async (values: z.infer<typeof staffSchema>) => {
    try {
      const assignedPassword = values.password && values.password.trim() ? values.password.trim() : 'password123';
      const payload = {
        ...values,
        password: assignedPassword,
      };

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create user');

      setOpen(false);
      form.reset();
      loadUsers();

      // Show credentials confirmation dialog so admin knows the password
      setCreatedCredentials({
        name: data.name || values.email.split('@')[0],
        email: values.email,
        password: data.initialPassword || assignedPassword,
      });
    } catch (err: any) {
      form.setError('root', { message: err.message });
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Failed to delete user');
        return;
      }
      loadUsers();
    } catch (e) {
      console.error(e);
      alert('An unexpected error occurred while deleting user');
    }
  };

  const updateRole = async (id: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const error = await res.json();
        alert(error.message || 'Failed to update role');
        return;
      }
      loadUsers();
    } catch (e) {
      console.error(e);
      alert('An unexpected error occurred while updating role');
    }
  };

  const handleResetPassword = async () => {
    if (!resetUser) return;
    if (!newPassword || newPassword.trim().length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }

    setResetSubmitting(true);
    setResetError('');
    setResetSuccess('');

    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      setResetSuccess(`Password for ${resetUser.email} has been updated successfully!`);
      setTimeout(() => {
        setResetUser(null);
        setNewPassword('');
        setResetSuccess('');
      }, 1500);
    } catch (err: any) {
      setResetError(err.message || 'Failed to update password');
    } finally {
      setResetSubmitting(false);
    }
  };

  const copyCredentials = () => {
    if (!createdCredentials) return;
    const text = `SmartShelf AI Staff Login Credentials:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Staff Management</h3>
          <p className="text-xs text-muted-foreground">Manage store team members, roles, and access passwords.</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
              <DialogDescription>
                Create a new user account for your store. If you leave the password blank, the default initial password <strong>password123</strong> will be assigned.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address *</FormLabel>
                      <FormControl>
                        <Input placeholder="staff@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Initial Password</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Leave blank for default: password123"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Default if left empty: <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-medium">password123</code>
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="STAFF">Staff (Cashier / Inventory)</SelectItem>
                          <SelectItem value="ADMIN">Admin (Full Store Management)</SelectItem>
                          <SelectItem value="OWNER">Owner (Store Owner)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                )}

                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Creating User...' : 'Create Staff Member'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border bg-background overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6">Loading team members...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-6">No staff found.</TableCell></TableRow>
            ) : (
              users.map(u => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Select defaultValue={u.role} onValueChange={(val) => updateRole(u.id, val)}>
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="STAFF">STAFF</SelectItem>
                        <SelectItem value="ADMIN">ADMIN</SelectItem>
                        <SelectItem value="OWNER">OWNER</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => {
                        setResetUser(u);
                        setNewPassword('');
                        setResetError('');
                        setResetSuccess('');
                      }}
                    >
                      <KeyRound className="h-3.5 w-3.5" />
                      Set Password
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteUser(u.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog: Staff Credentials Created Notification */}
      <Dialog open={Boolean(createdCredentials)} onOpenChange={(openState) => { if (!openState) setCreatedCredentials(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="h-5 w-5" /> Staff Account Created
            </DialogTitle>
            <DialogDescription>
              Please share these login credentials with the staff member so they can access the application.
            </DialogDescription>
          </DialogHeader>

          {createdCredentials && (
            <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Full Name:</span>
                <span className="font-medium">{createdCredentials.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Email / Login ID:</span>
                <span className="font-mono font-medium">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-muted-foreground">Password:</span>
                <span className="font-mono font-bold bg-background px-2 py-0.5 rounded border text-indigo-600 dark:text-indigo-400">
                  {createdCredentials.password}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={copyCredentials} className="gap-1.5">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Copied!' : 'Copy Credentials'}
            </Button>
            <Button onClick={() => setCreatedCredentials(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Reset / Set Staff Password */}
      <Dialog open={Boolean(resetUser)} onOpenChange={(openState) => { if (!openState) setResetUser(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-indigo-500" />
              Reset Staff Password
            </DialogTitle>
            <DialogDescription>
              Set a new login password for <strong>{resetUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">New Password (min 6 characters)</label>
              <Input
                type="text"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            {resetError && <p className="text-xs text-destructive">{resetError}</p>}
            {resetSuccess && <p className="text-xs text-emerald-600 font-medium">{resetSuccess}</p>}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setResetUser(null)} disabled={resetSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleResetPassword} disabled={resetSubmitting || !newPassword.trim()}>
              {resetSubmitting ? 'Saving...' : 'Save Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
