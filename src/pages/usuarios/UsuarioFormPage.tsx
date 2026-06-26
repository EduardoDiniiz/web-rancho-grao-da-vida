import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField, ButtonGroupField } from '../../components/common/InputField';
import api from '../../services/api';
import type { User } from '../../types';
import { required, validateEmail, fieldErrorsFromApi } from '../../utils/validators';
import '../animais/AnimalDetailPage.css';

type UserErrors = Partial<Record<'name' | 'email' | 'login' | 'password', string>>;
const ROLE_OPTS = [
  { value: 'OPERADOR', label: 'Operador' },
  { value: 'ADMIN', label: 'Administrador' },
];

export function UsuarioFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', login: '', password: '', role: 'OPERADOR', active: true });
  const [errors, setErrors] = useState<UserErrors>({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api.get<User>(`/users/${id}`)
      .then((res) => {
        const u = res.data;
        setForm({ name: u.name, email: u.email, login: u.login, password: '', role: u.role, active: u.active });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function validate(): boolean {
    const e: UserErrors = {
      name: required(form.name, 'Nome'),
      email: validateEmail(form.email, { requiredMsg: 'E-mail e obrigatorio.' }),
    };
    if (!isEdit) {
      e.login = required(form.login, 'Login') ?? (form.login.length < 3 ? 'Login deve ter no minimo 3 caracteres.' : undefined);
      e.password = required(form.password, 'Senha') ?? (form.password.length < 6 ? 'Senha deve ter no minimo 6 caracteres.' : undefined);
    }
    Object.keys(e).forEach((k) => e[k as keyof UserErrors] === undefined && delete e[k as keyof UserErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/users/${id}`, { name: form.name, email: form.email, role: form.role, active: form.active });
      } else {
        await api.post('/users', { name: form.name, email: form.email, login: form.login, password: form.password, role: form.role });
      }
      navigate('/usuarios');
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar usuário.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title={isEdit ? 'Editar Usuário' : 'Novo Usuário'}
        subtitle={isEdit ? form.name : 'Cadastro de novo usuário'} />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <InputField label="Nome completo *" value={form.name} error={errors.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <FormRow>
          <InputField label="E-mail *" type="email" value={form.email} error={errors.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <InputField label="Login *" value={form.login} disabled={isEdit} error={errors.login}
            onChange={(e) => setForm({ ...form, login: e.target.value })} />
        </FormRow>
        <FormRow>
          {!isEdit && (
            <InputField label="Senha *" type="password" value={form.password} error={errors.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" />
          )}
          <ButtonGroupField label="Perfil" value={form.role} options={ROLE_OPTS}
            onChange={(v) => setForm({ ...form, role: v })} />
        </FormRow>
      </FormCard>
    </div>
  );
}
