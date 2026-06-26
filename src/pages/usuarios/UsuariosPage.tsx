import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import api from '../../services/api';
import type { User, PageResponse } from '../../types';
import { label } from '../../utils/format';
import '../list.css';

export function UsuariosPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

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
          <button className="btn-sm" onClick={() => navigate(`/usuarios/${u.id}/editar`)}>Editar</button>
          <button className="btn-sm" onClick={() => toggleActive(u)}>{u.active ? 'Desativar' : 'Ativar'}</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Usuários" subtitle="Controle de acesso ao sistema"
        action={{ label: 'Novo Usuário', onClick: () => navigate('/usuarios/novo') }} />

      <div className="list-toolbar">
        <input className="list-search" placeholder="Buscar por nome, login ou e-mail..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <DataTable columns={columns} data={users} emptyMessage="Nenhum usuário encontrado." />
      )}
    </div>
  );
}
