import { useEffect, useState } from 'react';
import { Power, Wifi, WifiOff, RefreshCw, Settings, Pencil, Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { InputField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Dispositivo, DispositivosResponse } from '../../types';
import '../list.css';
import './DispositivosPage.css';

export function DispositivosPage() {
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState<Set<string>>(new Set());

  const [editando, setEditando] = useState<Dispositivo | null>(null);
  const [novoNome, setNovoNome] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [agendando, setAgendando] = useState<Dispositivo | null>(null);
  const [horaLigar, setHoraLigar] = useState('');
  const [horaDesligar, setHoraDesligar] = useState('');
  const [agAtivo, setAgAtivo] = useState(true);
  const [salvandoAg, setSalvandoAg] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setErro(null);
    try {
      const res = await api.get<DispositivosResponse>('/dispositivos');
      setConfigured(res.data.configured);
      setDispositivos(res.data.dispositivos);
    } catch (err: any) {
      setErro(err.response?.data?.message ?? 'Erro ao carregar dispositivos.');
    } finally {
      setLoading(false);
    }
  }

  function abrirEdicao(d: Dispositivo) {
    setEditando(d);
    setNovoNome(d.nome ?? '');
  }

  async function salvarNome() {
    if (!editando) return;
    const nome = novoNome.trim();
    setSalvando(true);
    try {
      await api.put(`/dispositivos/${editando.id}/nome`, { nome });
      setDispositivos((list) => list.map((x) => (x.id === editando.id ? { ...x, nome } : x)));
      setEditando(null);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Nao foi possivel renomear o dispositivo.');
    } finally {
      setSalvando(false);
    }
  }

  function abrirAgendamento(d: Dispositivo) {
    setAgendando(d);
    setHoraLigar(d.horaLigar ?? '');
    setHoraDesligar(d.horaDesligar ?? '');
    setAgAtivo(d.agendamentoAtivo ?? true);
  }

  async function salvarAgendamento() {
    if (!agendando) return;
    setSalvandoAg(true);
    try {
      await api.put(`/dispositivos/${agendando.id}/agendamento`, {
        horaLigar: horaLigar || null,
        horaDesligar: horaDesligar || null,
        ativo: agAtivo,
      });
      const temHorario = !!(horaLigar || horaDesligar);
      setDispositivos((list) => list.map((x) => (x.id === agendando.id ? {
        ...x,
        horaLigar: horaLigar || undefined,
        horaDesligar: horaDesligar || undefined,
        agendamentoAtivo: temHorario ? agAtivo : undefined,
      } : x)));
      setAgendando(null);
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Nao foi possivel salvar o agendamento.');
    } finally {
      setSalvandoAg(false);
    }
  }

  function resumoAgenda(d: Dispositivo): string | null {
    const partes: string[] = [];
    if (d.horaLigar) partes.push(`Liga ${d.horaLigar}`);
    if (d.horaDesligar) partes.push(`Desliga ${d.horaDesligar}`);
    if (!partes.length) return null;
    return partes.join(' · ') + (d.agendamentoAtivo === false ? ' (pausado)' : '');
  }

  async function toggle(d: Dispositivo) {
    const novoEstado = !d.ligado;
    setPendente((p) => new Set(p).add(d.id));
    // atualizacao otimista
    setDispositivos((list) => list.map((x) => (x.id === d.id ? { ...x, ligado: novoEstado } : x)));
    try {
      await api.post(`/dispositivos/${d.id}/comando`, { ligado: novoEstado });
    } catch (err: any) {
      // reverte em caso de erro
      setDispositivos((list) => list.map((x) => (x.id === d.id ? { ...x, ligado: d.ligado } : x)));
      alert(err.response?.data?.message ?? 'Nao foi possivel enviar o comando.');
    } finally {
      setPendente((p) => { const n = new Set(p); n.delete(d.id); return n; });
    }
  }

  return (
    <div>
      <PageHeader title="Dispositivos" subtitle="Interruptores WiFi do haras" />

      <div className="list-toolbar">
        <button className="btn-sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="list-loading">Carregando...</div>
      ) : !configured ? (
        <div className="dispositivos-setup">
          <Settings size={28} />
          <h3>Integracao ainda nao configurada</h3>
          <p>
            Para controlar os interruptores WiFi pelo app e preciso criar um Cloud Project na
            <strong> Tuya IoT Platform</strong> (iot.tuya.com), vincular a conta do Smart Life e
            informar as credenciais (Access ID, Access Secret e regiao) no servidor.
          </p>
        </div>
      ) : erro ? (
        <div className="list-error">{erro}</div>
      ) : dispositivos.length === 0 ? (
        <div className="list-loading">Nenhum dispositivo encontrado na conta Tuya.</div>
      ) : (
        <div className="dispositivos-grid">
          {dispositivos.map((d) => {
            const offline = d.online === false;
            const busy = pendente.has(d.id);
            return (
              <div key={d.id} className={`dispositivo-card ${d.ligado ? 'dispositivo-card--on' : ''}`}>
                <div className="dispositivo-card__top">
                  <span className={`dispositivo-card__icon ${d.ligado ? 'is-on' : ''}`}>
                    <Power size={20} />
                  </span>
                  <span className={`dispositivo-card__status ${offline ? 'is-offline' : ''}`}>
                    {offline ? <><WifiOff size={13} /> Offline</> : <><Wifi size={13} /> Online</>}
                  </span>
                </div>

                <div className="dispositivo-card__name">
                  <span className="dispositivo-card__name-text">{d.nome || 'Sem nome'}</span>
                </div>

                {resumoAgenda(d) && (
                  <div className={`dispositivo-card__sched ${d.agendamentoAtivo === false ? 'is-paused' : ''}`}>
                    <Clock size={13} /> {resumoAgenda(d)}
                  </div>
                )}

                <button
                  type="button"
                  className={`dispositivo-toggle ${d.ligado ? 'dispositivo-toggle--on' : ''}`}
                  onClick={() => toggle(d)}
                  disabled={offline || busy}
                  aria-pressed={!!d.ligado}
                >
                  <span className="dispositivo-toggle__knob" />
                  <span className="dispositivo-toggle__label">
                    {busy ? '...' : d.ligado ? 'Ligado' : 'Desligado'}
                  </span>
                </button>

                <div className="dispositivo-card__actions">
                  <button type="button" className="dispositivo-card__btn" onClick={() => abrirEdicao(d)}>
                    <Pencil size={15} /> Editar
                  </button>
                  <button type="button" className="dispositivo-card__btn" onClick={() => abrirAgendamento(d)}>
                    <Clock size={15} /> Agendar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editando}
        title="Renomear dispositivo"
        width={420}
        onClose={() => setEditando(null)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setEditando(null)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={salvarNome} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }
      >
        <InputField
          label="Nome do dispositivo"
          value={novoNome}
          autoFocus
          maxLength={255}
          placeholder="Ex: Luz da Baia 1"
          onChange={(e) => setNovoNome(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') salvarNome(); }}
        />
        <p className="dispositivo-edit-hint">Deixe em branco para voltar ao nome original do Smart Life.</p>
      </Modal>

      <Modal
        open={!!agendando}
        title="Agendar liga/desliga"
        width={420}
        onClose={() => setAgendando(null)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setAgendando(null)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={salvarAgendamento} disabled={salvandoAg}>
              {salvandoAg ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }
      >
        <p className="dispositivo-edit-hint" style={{ marginTop: 0, marginBottom: 12 }}>
          {agendando?.nome} — repete <strong>todos os dias</strong>.
        </p>
        <div className="dispositivo-ag-row">
          <InputField
            label="Ligar às"
            type="time"
            value={horaLigar}
            onChange={(e) => setHoraLigar(e.target.value)}
          />
          <InputField
            label="Desligar às"
            type="time"
            value={horaDesligar}
            onChange={(e) => setHoraDesligar(e.target.value)}
          />
        </div>
        <label className="dispositivo-ag-ativo">
          <input type="checkbox" checked={agAtivo} onChange={(e) => setAgAtivo(e.target.checked)} />
          Agendamento ativo
        </label>
        <p className="dispositivo-edit-hint">
          Deixe um horário em branco para não disparar aquela ação. Sem nenhum horário, o agendamento é removido.
        </p>
      </Modal>
    </div>
  );
}
