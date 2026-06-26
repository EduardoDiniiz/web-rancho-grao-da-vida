import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { ButtonGroup } from '../../components/common/InputField';
import api from '../../services/api';
import type { Pagamento, PageResponse } from '../../types';
import { formatCurrency, formatDate, label } from '../../utils/format';
import '../list.css';

const STATUS_FILTER_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'PENDENTE', label: 'Pendentes' },
  { value: 'ATRASADO', label: 'Atrasados' },
  { value: 'PAGO', label: 'Pagos' },
  { value: 'CANCELADO', label: 'Cancelados' },
];

const statusVariant: Record<string, BadgeVariant> = {
  PENDENTE: 'warning', PAGO: 'success', ATRASADO: 'error', CANCELADO: 'neutral',
};

export function FinanceiroPage() {
  const navigate = useNavigate();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [page, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Pagamento>>('/pagamentos', {
        params: { status: statusFilter || undefined, page, size: 15 },
      });
      setPagamentos(res.data.content);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  }

  async function estornar(p: Pagamento) {
    if (!window.confirm('Estornar este pagamento?')) return;
    await api.patch(`/pagamentos/${p.id}/estorno`);
    load();
  }

  async function cancelar(p: Pagamento) {
    if (!window.confirm('Cancelar esta cobrança?')) return;
    await api.patch(`/pagamentos/${p.id}/cancelar`);
    load();
  }

  const columns: Column<Pagamento>[] = [
    {
      key: 'descricao', label: 'Cobrança',
      render: (p) => (
        <div>
          <strong>{p.servicoNome ?? p.descricao}</strong>
          {p.animalNome && <div className="detail__muted" style={{ fontSize: 12 }}>{p.animalNome} · {p.clienteNome}</div>}
        </div>
      ),
    },
    { key: 'valor', label: 'Valor', render: (p) => formatCurrency(p.valor) },
    { key: 'vencimento', label: 'Vencimento', render: (p) => formatDate(p.vencimento) },
    { key: 'dataPagamento', label: 'Pagamento', render: (p) => formatDate(p.dataPagamento) },
    { key: 'status', label: 'Status', render: (p) => <Badge label={label(p.status)} variant={statusVariant[p.status]} /> },
    {
      key: 'actions', label: 'Ações',
      render: (p) => (
        <div className="row-actions">
          {(p.status === 'PENDENTE' || p.status === 'ATRASADO') && (
            <>
              <button className="btn-sm btn-sm--primary" onClick={() => navigate(`/financeiro/${p.id}/baixa`, { state: { pagamento: p } })}>Baixa</button>
              <button className="btn-sm" onClick={() => cancelar(p)}>Cancelar</button>
            </>
          )}
          {p.status === 'PAGO' && <button className="btn-sm btn-sm--danger" onClick={() => estornar(p)}>Estornar</button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Financeiro" subtitle="Cobranças e pagamentos"
        action={{ label: 'Cobrança Avulsa', onClick: () => navigate('/financeiro/avulsa') }} />

      <div className="list-toolbar">
        <ButtonGroup value={statusFilter} options={STATUS_FILTER_OPTS}
          onChange={(v) => { setStatusFilter(v); setPage(0); }} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <>
          <DataTable columns={columns} data={pagamentos} emptyMessage="Nenhuma cobrança encontrada." />
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
