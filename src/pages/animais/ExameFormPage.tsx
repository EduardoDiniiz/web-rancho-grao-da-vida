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
type ExameErrors = Partial<Record<'nome' | 'data', string>>;

export function ExameFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ nome: '', data: TODAY, resultado: '', veterinario: '', observacao: '' });
  const [errors, setErrors] = useState<ExameErrors>({});
  const [saving, setSaving] = useState(false);

  function validate(): boolean {
    const e: ExameErrors = {
      nome: required(form.nome, 'Nome'),
      data: required(form.data, 'Data')
        ?? (form.data > TODAY ? 'Data do exame não pode ser futura.' : undefined),
    };
    Object.keys(e).forEach((k) => e[k as keyof ExameErrors] === undefined && delete e[k as keyof ExameErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/exames', {
        animalId: Number(id),
        nome: form.nome,
        data: form.data,
        resultado: form.resultado || null,
        veterinario: form.veterinario || null,
        observacao: form.observacao || null,
      });
      navigate(`/animais/${id}`);
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao registrar exame.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title="Registrar Exame" subtitle="Novo exame do animal" />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <FormRow>
          <InputField label="Nome do exame *" value={form.nome} error={errors.nome}
            placeholder="Ex: Hemograma, Raio-X" onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <InputField label="Data *" type="date" value={form.data} max={TODAY} error={errors.data}
            onChange={(e) => setForm({ ...form, data: e.target.value })} />
        </FormRow>
        <InputField label="Veterinário" value={form.veterinario}
          onChange={(e) => setForm({ ...form, veterinario: e.target.value })} />
        <TextareaField label="Resultado" value={form.resultado}
          onChange={(e) => setForm({ ...form, resultado: e.target.value })} />
        <TextareaField label="Observação" value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
      </FormCard>
    </div>
  );
}
