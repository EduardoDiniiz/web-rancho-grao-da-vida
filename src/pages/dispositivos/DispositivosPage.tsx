import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Power, Wifi, WifiOff, RefreshCw, Settings, Pencil, Clock } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import api from '../../services/api';
import type { Dispositivo, DispositivosResponse } from '../../types';
import '../list.css';
import './DispositivosPage.css';

export function DispositivosPage() {
  const navigate = useNavigate();
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [configured, setConfigured] = useState(true);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, setPendente] = useState<Set<string>>(new Set());

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
                  <button type="button" className="dispositivo-card__btn"
                    onClick={() => navigate(`/dispositivos/${d.id}/nome`, { state: { dispositivo: d } })}>
                    <Pencil size={15} /> Editar
                  </button>
                  <button type="button" className="dispositivo-card__btn"
                    onClick={() => navigate(`/dispositivos/${d.id}/agendamento`, { state: { dispositivo: d } })}>
                    <Clock size={15} /> Agendar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
