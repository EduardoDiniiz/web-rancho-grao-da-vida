import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField, TextareaField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Servico, PageResponse } from '../../types';
import { validatePositiveCurrency, required, fieldErrorsFromApi } from '../../utils/validators';
import { maskCurrency, currencyToMask, parseCurrency } from '../../utils/masks';
import './AnimalDetailPage.css';

type ContratoErrors = Partial<Record<'servicoNome' | 'valor' | 'dataInicio' | 'recorrenciaDias', string>>;

export function ContratoFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [form, setForm] = useState({
    servicoNome: '', valor: '', dataInicio: new Date().toISOString().slice(0, 10), recorrenciaDias: '30', descricao: '',
  });
  const [errors, setErrors] = useState<ContratoErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<PageResponse<Servico>>('/servicos', { params: { apenasAtivos: true, size: 200 } })
      .then((res) => setServicos(res.data.content));
  }, []);

  // Ao digitar um serviço já existente no catálogo, sugere o valor padrão (sem sobrescrever o usuário).
  function onServicoNomeChange(servicoNome: string) {
    const s = servicos.find((x) => x.nome.toLowerCase() === servicoNome.trim().toLowerCase());
    setForm((f) => ({
      ...f,
      servicoNome,
      valor: s && !f.valor ? currencyToMask(s.valorPadrao) : f.valor,
    }));
  }

  function validate(): boolean {
    const e: ContratoErrors = {
      servicoNome: required(form.servicoNome, 'Serviço'),
      valor: validatePositiveCurrency(form.valor, 'Valor'),
      dataInicio: required(form.dataInicio, 'Data de início'),
      recorrenciaDias: Number(form.recorrenciaDias) >= 1 ? undefined : 'Recorrência mínima é 1 dia.',
    };
    Object.keys(e).forEach((k) => e[k as keyof ContratoErrors] === undefined && delete e[k as keyof ContratoErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      await api.post('/animal-servicos', {
        animalId: Number(id),
        servicoNome: form.servicoNome.trim(),
        valor: parseCurrency(form.valor),
        dataInicio: form.dataInicio,
        recorrenciaDias: Number(form.recorrenciaDias),
        descricao: form.descricao || null,
      });
      navigate(`/animais/${id}`);
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao contratar serviço.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title="Contratar Serviço" subtitle="Novo serviço contratado para o animal" />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <InputField label="Serviço *" value={form.servicoNome} error={errors.servicoNome}
          list="servicos-sugestoes" placeholder="Digite o serviço"
          onChange={(e) => onServicoNomeChange(e.target.value)} />
        <datalist id="servicos-sugestoes">
          {servicos.map((s) => <option key={s.id} value={s.nome} />)}
        </datalist>
        <FormRow>
          <InputField label="Valor (R$) *" inputMode="numeric" placeholder="0,00" value={form.valor} error={errors.valor}
            onChange={(e) => setForm({ ...form, valor: maskCurrency(e.target.value) })} />
          <InputField label="Recorrência (dias) *" type="number" min={1} value={form.recorrenciaDias} error={errors.recorrenciaDias}
            onChange={(e) => setForm({ ...form, recorrenciaDias: e.target.value })} />
        </FormRow>
        <InputField label="Data de início *" type="date" value={form.dataInicio} error={errors.dataInicio}
          onChange={(e) => setForm({ ...form, dataInicio: e.target.value })} />
        <TextareaField label="Descrição adicional" value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </FormCard>
    </div>
  );
}
