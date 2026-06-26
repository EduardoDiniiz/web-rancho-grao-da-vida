import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import api from '../../services/api';
import type { Animal, AnimalServico, Vacina, Exame } from '../../types';
import { formatCurrency, formatDate, label } from '../../utils/format';
import { ChevronLeft } from 'lucide-react';
import './AnimalDetailPage.css';

const vacinaVariant: Record<string, BadgeVariant> = { EM_DIA: 'success', PROXIMA: 'warning', VENCIDA: 'error' };
const contratoVariant: Record<string, BadgeVariant> = { ATIVO: 'success', SUSPENSO: 'warning', ENCERRADO: 'neutral' };

export function AnimalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [contratos, setContratos] = useState<AnimalServico[]>([]);
  const [exames, setExames] = useState<Exame[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      const [a, v, c, e] = await Promise.all([
        api.get<Animal>(`/animais/${id}`),
        api.get<Vacina[]>(`/vacinas/animal/${id}`),
        api.get<AnimalServico[]>(`/animal-servicos/animal/${id}`),
        api.get<Exame[]>(`/exames/animal/${id}`),
      ]);
      setAnimal(a.data);
      setVacinas(v.data);
      setContratos(c.data);
      setExames(e.data);
    } finally {
      setLoading(false);
    }
  }

  async function toggleArchive() {
    if (!animal) return;
    const action = animal.status === 'ATIVO' ? 'archive' : 'unarchive';
    await api.patch(`/animais/${animal.id}/${action}`);
    loadAll();
  }

  async function removeVacina(v: Vacina) {
    if (!window.confirm(`Remover a vacina "${v.nome}"?`)) return;
    await api.delete(`/vacinas/${v.id}`);
    loadAll();
  }

  async function removeExame(e: Exame) {
    if (!window.confirm(`Remover o exame "${e.nome}"?`)) return;
    await api.delete(`/exames/${e.id}`);
    loadAll();
  }

  async function changeContratoStatus(c: AnimalServico, status: string) {
    await api.patch(`/animal-servicos/${c.id}/status`, null, { params: { status } });
    loadAll();
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;
  if (!animal) return <p className="detail__loading">Animal não encontrado.</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate('/animais')}><ChevronLeft size={16} /> Voltar</button>
      <PageHeader title={animal.nome} subtitle={`Proprietário: ${animal.clienteNome}`}
        action={{ label: animal.status === 'ATIVO' ? 'Arquivar' : 'Reativar', onClick: toggleArchive }} />

      <div className="detail__card">
        <div className="detail__grid">
          <Info label="Sexo" value={label(animal.sexo)} />
          <Info label="Esporte" value={label(animal.esporte)} />
          <Info label="Nascimento" value={formatDate(animal.dataNascimento)} />
          <Info label="Registro" value={animal.registro || '-'} />
          <Info label="Status" value={label(animal.status)} />
        </div>
        {animal.enfermidades && <Info label="Enfermidades" value={animal.enfermidades} block />}
        {animal.observacoes && <Info label="Observações" value={animal.observacoes} block />}
      </div>

      {/* ===== SERVIÇOS CONTRATADOS ===== */}
      <div className="detail__section-header">
        <h2>Serviços Contratados</h2>
        <button className="btn-sm btn-sm--primary" onClick={() => navigate(`/animais/${id}/contratos/novo`)}>+ Contratar Serviço</button>
      </div>
      {contratos.length === 0 ? (
        <div className="detail__empty">Nenhum serviço contratado.</div>
      ) : (
        <div className="detail__list">
          {contratos.map((c) => (
            <div key={c.id} className="detail__item">
              <div className="detail__item-main">
                <strong>{c.servicoNome}</strong>
                <span>{formatCurrency(c.valor)} · a cada {c.recorrenciaDias} dias</span>
                <span className="detail__muted">Próximo vencimento: {formatDate(c.proximoVencimento)}</span>
              </div>
              <div className="detail__item-side">
                <Badge label={label(c.status)} variant={contratoVariant[c.status]} />
                {c.status === 'ATIVO' && (
                  <button className="btn-sm" onClick={() => changeContratoStatus(c, 'SUSPENSO')}>Suspender</button>
                )}
                {c.status === 'SUSPENSO' && (
                  <button className="btn-sm" onClick={() => changeContratoStatus(c, 'ATIVO')}>Reativar</button>
                )}
                {c.status !== 'ENCERRADO' && (
                  <button className="btn-sm btn-sm--danger" onClick={() => changeContratoStatus(c, 'ENCERRADO')}>Encerrar</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== VACINAS ===== */}
      <div className="detail__section-header">
        <h2>Vacinas</h2>
        <button className="btn-sm btn-sm--primary" onClick={() => navigate(`/animais/${id}/vacinas/nova`)}>+ Registrar Vacina</button>
      </div>
      {vacinas.length === 0 ? (
        <div className="detail__empty">Nenhuma vacina registrada.</div>
      ) : (
        <div className="detail__list">
          {vacinas.map((v) => (
            <div key={v.id} className="detail__item">
              <div className="detail__item-main">
                <strong>{v.nome}</strong>
                <span>Aplicação: {formatDate(v.dataAplicacao)} · Vencimento: {formatDate(v.dataVencimento)}</span>
                {v.observacao && <span className="detail__muted">{v.observacao}</span>}
              </div>
              <div className="detail__item-side">
                <Badge label={label(v.situacao)} variant={vacinaVariant[v.situacao]} />
                <button className="btn-sm btn-sm--danger" onClick={() => removeVacina(v)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== EXAMES ===== */}
      <div className="detail__section-header">
        <h2>Exames</h2>
        <button className="btn-sm btn-sm--primary" onClick={() => navigate(`/animais/${id}/exames/novo`)}>+ Registrar Exame</button>
      </div>
      {exames.length === 0 ? (
        <div className="detail__empty">Nenhum exame registrado.</div>
      ) : (
        <div className="detail__list">
          {exames.map((e) => (
            <div key={e.id} className="detail__item">
              <div className="detail__item-main">
                <strong>{e.nome}</strong>
                <span>Data: {formatDate(e.data)}{e.veterinario ? ` · Vet.: ${e.veterinario}` : ''}</span>
                {e.resultado && <span className="detail__muted">Resultado: {e.resultado}</span>}
                {e.observacao && <span className="detail__muted">{e.observacao}</span>}
              </div>
              <div className="detail__item-side">
                <button className="btn-sm btn-sm--danger" onClick={() => removeExame(e)}>Remover</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, block }: { label: string; value: string; block?: boolean }) {
  return (
    <div className={block ? 'detail__info detail__info--block' : 'detail__info'}>
      <span className="detail__info-label">{label}</span>
      <span className="detail__info-value">{value}</span>
    </div>
  );
}
