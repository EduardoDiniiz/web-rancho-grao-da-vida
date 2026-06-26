import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { FormCard, FormRow } from '../../components/common/FormCard';
import { InputField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Dispositivo, DispositivosResponse } from '../../types';
import '../animais/AnimalDetailPage.css';

export function DispositivoAgendamentoPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { dispositivo?: Dispositivo } | null)?.dispositivo;

  const [nome, setNome] = useState(fromState?.nome ?? '');
  const [horaLigar, setHoraLigar] = useState(fromState?.horaLigar ?? '');
  const [horaDesligar, setHoraDesligar] = useState(fromState?.horaDesligar ?? '');
  const [ativo, setAtivo] = useState(fromState?.agendamentoAtivo ?? true);
  const [loading, setLoading] = useState(!fromState);
  const [saving, setSaving] = useState(false);

  // Fallback: se entrou direto na URL (sem state), busca o dispositivo na lista.
  useEffect(() => {
    if (fromState) return;
    api.get<DispositivosResponse>('/dispositivos')
      .then((res) => {
        const d = res.data.dispositivos.find((x) => x.id === id);
        if (d) {
          setNome(d.nome ?? '');
          setHoraLigar(d.horaLigar ?? '');
          setHoraDesligar(d.horaDesligar ?? '');
          setAtivo(d.agendamentoAtivo ?? true);
        }
      })
      .finally(() => setLoading(false));
  }, [id, fromState]);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/dispositivos/${id}/agendamento`, {
        horaLigar: horaLigar || null,
        horaDesligar: horaDesligar || null,
        ativo,
      });
      navigate('/dispositivos');
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Nao foi possivel salvar o agendamento.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate(-1)}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title="Agendar liga/desliga" subtitle={nome || 'Dispositivo'} />

      <FormCard onSubmit={save} loading={saving} onCancel={() => navigate(-1)}>
        <p className="dispositivo-edit-hint" style={{ marginTop: 0 }}>Repete <strong>todos os dias</strong>.</p>
        <FormRow>
          <InputField label="Ligar às" type="time" value={horaLigar}
            onChange={(e) => setHoraLigar(e.target.value)} />
          <InputField label="Desligar às" type="time" value={horaDesligar}
            onChange={(e) => setHoraDesligar(e.target.value)} />
        </FormRow>
        <label className="dispositivo-ag-ativo">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Agendamento ativo
        </label>
        <p className="dispositivo-edit-hint">
          Deixe um horário em branco para não disparar aquela ação. Sem nenhum horário, o agendamento é removido.
        </p>
      </FormCard>
    </div>
  );
}
