'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable/DataTable';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { api } from '@/lib/api';
import type { AdminUser, PaginatedApiResponse, UserRole } from '@/types';
import styles from '../adminRoute.module.css';

export function AdminUsersView() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get<PaginatedApiResponse<AdminUser>>('/users', {
        page,
        limit: 20,
        search: search || undefined,
        role: role || undefined,
        isActive: activeFilter || undefined,
      });
      setUsers(response.data);
      setPages(response.pagination.pages || 1);
      setTotal(response.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load users');
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter, page, role, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const updateUser = async (userId: string, payload: { role?: UserRole; isActive?: boolean }) => {
    const response = await api.patch<{ success: boolean; data: { user: AdminUser } }>(`/users/${userId}`, payload);
    setUsers((current) => current.map((user) => (user._id === userId ? response.data.user : user)));
  };

  const columns = useMemo<Array<DataTableColumn<AdminUser>>>(() => [
    {
      key: 'name',
      header: 'Name',
      render: (user) => (
        <span className={styles.truncate}>
          <strong>{user.name}</strong>
          <br />
          {user.email}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <select
          className={styles.compactSelect}
          value={user.role}
          onChange={(event) => void updateUser(user._id, { role: event.target.value as UserRole })}
          aria-label={`Role for ${user.name}`}
        >
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      ),
    },
    {
      key: 'reports',
      header: 'Reports',
      render: (user) => user.reportsCount,
    },
    {
      key: 'reputation',
      header: 'Reputation',
      render: (user) => user.reputation,
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user) => new Date(user.createdAt).toLocaleDateString('en-PK'),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <div className={styles.statusActions}>
          <Badge tone={user.isActive ? 'success' : 'danger'}>{user.isActive ? 'Active' : 'Inactive'}</Badge>
          <Button
            className={styles.compactButton}
            variant="secondary"
            onClick={() => void updateUser(user._id, { isActive: !user.isActive })}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ], []);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Access control</span>
          <h1>Users</h1>
          <p>Search residents, review activity, and manage account roles or access.</p>
        </div>
      </div>

      <div className={styles.filters}>
        <Input label="Search" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} />
        <Select label="Role" value={role} onChange={(event) => { setPage(1); setRole(event.target.value); }}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </Select>
        <Select label="Status" value={activeFilter} onChange={(event) => { setPage(1); setActiveFilter(event.target.value); }}>
          <option value="">All statuses</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </Select>
        <Button variant="secondary" onClick={() => { setSearch(''); setRole(''); setActiveFilter(''); setPage(1); }}>
          Clear filters
        </Button>
      </div>

      {error && <div className={styles.error} role="alert">{error}</div>}

      <div className={styles.tableHeader}>
        <p>Showing {users.length} of {total} users</p>
        <div className={styles.actions}>
          <Button variant="secondary" disabled={page <= 1 || isLoading} onClick={() => setPage((current) => current - 1)}>Previous</Button>
          <span>Page {page} of {pages}</span>
          <Button variant="secondary" disabled={page >= pages || isLoading} onClick={() => setPage((current) => current + 1)}>Next</Button>
        </div>
      </div>

      <DataTable columns={columns} rows={users} getRowKey={(user) => user._id} isLoading={isLoading} emptyMessage="No users match these filters" minWidth="860px" />
    </section>
  );
}
