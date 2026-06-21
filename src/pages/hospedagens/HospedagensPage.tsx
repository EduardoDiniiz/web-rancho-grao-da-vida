import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { InputField, SelectField, ButtonGroup } from '../../components/common/InputField';
import api from '../../services/api';
import type { Animal, Baia, Hospedagem, PageResponse } from '../../types';
import { formatDate, label } from '../../utils/format';
import { required, fieldErrorsFromApi } from '../../utils/validators';
import '../list.css';

type HospErrors = Partial<Record<'animalId' | 'baiaId' | 'dataEntrada', string>>;

const STATUS_FILTER_OPTS = [
  { value: '', label: 'Todas' },
  { value: 'ATIVO', label: 'Ativas' },
  { value: 'ENCERRADO', label: 'Encerradas' },
];

export function HospedagensPage() {
  const [hospedagens, setHospedagens] = useState<Hospedagem[]>([]);
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [baiasLivres, setBaiasLivres] = useState<Baia[]>([]);
  const [statusFilter, setStatusFilter] = useState('ATIVO');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ animalId: '', baiaId: '', dataEntrada: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState<HospErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [page, statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Hospedagem>>('/hospedagens', {
        params: { status: statusFilter || undefined, page, size: 15 },
      });
      setHospedagens(res.data.content);
      setTotalPages(res.data.totalPages);
    } finally {
      setLoading(false);
    }
  }

  async function openCreate() {
    const [a, b] = await Promise.all([
      api.get<PageResponse<Animal>>('/animais', { params: { status: 'ATIVO', size: 200 } }),
      api.get<PageResponse<Baia>>('/baias', { params: { status: 'LIVRE', size: 200 } }),
    ]);
    setAnimais(a.data.content);
    setBaiasLivres(b.data.content);
    setForm({ animalId: '', baiaId: '', dataEntrada: new Date().toISOString().slice(0, 10) });
    setErrors({});
    setModalOpen(true);
  }

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
      setModalOpen(false);
      load();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao registrar entrada.');
    } finally { setSaving(false); }
  }

  async function registrarSaida(h: Hospedagem) {
    if (!window.confirm(`Registrar saída de "${h.animalNome}" da baia ${h.baiaIdentificacao}?`)) return;
    await api.patch(`/hospedagens/${h.id}/saida`, {});
    load();
  }

  const columns: Column<Hospedagem>[] = [
    { key: 'animalNome', label: 'Animal', render: (h) => <strong>{h.animalNome}</strong> },
    { key: 'clienteNome', label: 'Cliente' },
    { key: 'baiaIdentificacao', label: 'Baia' },
    { key: 'dataEntrada', label: 'Entrada', render: (h) => formatDate(h.dataEntrada) },
    { key: 'dataSaida', label: 'Saída', render: (h) => formatDate(h.dataSaida) },
    {
      key: 'status', label: 'Status',
      render: (h) => <Badge label={label(h.status)} variant={h.status === 'ATIVO' ? 'success' : 'neutral'} />,
    },
    {
      key: 'actions', label: 'Ações',
      render: (h) => h.status === 'ATIVO'
        ? <button className="btn-sm btn-sm--danger" onClick={() => registrarSaida(h)}>Registrar Saída</button>
        : <span>-</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Hospedagens" subtitle="Controle de ocupação das baias"
        action={{ label: 'Registrar Entrada', onClick: openCreate }} />

      <div className="list-toolbar">
        <ButtonGroup value={statusFilter} options={STATUS_FILTER_OPTS}
          onChange={(v) => { setStatusFilter(v); setPage(0); }} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <>
          <DataTable columns={columns} data={hospedagens} emptyMessage="Nenhuma hospedagem encontrada." />
          {totalPages > 1 && (
            <div className="list-pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
              <span>Página {page + 1} de {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} title="Registrar Entrada" onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }>
        <SelectField label="Animal *" value={form.animalId} error={errors.animalId}
          onChange={(e) => setForm({ ...form, animalId: e.target.value })}
          options={animais.map((a) => ({ value: String(a.id), label: `${a.nome} (${a.clienteNome})` }))} />
        <SelectField label="Baia (livres) *" value={form.baiaId} error={errors.baiaId}
          onChange={(e) => setForm({ ...form, baiaId: e.target.value })}
          options={baiasLivres.map((b) => ({ value: String(b.id), label: b.identificacao }))} />
        <InputField label="Data de entrada *" type="date" value={form.dataEntrada} error={errors.dataEntrada}
          onChange={(e) => setForm({ ...form, dataEntrada: e.target.value })} />
      </Modal>
    </div>
  );
}
