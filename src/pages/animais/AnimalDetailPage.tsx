import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { InputField, SelectField, TextareaField } from '../../components/common/InputField';
import { FormRow } from '../../components/common/FormCard';
import api from '../../services/api';
import type { Animal, AnimalServico, Servico, Vacina, PageResponse } from '../../types';
import { formatCurrency, formatDate, label } from '../../utils/format';
import { required, validatePositiveNumber, fieldErrorsFromApi } from '../../utils/validators';
import './AnimalDetailPage.css';

const TODAY = new Date().toISOString().slice(0, 10);
type VacinaErrors = Partial<Record<'nome' | 'dataAplicacao' | 'dataVencimento', string>>;
type ContratoErrors = Partial<Record<'servicoId' | 'valor' | 'dataInicio' | 'recorrenciaDias', string>>;

const vacinaVariant: Record<string, BadgeVariant> = { EM_DIA: 'success', PROXIMA: 'warning', VENCIDA: 'error' };
const contratoVariant: Record<string, BadgeVariant> = { ATIVO: 'success', SUSPENSO: 'warning', ENCERRADO: 'neutral' };

export function AnimalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animal, setAnimal] = useState<Animal | null>(null);
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [contratos, setContratos] = useState<AnimalServico[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);

  const [vacinaModal, setVacinaModal] = useState(false);
  const [vacinaForm, setVacinaForm] = useState({ nome: '', dataAplicacao: '', dataVencimento: '', observacao: '' });
  const [vacinaErrors, setVacinaErrors] = useState<VacinaErrors>({});

  const [contratoModal, setContratoModal] = useState(false);
  const [contratoForm, setContratoForm] = useState({ servicoId: '', valor: '', dataInicio: '', recorrenciaDias: '30', descricao: '' });
  const [contratoErrors, setContratoErrors] = useState<ContratoErrors>({});

  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, [id]);

  async function loadAll() {
    setLoading(true);
    try {
      const [a, v, c, s] = await Promise.all([
        api.get<Animal>(`/animais/${id}`),
        api.get<Vacina[]>(`/vacinas/animal/${id}`),
        api.get<AnimalServico[]>(`/animal-servicos/animal/${id}`),
        api.get<PageResponse<Servico>>('/servicos', { params: { apenasAtivos: true, size: 200 } }),
      ]);
      setAnimal(a.data);
      setVacinas(v.data);
      setContratos(c.data);
      setServicos(s.data.content);
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

  function validateVacina(): boolean {
    const e: VacinaErrors = {
      nome: required(vacinaForm.nome, 'Nome'),
      dataAplicacao: required(vacinaForm.dataAplicacao, 'Data de aplicação')
        ?? (vacinaForm.dataAplicacao > TODAY ? 'Data de aplicação não pode ser futura.' : undefined),
      dataVencimento: vacinaForm.dataVencimento && vacinaForm.dataAplicacao && vacinaForm.dataVencimento < vacinaForm.dataAplicacao
        ? 'Vencimento deve ser após a aplicação.' : undefined,
    };
    Object.keys(e).forEach((k) => e[k as keyof VacinaErrors] === undefined && delete e[k as keyof VacinaErrors]);
    setVacinaErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveVacina() {
    if (!validateVacina()) return;
    setSaving(true);
    try {
      await api.post('/vacinas', {
        animalId: Number(id), nome: vacinaForm.nome,
        dataAplicacao: vacinaForm.dataAplicacao,
        dataVencimento: vacinaForm.dataVencimento || null,
        observacao: vacinaForm.observacao || null,
      });
      setVacinaModal(false);
      setVacinaForm({ nome: '', dataAplicacao: '', dataVencimento: '', observacao: '' });
      setVacinaErrors({});
      loadAll();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setVacinaErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao registrar vacina.');
    } finally { setSaving(false); }
  }

  async function removeVacina(v: Vacina) {
    if (!window.confirm(`Remover a vacina "${v.nome}"?`)) return;
    await api.delete(`/vacinas/${v.id}`);
    loadAll();
  }

  function openContrato() {
    setContratoForm({ servicoId: '', valor: '', dataInicio: new Date().toISOString().slice(0, 10), recorrenciaDias: '30', descricao: '' });
    setContratoErrors({});
    setContratoModal(true);
  }

  function onServicoChange(servicoId: string) {
    const s = servicos.find((x) => String(x.id) === servicoId);
    setContratoForm((f) => ({ ...f, servicoId, valor: s ? String(s.valorPadrao) : f.valor }));
  }

  function validateContrato(): boolean {
    const e: ContratoErrors = {
      servicoId: required(contratoForm.servicoId, 'Serviço'),
      valor: validatePositiveNumber(contratoForm.valor, 'Valor'),
      dataInicio: required(contratoForm.dataInicio, 'Data de início'),
      recorrenciaDias: Number(contratoForm.recorrenciaDias) >= 1 ? undefined : 'Recorrência mínima é 1 dia.',
    };
    Object.keys(e).forEach((k) => e[k as keyof ContratoErrors] === undefined && delete e[k as keyof ContratoErrors]);
    setContratoErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveContrato() {
    if (!validateContrato()) return;
    setSaving(true);
    try {
      await api.post('/animal-servicos', {
        animalId: Number(id),
        servicoId: Number(contratoForm.servicoId),
        valor: Number(contratoForm.valor),
        dataInicio: contratoForm.dataInicio,
        recorrenciaDias: Number(contratoForm.recorrenciaDias),
        descricao: contratoForm.descricao || null,
      });
      setContratoModal(false);
      loadAll();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setContratoErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao contratar serviço.');
    } finally { setSaving(false); }
  }

  async function changeContratoStatus(c: AnimalServico, status: string) {
    await api.patch(`/animal-servicos/${c.id}/status`, null, { params: { status } });
    loadAll();
  }

  if (loading) return <p className="detail__loading">Carregando...</p>;
  if (!animal) return <p className="detail__loading">Animal não encontrado.</p>;

  return (
    <div>
      <button className="detail__back" onClick={() => navigate('/animais')}>← Voltar</button>
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
        <button className="btn-sm btn-sm--primary" onClick={openContrato}>+ Contratar Serviço</button>
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
        <button className="btn-sm btn-sm--primary" onClick={() => setVacinaModal(true)}>+ Registrar Vacina</button>
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

      {/* ===== MODAL VACINA ===== */}
      <Modal open={vacinaModal} title="Registrar Vacina" onClose={() => setVacinaModal(false)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setVacinaModal(false)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={saveVacina} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }>
        <InputField label="Nome da vacina *" value={vacinaForm.nome} error={vacinaErrors.nome}
          onChange={(e) => setVacinaForm({ ...vacinaForm, nome: e.target.value })} />
        <FormRow>
          <InputField label="Data de aplicação *" type="date" value={vacinaForm.dataAplicacao} max={TODAY} error={vacinaErrors.dataAplicacao}
            onChange={(e) => setVacinaForm({ ...vacinaForm, dataAplicacao: e.target.value })} />
          <InputField label="Data de vencimento" type="date" value={vacinaForm.dataVencimento} error={vacinaErrors.dataVencimento}
            onChange={(e) => setVacinaForm({ ...vacinaForm, dataVencimento: e.target.value })} />
        </FormRow>
        <TextareaField label="Observação" value={vacinaForm.observacao}
          onChange={(e) => setVacinaForm({ ...vacinaForm, observacao: e.target.value })} />
      </Modal>

      {/* ===== MODAL CONTRATO ===== */}
      <Modal open={contratoModal} title="Contratar Serviço" onClose={() => setContratoModal(false)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setContratoModal(false)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={saveContrato} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }>
        <SelectField label="Serviço *" value={contratoForm.servicoId} error={contratoErrors.servicoId}
          onChange={(e) => onServicoChange(e.target.value)}
          options={servicos.map((s) => ({ value: String(s.id), label: s.nome }))} />
        <FormRow>
          <InputField label="Valor (R$) *" type="number" step="0.01" min={0} value={contratoForm.valor} error={contratoErrors.valor}
            onChange={(e) => setContratoForm({ ...contratoForm, valor: e.target.value })} />
          <InputField label="Recorrência (dias) *" type="number" min={1} value={contratoForm.recorrenciaDias} error={contratoErrors.recorrenciaDias}
            onChange={(e) => setContratoForm({ ...contratoForm, recorrenciaDias: e.target.value })} />
        </FormRow>
        <InputField label="Data de início *" type="date" value={contratoForm.dataInicio} error={contratoErrors.dataInicio}
          onChange={(e) => setContratoForm({ ...contratoForm, dataInicio: e.target.value })} />
        <TextareaField label="Descrição adicional" value={contratoForm.descricao}
          onChange={(e) => setContratoForm({ ...contratoForm, descricao: e.target.value })} />
      </Modal>
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
