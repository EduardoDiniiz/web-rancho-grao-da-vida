import { useState } from 'react';
import { useNavigate, useParams, useLocation, Navigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField, SelectField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Pagamento } from '../../types';
import { formatCurrency } from '../../utils/format';
import '../animais/AnimalDetailPage.css';

const FORMA_OPTS = [
  { value: 'DINHEIRO', label: 'Dinheiro' }, { value: 'PIX', label: 'PIX' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' }, { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
  { value: 'TRANSFERENCIA', label: 'Transferência' }, { value: 'BOLETO', label: 'Boleto' },
  { value: 'OUTRO', label: 'Outro' },
];

export function BaixaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pagamento = (location.state as { pagamento?: Pagamento } | null)?.pagamento;

  const [forma, setForma] = useState('PIX');
  const [dataPagamento, setDataPagamento] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);

  // Sem o pagamento no state (ex: refresh direto na URL), volta para a lista.
  if (!pagamento) return <Navigate to="/financeiro" replace />;

  async function save() {
    setSaving(true);
    try {
      await api.patch(`/pagamentos/${id}/baixa`, { dataPagamento, formaPagamento: forma });
      navigate('/financeiro');
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erro ao registrar pagamento.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title="Registrar Pagamento" subtitle="Baixa de cobrança" />

      <FormCard onSubmit={save} loading={saving} submitLabel="Confirmar" onCancel={() => navigate(-1)}>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {pagamento.servicoNome ?? pagamento.descricao} — <strong>{formatCurrency(pagamento.valor)}</strong>
        </p>
        <FormRow>
          <InputField label="Data do pagamento" type="date" value={dataPagamento}
            onChange={(e) => setDataPagamento(e.target.value)} />
          <SelectField label="Forma de pagamento *" value={forma} options={FORMA_OPTS} placeholder="Selecione..."
            onChange={(e) => setForma(e.target.value)} />
        </FormRow>
      </FormCard>
    </div>
  );
}
