import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard } from '../../components/common/FormCard';
import { InputField, SelectField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Animal, Baia, PageResponse } from '../../types';
import { required, fieldErrorsFromApi } from '../../utils/validators';
import '../animais/AnimalDetailPage.css';

type HospErrors = Partial<Record<'animalId' | 'baiaId' | 'dataEntrada', string>>;

export function HospedagemFormPage() {
  const navigate = useNavigate();
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [baiasLivres, setBaiasLivres] = useState<Baia[]>([]);
  const [form, setForm] = useState({ animalId: '', baiaId: '', dataEntrada: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState<HospErrors>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<PageResponse<Animal>>('/animais', { params: { status: 'ATIVO', size: 200 } }),
      api.get<PageResponse<Baia>>('/baias', { params: { status: 'LIVRE', size: 200 } }),
    ]).then(([a, b]) => {
      setAnimais(a.data.content);
      setBaiasLivres(b.data.content);
    }).finally(() => setLoading(false));
  }, []);

  function validate(): boolean {
    const e: HospErrors = {
      animalId: required(form.animalId, 'Animal'),
      baiaId: required(form.baiaId, 'Baia'),
      dataEntrada: required(form.dataEntrada, 'Data de entrada'),
    };
    Object.keys(e).forEach((k) => e[k as keyof HospErrors] === undefined && delete e[k as keyof HospErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/hospedagens', {
        animalId: Number(form.animalId), baiaId: Number(form.baiaId), dataEntrada: form.dataEntrada,
      });
      navigate('/hospedagens');
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao registrar entrada.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title="Registrar Entrada" subtitle="Nova hospedagem" />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <SelectField label="Animal *" value={form.animalId} error={errors.animalId}
          onChange={(e) => setForm({ ...form, animalId: e.target.value })}
          options={animais.map((a) => ({ value: String(a.id), label: `${a.nome} (${a.clienteNome})` }))} />
        <SelectField label="Baia (livres) *" value={form.baiaId} error={errors.baiaId}
          onChange={(e) => setForm({ ...form, baiaId: e.target.value })}
          options={baiasLivres.map((b) => ({ value: String(b.id), label: b.identificacao }))} />
        <InputField label="Data de entrada *" type="date" value={form.dataEntrada} error={errors.dataEntrada}
          onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })} />
      </FormCard>
    </div>
  );
}
