import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField, TextareaField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Cliente } from '../../types';
import { maskCpfCnpj, maskPhone, onlyDigits } from '../../utils/masks';
import { required, validateCpfCnpj, validateEmail, validatePhone, fieldErrorsFromApi } from '../../utils/validators';
import '../animais/AnimalDetailPage.css';

const EMPTY = { nome: '', cpfCnpj: '', telefone: '', email: '', endereco: '', observacoes: '' };
type Errors = Partial<Record<keyof typeof EMPTY, string>>;

export function ClienteFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get<Cliente>(`/clientes/${id}`)
      .then((res) => {
        const c = res.data;
        setForm({
          nome: c.nome,
          cpfCnpj: maskCpfCnpj(c.cpfCnpj ?? ''),
          telefone: maskPhone(c.telefone ?? ''),
          email: c.email ?? '',
          endereco: c.endereco ?? '',
          observacoes: c.observacoes ?? '',
        });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function validate(): boolean {
    const e: Errors = {
      nome: required(form.nome, 'Nome'),
      cpfCnpj: validateCpfCnpj(form.cpfCnpj),
      telefone: validatePhone(form.telefone),
      email: validateEmail(form.email),
    };
    Object.keys(e).forEach((k) => e[k as keyof Errors] === undefined && delete e[k as keyof Errors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      // CPF/CNPJ e telefone trafegam e sao persistidos apenas com digitos
      const payload = { ...form, cpfCnpj: onlyDigits(form.cpfCnpj), telefone: onlyDigits(form.telefone) };
      if (isEdit) await api.put(`/clientes/${id}`, payload);
      else await api.post('/clientes', payload);
      navigate('/clientes');
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title={isEdit ? 'Editar Cliente' : 'Novo Cliente'}
        subtitle={isEdit ? form.nome : 'Cadastro de novo cliente'} />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <InputField label="Nome *" value={form.nome} error={errors.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <FormRow>
          <InputField label="CPF/CNPJ" value={form.cpfCnpj} error={errors.cpfCnpj} inputMode="numeric"
            placeholder="000.000.000-00" maxLength={18}
            onChange={(e) => setForm({ ...form, cpfCnpj: maskCpfCnpj(e.target.value) })} />
          <InputField label="Telefone" value={form.telefone} error={errors.telefone} inputMode="numeric"
            placeholder="(00) 00000-0000" maxLength={15}
            onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} />
        </FormRow>
        <InputField label="E-mail" type="email" value={form.email} error={errors.email}
          placeholder="email@exemplo.com" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <InputField label="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        <TextareaField label="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
      </FormCard>
    </div>
  );
}
