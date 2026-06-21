import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { InputField, SelectField } from '../../components/common/InputField';
import { FormRow } from '../../components/common/FormCard';
import api from '../../services/api';
import type { Animal, Pagamento, PageResponse } from '../../types';
import { formatCurrency, formatDate, label } from '../../utils/format';
import { required, validatePositiveNumber, fieldErrorsFromApi } from '../../utils/validators';
import '../list.css';

type AvulsaErrors = Partial<Record<'descricao' | 'valor' | 'vencimento', string>>;

const statusVariant: Record<string, BadgeVariant> = {
  PENDENTE: 'warning', PAGO: 'success', ATRASADO: 'error', CANCELADO: 'neutral',
};
const FORMA_OPTS = [
  { value: 'DINHEIRO', label: 'Dinheiro' }, { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' }, { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'TRANSFERENCIA', label: 'Transferência' }, { value: 'BOLETO', label: 'Boleto' },
  { value: 'OUTRO', label: 'Outro' },
];

export function FinanceiroPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [baixaTarget, setBaixaTarget] = useState<Pagamento | null>(null);
  const [forma, setForma] = useState('PIX');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));

  const [avulsaModal, setAvulsaModal] = useState(false);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [avulsa, setAvulsa] = useState({ animalId: '', descricao: '', valor: '', vencimento: new Date().toISOString().slice(0, 10) });
  const [avulsaErrors, setAvulsaErrors] = useState<AvulsaErrors>({});
  const [saving, setSaving] = useState(false);

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

  async function confirmarBaixa() {
    if (!baixaTarget) return;
    setSaving(true);
    try {
      await api.patch(`/pagamentos/${baixaTarget.id}/baixa`, { dataPagamento, formaPagamento: forma });
      setBaixaTarget(null);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erro ao registrar pagamento.');
    } finally { setSaving(false); }
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

  async function openAvulsa() {
    const a = await api.get<PageResponse<Animal>>('/animais', { params: { status: 'ATIVO', size: 200 } });
    setAnimais(a.data.content);
    setAvulsa({ animalId: '', descricao: '', valor: '', vencimento: new Date().toISOString().slice(0, 10) });
    setAvulsaErrors({});
    setAvulsaModal(true);
  }

  function validateAvulsa(): boolean {
    const e: AvulsaErrors = {
      descricao: required(avulsa.descricao, 'Descrição'),
      valor: validatePositiveNumber(avulsa.valor, 'Valor'),
      vencimento: required(avulsa.vencimento, 'Vencimento'),
    };
    Object.keys(e).forEach((k) => e[k as keyof AvulsaErrors] === undefined && delete e[k as keyof AvulsaErrors]);
    setAvulsaErrors(e);
    return Object.keys(e).length === 0;
  }

  async function salvarAvulsa() {
    if (!validateAvulsa()) return;
    setSaving(true);
    try {
      await api.post('/pagamentos/avulsa', {
        animalId: avulsa.animalId ? Number(avulsa.animalId) : null,
        descricao: avulsa.descricao, valor: Number(avulsa.valor), vencimento: avulsa.vencimento,
      });
      setAvulsaModal(false);
      load();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setAvulsaErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao criar cobrança.');
    } finally { setSaving(false); }
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
              <button className="btn-sm btn-sm--primary" onClick={() => { setBaixaTarget(p); setForma('PIX'); setDataPagamento(new Date().toISOString().slice(0, 10)); }}>Baixa</button>
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
        action={{ label: 'Cobrança Avulsa', onClick: openAvulsa }} />

      <div className="list-toolbar">
        <select className="list-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}>
          <option value="">Todos os status</option>
          <option value="PENDENTE">Pendentes</option>
          <option value="ATRASADO">Atrasados</option>
          <option value="PAGO">Pagos</option>
          <option value="CANCELADO">Cancelados</option>
        </select>
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

      {/* Baixa de pagamento */}
      <Modal open={!!baixaTarget} title="Registrar Pagamento" onClose={() => setBaixaTarget(null)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setBaixaTarget(null)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={confirmarBaixa} disabled={saving}>
              {saving ? 'Salvando...' : 'Confirmar'}
            </button>
          </>
        }>
        {baixaTarget && (
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {baixaTarget.servicoNome ?? baixaTarget.descricao} — <strong>{formatCurrency(baixaTarget.valor)}</strong>
          </p>
        )}
        <FormRow>
          <InputField label="Data do pagamento" type="date" value={dataPagamento}
            onChange={(e) => setDataPagamento(e.target.value)} />
          <SelectField label="Forma de pagamento *" value={forma} options={FORMA_OPTS} placeholder="Selecione..."
            onChange={(e) => setForma(e.target.value)} />
        </FormRow>
      </Modal>

      {/* Cobrança avulsa */}
      <Modal open={avulsaModal} title="Cobrança Avulsa" onClose={() => setAvulsaModal(false)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setAvulsaModal(false)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={salvarAvulsa} disabled={saving}>
              {saving ? 'Salvando...' : 'Criar'}
            </button>
          </>
        }>
        <SelectField label="Animal (opcional)" value={avulsa.animalId}
          onChange={(e) => setAvulsa({ ...avulsa, animalId: e.target.value })}
          options={animais.map((a) => ({ value: String(a.id), label: `${a.nome} (${a.clienteNome})` }))} />
        <InputField label="Descrição *" value={avulsa.descricao} error={avulsaErrors.descricao}
          onChange={(e) => setAvulsa({ ...avulsa, descricao: e.target.value })} />
        <FormRow>
          <InputField label="Valor (R$) *" type="number" step="0.01" min={0} value={avulsa.valor} error={avulsaErrors.valor}
            onChange={(e) => setAvulsa({ ...avulsa, valor: e.target.value })} />
          <InputField label="Vencimento *" type="date" value={avulsa.vencimento} error={avulsaErrors.vencimento}
            onChange={(e) => setAvulsa({ ...avulsa, vencimento: e.target.value })} />
        </FormRow>
      </Modal>
    </div>
  );
}
