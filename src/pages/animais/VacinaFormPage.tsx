import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField, TextareaField } from '../../components/common/InputField';
import api from '../../services/api';
import { required, fieldErrorsFromApi } from '../../utils/validators';
import './AnimalDetailPage.css';

const TODAY = new Date().toISOString().slice(0, 10);
type VacinaErrors = Partial<Record<'nome' | 'dataAplicacao' | 'dataVencimento', string>>;

export function VacinaFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nome: '', dataAplicacao: '', dataVencimento: '', observacao: '' });
  const [errors, setErrors] = useState<VacinaErrors>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const e: VacinaErrors = {
      nome: required(form.nome, 'Nome'),
      dataAplicacao: required(form.dataAplicacao, 'Data de aplicação')
        ?? (form.dataAplicacao > TODAY ? 'Data de aplicação não pode ser futura.' : undefined),
      dataVencimento: form.dataVencimento && form.dataAplicacao && form.dataVencimento < form.dataAplicacao
        ? 'Vencimento deve ser após a aplicação.' : undefined,
    };
    Object.keys(e).forEach((k) => e[k as keyof VacinaErrors] === undefined && delete e[k as keyof VacinaErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/vacinas', {
        animalId: Number(id),
        nome: form.nome,
        dataAplicacao: form.dataAplicacao,
        dataVencimento: form.dataVencimento || null,
        observacao: form.observacao || null,
      });
      navigate(`/animais/${id}`);
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao registrar vacina.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title="Registrar Vacina" subtitle="Nova vacina do animal" />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <InputField label="Nome da vacina *" value={form.nome} error={errors.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <FormRow>
          <InputField label="Data de aplicação *" type="date" value={form.dataAplicacao} max={TODAY} error={errors.dataAplicacao}
            onChange={(e) => setForm({ ...form, dataAplicacao: e.target.value })} />
          <InputField label="Data de vencimento" type="date" value={form.dataVencimento} error={errors.dataVencimento}
            onChange={(e) => setForm({ ...form, dataVencimento: e.target.value })} />
        </FormRow>
        <TextareaField label="Observação" value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
      </FormCard>
    </div>
  );
}
