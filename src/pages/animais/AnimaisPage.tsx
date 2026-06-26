import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { ButtonGroup } from '../../components/common/InputField';
import api from '../../services/api';
import type { Animal, PageResponse } from '../../types';
import { label } from '../../utils/format';
import '../list.css';

const STATUS_FILTER_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'ATIVO', label: 'Ativos' },
  { value: 'ARQUIVADO', label: 'Arquivados' },
];

export function AnimaisPage() {
  const navigate = useNavigate();
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ATIVO');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page, search, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Animal>>('/animais', {
        params: { page, search: search || undefined, status: statusFilter || undefined, size: 15 },
      });
      setAnimais(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } finally {
      setLoading(false);
    }
  }

  const columns: Column<Animal>[] = [
    { key: 'nome', label: 'Nome', render: (a) => <strong>{a.nome}</strong> },
    { key: 'clienteNome', label: 'Proprietário' },
    { key: 'esporte', label: 'Esporte', render: (a) => label(a.esporte) },
    { key: 'sexo', label: 'Sexo', render: (a) => label(a.sexo) },
    {
      key: 'status', label: 'Status',
      render: (a) => <Badge label={label(a.status)} variant={a.status === 'ATIVO' ? 'success' : 'neutral'} />,
    },
    {
      key: 'actions', label: 'Ações',
      render: (a) => (
        <div className="row-actions">
          <button className="btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/animais/${a.id}/editar`); }}>Editar</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Animais" subtitle={`${totalElements} registros`}
        action={{ label: 'Novo Animal', onClick: () => navigate('/animais/novo') }} />

      <div className="list-toolbar">
        <input className="list-search" placeholder="Buscar por nome ou registro..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <ButtonGroup value={statusFilter} options={STATUS_FILTER_OPTS}
          onChange={(v) => { setStatusFilter(v); setPage(0); }} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <>
          <DataTable columns={columns} data={animais}
            onRowClick={(a) => navigate(`/animais/${a.id}`)}
            emptyMessage="Nenhum animal encontrado." />
          {totalPages > 1 && (
            <div className="list-pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
              <span>Página {page + 1} de {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
