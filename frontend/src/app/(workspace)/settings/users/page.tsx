'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { userService } from '@/services/userService';
import { PageHeader } from '@/components/ui/PageHeader';
import { Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/inputClass';
import { Select } from '@/components/ui/Select';
import type { Role } from '@/types';

export default function UserManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: userService.list });
  
  const [showAdd, setShowAdd] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('Rep');
  const [team, setTeam] = useState('');
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: () => userService.create({ firstName, lastName, email, password, role, team }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowAdd(false);
      setFirstName('');
      setLastName('');
      setEmail('');
      setPassword('');
      setRole('Rep');
      setTeam('');
      setError('');
    },
    onError: (err: any) => {
      setError(err.message || 'Failed to create user');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !password) return;
    createMutation.mutate();
  };

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
              D
            </span>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              DealFlow<span className="text-blue-600">360</span>
            </span>
          </span>
          <button onClick={() => router.back()} className="rounded-lg px-2 py-1 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900">
            ← Back
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <PageHeader title="Staff Management" subtitle="Create and manage internal staff accounts" />
          <Button variant="primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add Staff'}
          </Button>
        </div>

        {showAdd && (
          <div className="mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold text-slate-900">Create New Staff User</h2>
            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                First Name
                <input required type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Last Name
                <input required type="text" value={lastName} onChange={e => setLastName(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Email
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className={inputClass} />
              </label>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Temporary Password
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} />
              </label>
              <div className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Role
                <Select
                  ariaLabel="Role"
                  value={role}
                  onChange={(v) => setRole(v as Role)}
                  options={[
                    { value: 'Rep', label: 'Sales Rep' },
                    { value: 'SalesManager', label: 'Sales Manager' },
                    { value: 'FinanceOps', label: 'Finance Ops' },
                    { value: 'Admin', label: 'Administrator' },
                  ]}
                />
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
                Team (Optional)
                <input type="text" value={team} onChange={e => setTeam(e.target.value)} className={inputClass} placeholder="e.g. North America" />
              </label>
              <div className="sm:col-span-2 mt-2">
                <Button variant="primary" type="submit" disabled={createMutation.isPending}>
                  Create User
                </Button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <p className="text-slate-500">Loading staff...</p>
        ) : (
          <Table>
            <Thead>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Team</Th>
              <Th>Status</Th>
            </Thead>
            <Tbody>
              {users.map(u => (
                <Tr key={u.id}>
                  <Td className="font-medium text-slate-900">{u.firstName} {u.lastName}</Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <Badge tone={u.role === 'Admin' ? 'red' : u.role === 'FinanceOps' ? 'amber' : 'blue'}>
                      {u.role}
                    </Badge>
                  </Td>
                  <Td>{u.team || '—'}</Td>
                  <Td>
                    {u.isActive ? (
                      <Badge tone="green">Active</Badge>
                    ) : (
                      <Badge tone="neutral">Inactive</Badge>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
