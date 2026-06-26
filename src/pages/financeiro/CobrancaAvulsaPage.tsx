import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField, SelectField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Animal, PageResponse } from '../../types';
import { maskCurrency, parseCurrency } from '../../utils/masks';
import { required, validatePositiveCurrency, fieldErrorsFromApi } from '../../utils/validators';
import '../animais/AnimalDetailPage.css';

type AvulsaErrors = Partial<Record<'descricao' | 'valor' | 'vencimento', string>>;

export function CobrancaAvulsaPage() {
  const navigate = useNavigate();
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [form, setForm] = useState({ animalId: '', descricao: '', valor: '', vencimento: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState<AvulsaErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<PageResponse<Animal>>('/animais', { params: { status: 'ATIVO', size: 200 } })
      .then((a) => setAnimais(a.data.content))
      .finally(() => setLoading(false));
  }, []);

  function validate(): boolean {
    const e: AvulsaErrors = {
      descricao: required(form.descricao, 'Descrição'),
      valor: validatePositiveCurrency(form.valor, 'Valor'),
      vencimento: required(form.vencimento, 'Vencimento'),
    };
    Object.keys(e).forEach((k) => e[k as keyof AvulsaErrors] === undefined && delete e[k as keyof AvulsaErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/pagamentos/avulsa', {
        animalId: form.animalId ? Number(form.animalId) : null,
        descricao: form.descricao, valor: parseCurrency(form.valor), vencimento: form.vencimento,
      });
      navigate('/financeiro');
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao criar cobrança.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title="Cobrança Avulsa" subtitle="Nova cobrança" />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <SelectField label="Animal (opcional)" value={form.animalId}
          onChange={(e) => setForm({ ...form, animalId: e.target.value })}
          options={animais.map((a) => ({ value: String(a.id), label: `${a.nome} (${a.clienteNome})` }))} />
        <InputField label="Descrição *" value={form.descricao} error={errors.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
        <FormRow>
          <InputField label="Valor (R$) *" inputMode="numeric" placeholder="0,00" value={form.valor} error={errors.valor}
            onChange={(e) => setForm({ ...form, valor: maskCurrency(e.target.value) })} />
          <InputField label="Vencimento *" type="date" value={form.vencimento} error={errors.vencimento}
            onChange={(e) => setForm({ ...form, vencimento: e.target.value })} />
        </FormRow>
      </FormCard>
    </div>
  );
}
