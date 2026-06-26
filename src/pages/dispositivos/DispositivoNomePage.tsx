import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard } from '../../components/common/FormCard';
import { InputField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Dispositivo, DispositivosResponse } from '../../types';
import '../animais/AnimalDetailPage.css';

export function DispositivoNomePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { dispositivo?: Dispositivo } | null)?.dispositivo;

  const [nome, setNome] = useState(fromState?.nome ?? '');
  const [loading, setLoading] = useState(!fromState);
  const [saving, setSaving] = useState(false);

  // Fallback: se entrou direto na URL (sem state), busca o dispositivo na lista.
  useEffect(() => {
    if (fromState) return;
    api.get<DispositivosResponse>('/dispositivos')
      .then((res) => {
        const d = res.data.dispositivos.find((x) => x.id === id);
        if (d) setNome(d.nome ?? '');
      })
      .finally(() => setLoading(false));
  }, [id, fromState]);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/dispositivos/${id}/nome`, { nome: nome.trim() });
      navigate('/dispositivos');
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Nao foi possivel renomear o dispositivo.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title="Renomear dispositivo" subtitle="Nome exibido no app" />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <InputField label="Nome do dispositivo" value={nome} autoFocus maxLength={255}
          placeholder="Ex: Luz da Baia 1" onChange={(e) => setNome(e.target.value)} />
        <p className="dispositivo-edit-hint">Deixe em branco para voltar ao nome original do Smart Life.</p>
      </FormCard>
    </div>
  );
}
