import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { InputField, SelectField } from '../../components/common/InputField';
import { FormRow } from '../../components/common/FormCard';
import api from '../../services/api';
import type { User, PageResponse } from '../../types';
import { label } from '../../utils/format';
import { required, validateEmail, fieldErrorsFromApi } from '../../utils/validators';
import '../list.css';

type UserErrors = Partial<Record<'name' | 'email' | 'login' | 'password', string>>;

const ROLE_OPTS = [
  { value: 'OPERADOR', label: 'Operador' },
  { value: 'ADMIN', label: 'Administrador' },
];

export function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', login: '', password: '', role: 'OPERADOR', active: true });
  const [errors, setErrors] = useState<UserErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<User>>('/users', {
        params: { search: search || undefined, size: 50 },
      });
      setUsers(res.data.content);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ name: '', email: '', login: '', password: '', role: 'OPERADOR', active: true });
    setErrors({});
    setModalOpen(true);
  }
  function openEdit(u: User) {
    setEditingId(u.id);
    setForm({ name: u.name, email: u.email, login: u.login, password: '', role: u.role, active: u.active });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: UserErrors = {
      name: required(form.name, 'Nome'),
      email: validateEmail(form.email, { requiredMsg: 'E-mail e obrigatorio.' }),
    };
    if (!editingId) {
      e.login = required(form.login, 'Login') ?? (form.login.length < 3 ? 'Login deve ter no minimo 3 caracteres.' : undefined);
      e.password = required(form.password, 'Senha') ?? (form.password.length < 6 ? 'Senha deve ter no minimo 6 caracteres.' : undefined);
    }
    Object.keys(e).forEach((k) => e[k as keyof UserErrors] === undefined && delete e[k as keyof UserErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/users/${editingId}`, { name: form.name, email: form.email, role: form.role, active: form.active });
      } else {
        await api.post('/users', { name: form.name, email: form.email, login: form.login, password: form.password, role: form.role });
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar usuário.');
    } finally { setSaving(false); }
  }

  async function toggleActive(u: User) {
    await api.put(`/users/${u.id}`, { active: !u.active });
    load();
  }

  const columns: Column<User>[] = [
    { key: 'name', label: 'Nome', render: (u) => <strong>{u.name}</strong> },
    { key: 'login', label: 'Login' },
    { key: 'email', label: 'E-mail' },
    { key: 'role', label: 'Perfil', render: (u) => <Badge label={label(u.role)} variant={u.role === 'ADMIN' ? 'info' : 'neutral'} /> },
    { key: 'active', label: 'Status', render: (u) => <Badge label={u.active ? 'Ativo' : 'Inativo'} variant={u.active ? 'success' : 'error'} /> },
    {
      key: 'actions', label: 'Ações',
      render: (u) => (
        <div className="row-actions">
          <button className="btn-sm" onClick={() => openEdit(u)}>Editar</button>
          <button className="btn-sm" onClick={() => toggleActive(u)}>{u.active ? 'Desativar' : 'Ativar'}</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Usuários" subtitle="Controle de acesso ao sistema"
        action={{ label: 'Novo Usuário', onClick: openCreate }} />

      <div className="list-toolbar">
        <input className="list-search" placeholder="Buscar por nome, login ou e-mail..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <DataTable columns={columns} data={users} emptyMessage="Nenhum usuário encontrado." />
      )}

      <Modal open={modalOpen} title={editingId ? 'Editar Usuário' : 'Novo Usuário'} onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }>
        <InputField label="Nome completo *" value={form.name} error={errors.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <FormRow>
          <InputField label="E-mail *" type="email" value={form.email} error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <InputField label="Login *" value={form.login} disabled={!!editingId} error={errors.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })} />
        </FormRow>
        <FormRow>
          {!editingId && (
            <InputField label="Senha *" type="password" value={form.password} error={errors.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
          )}
          <SelectField label="Perfil" value={form.role} options={ROLE_OPTS} placeholder="Selecione..."
            onChange={(e) => setForm({ ...form, role: e.target.value })} />
        </FormRow>
      </Modal>
    </div>
  );
}
