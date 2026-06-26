import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import api from '../../services/api';
import type { Servico, PageResponse } from '../../types';
import { formatCurrency } from '../../utils/format';
import '../list.css';

export function ServicosPage() {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Servico>>('/servicos', {
        params: { search: search || undefined, size: 100 },
      });
      setServicos(res.data.content);
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(s: Servico) {
    await api.patch(`/servicos/${s.id}/active`, null, { params: { active: !s.active } });
    load();
  }

  const columns: Column<Servico>[] = [
    { key: 'nome', label: 'Serviço', render: (s) => <strong>{s.nome}</strong> },
    { key: 'descricao', label: 'Descrição', render: (s) => s.descricao || '-' },
    { key: 'valorPadrao', label: 'Valor padrão', render: (s) => formatCurrency(s.valorPadrao) },
    { key: 'active', label: 'Status', render: (s) => <Badge label={s.active ? 'Ativo' : 'Inativo'} variant={s.active ? 'success' : 'neutral'} /> },
    {
      key: 'actions', label: 'Ações',
      render: (s) => (
        <div className="row-actions">
          <button className="btn-sm" onClick={() => navigate(`/servicos/${s.id}/editar`)}>Editar</button>
          <button className="btn-sm" onClick={() => toggleActive(s)}>{s.active ? 'Inativar' : 'Ativar'}</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Serviços" subtitle="Catálogo de serviços cobráveis"
        action={{ label: 'Novo Serviço', onClick: () => navigate('/servicos/novo') }} />

      <div className="list-toolbar">
        <input className="list-search" placeholder="Buscar serviço..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <DataTable columns={columns} data={servicos} emptyMessage="Nenhum serviço cadastrado." />
      )}
    </div>
  );
}
