import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard } from '../../components/common/FormCard';
import { InputField, TextareaField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Servico } from '../../types';
import { maskCurrency, currencyToMask, parseCurrency } from '../../utils/masks';
import { required, validatePositiveCurrency, fieldErrorsFromApi } from '../../utils/validators';
import '../animais/AnimalDetailPage.css';

type ServicoErrors = Partial<Record<'nome' | 'valorPadrao', string>>;
const EMPTY = { nome: '', descricao: '', valorPadrao: '' };

export function ServicoFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<ServicoErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get<Servico>(`/servicos/${id}`)
      .then((res) => {
        const s = res.data;
        setForm({ nome: s.nome, descricao: s.descricao ?? '', valorPadrao: currencyToMask(s.valorPadrao) });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function validate(): boolean {
    const e: ServicoErrors = {
      nome: required(form.nome, 'Nome'),
      valorPadrao: validatePositiveCurrency(form.valorPadrao, 'Valor'),
    };
    Object.keys(e).forEach((k) => e[k as keyof ServicoErrors] === undefined && delete e[k as keyof ServicoErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { nome: form.nome, descricao: form.descricao || null, valorPadrao: parseCurrency(form.valorPadrao) };
      if (isEdit) await api.put(`/servicos/${id}`, payload);
      else await api.post('/servicos', payload);
      navigate('/servicos');
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar serviço.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title={isEdit ? 'Editar Serviço' : 'Novo Serviço'}
        subtitle={isEdit ? form.nome : 'Cadastro de novo serviço'} />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <InputField label="Nome *" value={form.nome} error={errors.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <InputField label="Valor padrão (R$) *" inputMode="numeric" placeholder="0,00" value={form.valorPadrao} error={errors.valorPadrao}
          onChange={(e) => setForm({ ...form, valorPadrao: maskCurrency(e.target.value) })} />
        <TextareaField label="Descrição" value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </FormCard>
    </div>
  );
}
