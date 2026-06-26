import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField, SelectField, TextareaField, ButtonGroupField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Animal, Cliente, PageResponse } from '../../types';
import { required, fieldErrorsFromApi } from '../../utils/validators';
import './AnimalDetailPage.css';

const TODAY = new Date().toISOString().slice(0, 10);
type AnimalErrors = Partial<Record<'clienteId' | 'nome' | 'dataNascimento', string>>;

const SEXO_OPTS = [{ value: 'MACHO', label: 'Macho' }, { value: 'FEMEA', label: 'Fêmea' }];
const ESPORTE_OPTS = [
  { value: 'VAQUEJADA', label: 'Vaquejada' },
  { value: 'TRES_TAMBORES', label: 'Três Tambores' },
  { value: 'HIPISMO', label: 'Hipismo' },
  { value: 'CORRIDA', label: 'Corrida' },
  { value: 'OUTRO', label: 'Outro' },
];

const EMPTY = {
  clienteId: '', nome: '', dataNascimento: '', sexo: '', esporte: '',
  registro: '', enfermidades: '', observacoes: '',
};

export function AnimalFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<AnimalErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<PageResponse<Cliente>>('/clientes', { params: { size: 200 } })
      .then((res) => setClientes(res.data.content));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get<Animal>(`/animais/${id}`)
      .then((res) => {
        const a = res.data;
        setForm({
          clienteId: String(a.clienteId),
          nome: a.nome,
          dataNascimento: a.dataNascimento ?? '',
          sexo: a.sexo ?? '',
          esporte: a.esporte ?? '',
          registro: a.registro ?? '',
          enfermidades: a.enfermidades ?? '',
          observacoes: a.observacoes ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function validate(): boolean {
    const e: AnimalErrors = {
      clienteId: required(form.clienteId, 'Proprietário'),
      nome: required(form.nome, 'Nome'),
      dataNascimento: form.dataNascimento && form.dataNascimento > TODAY ? 'Data de nascimento não pode ser futura.' : undefined,
    };
    Object.keys(e).forEach((k) => e[k as keyof AnimalErrors] === undefined && delete e[k as keyof AnimalErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        clienteId: Number(form.clienteId),
        nome: form.nome,
        dataNascimento: form.dataNascimento || null,
        sexo: form.sexo || null,
        esporte: form.esporte || null,
        registro: form.registro || null,
        enfermidades: form.enfermidades || null,
        observacoes: form.observacoes || null,
      };
      if (isEdit) {
        await api.put(`/animais/${id}`, payload);
        navigate(`/animais/${id}`);
      } else {
        const res = await api.post<Animal>('/animais', payload);
        navigate(`/animais/${res.data.id}`);
      }
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar animal.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title={isEdit ? 'Editar Animal' : 'Novo Animal'}
        subtitle={isEdit ? form.nome : 'Cadastro de novo animal'} />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <SelectField label="Proprietário *" value={form.clienteId} error={errors.clienteId}
          onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
          options={clientes.map((c) => ({ value: String(c.id), label: c.nome }))} />
        <InputField label="Nome *" value={form.nome} error={errors.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <ButtonGroupField label="Sexo" value={form.sexo} options={SEXO_OPTS} clearable
          onChange={(v) => setForm({ ...form, sexo: v })} />
        <ButtonGroupField label="Esporte" value={form.esporte} options={ESPORTE_OPTS} clearable
          onChange={(v) => setForm({ ...form, esporte: v })} />
        <FormRow>
          <InputField label="Data de Nascimento" type="date" value={form.dataNascimento} max={TODAY} error={errors.dataNascimento}
            onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} />
          <InputField label="Nº de Registro" value={form.registro}
            onChange={(e) => setForm({ ...form, registro: e.target.value })} />
        </FormRow>
        <TextareaField label="Enfermidades" value={form.enfermidades}
          onChange={(e) => setForm({ ...form, enfermidades: e.target.value })} />
        <TextareaField label="Observações" value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
      </FormCard>
    </div>
  );
}
