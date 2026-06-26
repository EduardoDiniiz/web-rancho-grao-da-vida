import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { ButtonGroup } from '../../components/common/InputField';
import api from '../../services/api';
import type { Hospedagem, PageResponse } from '../../types';
import { formatDate, label } from '../../utils/format';
import '../list.css';

const STATUS_FILTER_OPTS = [
  { value: '', label: 'Todas' },
  { value: 'ATIVO', label: 'Ativas' },
  { value: 'ENCERRADO', label: 'Encerradas' },
];

export function HospedagensPage() {
  const navigate = useNavigate();
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ATIVO');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Hospedagem>>('/hospedagens', {
        params: { status: statusFilter || undefined, page, size: 15 },
      });
      setHospedagens(res.data.content);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  }

  async function registrarSaida(h: Hospedagem) {
    if (!window.confirm(`Registrar saída de "${h.animalNome}" da baia ${h.baiaIdentificacao}?`)) return;
    await api.patch(`/hospedagens/${h.id}/saida`, {});
    load();
  }

  const columns: Column<Hospedagem>[] = [
    { key: 'animalNome', label: 'Animal', render: (h) => <strong>{h.animalNome}</strong> },
    { key: 'clienteNome', label: 'Cliente' },
    { key: 'baiaIdentificacao', label: 'Baia' },
    { key: 'dataEntrada', label: 'Entrada', render: (h) => formatDate(h.dataEntrada) },
    { key: 'dataSaida', label: 'Saída', render: (h) => formatDate(h.dataSaida) },
    {
      key: 'status', label: 'Status',
      render: (h) => <Badge label={label(h.status)} variant={h.status === 'ATIVO' ? 'success' : 'neutral'} />,
    },
    {
      key: 'actions', label: 'Ações',
      render: (h) => h.status === 'ATIVO'
        ? <button className="btn-sm btn-sm--danger" onClick={() => registrarSaida(h)}>Registrar Saída</button>
        : <span>-</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Hospedagens" subtitle="Controle de ocupação das baias"
        action={{ label: 'Registrar Entrada', onClick: () => navigate('/hospedagens/nova') }} />

      <div className="list-toolbar">
        <ButtonGroup value={statusFilter} options={STATUS_FILTER_OPTS}
          onChange={(v) => { setStatusFilter(v); setPage(0); }} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <>
          <DataTable columns={columns} data={hospedagens} emptyMessage="Nenhuma hospedagem encontrada." />
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
