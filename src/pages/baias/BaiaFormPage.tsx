import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField, TextareaField, ButtonGroupField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Baia } from '../../types';
import { required, fieldErrorsFromApi } from '../../utils/validators';
import '../animais/AnimalDetailPage.css';

type BaiaErrors = Partial<Record<'identificacao' | 'capacidade', string>>;
const STATUS_OPTS = [
  { value: 'LIVRE', label: 'Livre' },
  { value: 'OCUPADA', label: 'Ocupada' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
];
const EMPTY = { identificacao: '', localizacao: '', capacidade: '1', status: 'LIVRE', observacao: '' };

export function BaiaFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<BaiaErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get<Baia>(`/baias/${id}`)
      .then((res) => {
        const b = res.data;
        setForm({
          identificacao: b.identificacao,
          localizacao: b.localizacao ?? '',
          capacidade: String(b.capacidade),
          status: b.status,
          observacao: b.observacao ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function validate(): boolean {
    const e: BaiaErrors = {
      identificacao: required(form.identificacao, 'Identificação'),
      capacidade: Number(form.capacidade) >= 1 ? undefined : 'Capacidade mínima é 1.',
    };
    Object.keys(e).forEach((k) => e[k as keyof BaiaErrors] === undefined && delete e[k as keyof BaiaErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, capacidade: Number(form.capacidade) };
      if (isEdit) await api.put(`/baias/${id}`, payload);
      else await api.post('/baias', payload);
      navigate('/baias');
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar baia.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title={isEdit ? 'Editar Baia' : 'Nova Baia'}
        subtitle={isEdit ? form.identificacao : 'Cadastro de nova baia'} />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <FormRow>
          <InputField label="Identificação *" value={form.identificacao} error={errors.identificacao}
            onChange={(e) => setForm({ ...form, identificacao: e.target.value })} />
          <InputField label="Capacidade" type="number" min={1} value={form.capacidade} error={errors.capacidade}
            onChange={(e) => setForm({ ...form, capacidade: e.target.value })} />
        </FormRow>
        <InputField label="Localização" value={form.localizacao}
          onChange={(e) => setForm({ ...form, localizacao: e.target.value })} />
        <ButtonGroupField label="Status" value={form.status} options={STATUS_OPTS}
          onChange={(v) => setForm({ ...form, status: v })} />
        <TextareaField label="Observação" value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
      </FormCard>
    </div>
  );
}
