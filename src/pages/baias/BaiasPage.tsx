import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { ButtonGroup } from '../../components/common/InputField';
import api from '../../services/api';
import type { Baia, PageResponse } from '../../types';
import { label } from '../../utils/format';
import '../list.css';

const STATUS_OPTS = [
  { value: 'LIVRE', label: 'Livre' },
  { value: 'OCUPADA', label: 'Ocupada' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
];
const STATUS_FILTER_OPTS = [{ value: '', label: 'Todas' }, ...STATUS_OPTS];
const statusVariant: Record<string, BadgeVariant> = { LIVRE: 'success', OCUPADA: 'info', MANUTENCAO: 'warning' };

export function BaiasPage() {
  const isAdmin = localStorage.getItem('rancho_role') === 'ADMIN';
  const navigate = useNavigate();
  const [baias, setBaias] = useState<Baia[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Baia>>('/baias', {
        params: { status: statusFilter || undefined, size: 100 },
      });
      setBaias(res.data.content);
    } finally {
      setLoading(false);
    }
  }

  async function remove(b: Baia) {
    if (!window.confirm(`Excluir a baia "${b.identificacao}"?`)) return;
    try {
      await api.delete(`/baias/${b.id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erro ao excluir baia.');
    }
  }

  const columns: Column<Baia>[] = [
    { key: 'identificacao', label: 'Identificação', render: (b) => <strong>{b.identificacao}</strong> },
    { key: 'localizacao', label: 'Localização', render: (b) => b.localizacao || '-' },
    { key: 'capacidade', label: 'Capacidade' },
    { key: 'animalAtual', label: 'Ocupante', render: (b) => b.animalAtual || '-' },
    { key: 'status', label: 'Status', render: (b) => <Badge label={label(b.status)} variant={statusVariant[b.status]} /> },
    {
      key: 'actions', label: 'Ações',
      render: (b) => (
        <div className="row-actions">
          <button className="btn-sm" onClick={() => navigate(`/baias/${b.id}/editar`)}>Editar</button>
          {isAdmin && <button className="btn-sm btn-sm--danger" onClick={() => remove(b)}>Excluir</button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Baias" subtitle={`${baias.length} baias`}
        action={{ label: 'Nova Baia', onClick: () => navigate('/baias/novo') }} />

      <div className="list-toolbar">
        <ButtonGroup value={statusFilter} options={STATUS_FILTER_OPTS}
          onChange={(v) => setStatusFilter(v)} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <DataTable columns={columns} data={baias} emptyMessage="Nenhuma baia cadastrada." />
      )}
    </div>
  );
}
