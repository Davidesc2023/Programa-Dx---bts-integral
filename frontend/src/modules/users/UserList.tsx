'use client';

import { useState } from 'react';
import { UserPlus, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useUserList, useCreateUser, useUpdateUser, useDeleteUser } from './useUsers';
import { ROLE_LABELS, UserRole } from '@/types/enums';
import type { User } from '@/types/api.types';
import type { CreateUserPayload, UpdateUserPayload } from '@/services/users.service';

// ─── Role badge ───────────────────────────────────────────────────────────────

const ROLE_BADGE: Record<UserRole, string> = {
  [UserRole.ADMIN]: 'bg-purple-100 text-purple-700',
  [UserRole.OPERADOR]: 'bg-blue-100 text-blue-700',
  [UserRole.LABORATORIO]: 'bg-emerald-100 text-emerald-700',
  [UserRole.MEDICO]: 'bg-amber-100 text-amber-700',
  [UserRole.PACIENTE]: 'bg-teal-100 text-teal-700',
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_BADGE[role] ?? 'bg-gray-100 text-gray-600'}`}
    >
      {ROLE_LABELS[role] ?? role}
    </span>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────

interface CreateFormProps {
  onClose: () => void;
}

function CreateUserForm({ onClose }: CreateFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.OPERADOR);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [medicalLicense, setMedicalLicense] = useState('');

  const mutation = useCreateUser(onClose);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: CreateUserPayload = {
      email, password, role,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
      ...(role === UserRole.MEDICO && specialty && { specialty }),
      ...(role === UserRole.MEDICO && medicalLicense && { medicalLicense }),
    };
    mutation.mutate(payload);
  }

  const isMedico = role === UserRole.MEDICO;

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ej. Carlos"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ej. Martínez"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="usuario@ejemplo.com"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Mínimo 8 caracteres"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ej. 3001234567"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      {isMedico && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ej. Neurología"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registro médico</label>
            <input
              type="text"
              value={medicalLicense}
              onChange={(e) => setMedicalLicense(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ej. RM-12345"
            />
          </div>
        </div>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? 'Creando…' : 'Crear usuario'}
        </Button>
      </div>
    </form>
  );
}

// ─── Edit form ────────────────────────────────────────────────────────────────

interface EditFormProps {
  user: User;
  onClose: () => void;
}

function EditUserForm({ user, onClose }: EditFormProps) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(user.firstName ?? '');
  const [lastName, setLastName] = useState(user.lastName ?? '');
  const [phone, setPhone] = useState(user.phone ?? '');
  const [specialty, setSpecialty] = useState(user.specialty ?? '');
  const [medicalLicense, setMedicalLicense] = useState(user.medicalLicense ?? '');
  const [patientId, setPatientId] = useState(user.patientId ?? '');

  const mutation = useUpdateUser(user.id, onClose);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: UpdateUserPayload = {
      role,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      specialty: role === UserRole.MEDICO ? (specialty || undefined) : undefined,
      medicalLicense: role === UserRole.MEDICO ? (medicalLicense || undefined) : undefined,
    };
    if (password) payload.password = password;
    if (role === UserRole.PACIENTE) {
      payload.patientId = patientId || null;
    }
    mutation.mutate(payload);
  }

  const isMedico = role === UserRole.MEDICO;
  const isPaciente = role === UserRole.PACIENTE;

  return (
    <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
      <p className="text-xs text-gray-500">
        Editando: <span className="font-medium text-gray-700">{user.email}</span>
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ej. Carlos"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ej. Martínez"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Ej. 3001234567"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Object.values(UserRole).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
      </div>
      {isMedico && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ej. Neurología"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registro médico</label>
            <input
              type="text"
              value={medicalLicense}
              onChange={(e) => setMedicalLicense(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Ej. RM-12345"
            />
          </div>
        </div>
      )}
      {isPaciente && (
        <div className="border-t pt-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID del paciente vinculado{' '}
            <span className="text-xs font-normal text-gray-400">(UUID — dejar vacío para desvincular)</span>
          </label>
          <input
            type="text"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nueva contraseña{' '}
          <span className="text-xs font-normal text-gray-400">(dejar vacío para no cambiar)</span>
        </label>
        <input
          type="password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Mínimo 8 caracteres"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function UserList() {
  const { users, isLoading, isError, page, setPage, totalPages, total } = useUserList();

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteMutation = useDeleteUser(() => setDeleteId(null));

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  }

  return (
    <>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus size={15} className="mr-1.5" />
            Nuevo usuario
          </Button>
        </div>

        {/* Table */}
        <Card padding="none">
          {isLoading ? (
            <div className="p-4">
              <TableSkeleton rows={8} cols={4} />
            </div>
          ) : isError ? (
            <p className="text-sm text-red-500 px-6 py-8 text-center">
              Error al cargar los usuarios.
            </p>
          ) : users.length === 0 ? (
            <p className="text-sm text-gray-400 px-6 py-10 text-center">
              No hay usuarios registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Nombre', 'Correo electrónico', 'Rol', 'Creado', 'Acciones'].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3 text-gray-900">
                        {u.firstName || u.lastName
                          ? `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim()
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-900">{u.email}</td>
                      <td className="px-5 py-3">
                        <RoleBadge role={u.role} />
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            className="p-1.5 rounded hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                            title="Editar"
                            onClick={() => setEditUser(u)}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                            onClick={() => setDeleteId(u.id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50">
              <span className="text-xs text-gray-500">
                {total} usuario{total !== 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs text-gray-600">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Nuevo usuario" size="sm">
        <CreateUserForm onClose={() => setCreateOpen(false)} />
      </Modal>

      {/* Edit modal */}
      <Modal
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title="Editar usuario"
        size="sm"
      >
        {editUser && <EditUserForm user={editUser} onClose={() => setEditUser(null)} />}
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Eliminar usuario"
        message="Esta acción eliminará el usuario permanentemente. ¿Deseas continuar?"
        confirmLabel="Eliminar"
        loading={deleteMutation.isPending}
      />
    </>
  );
}
