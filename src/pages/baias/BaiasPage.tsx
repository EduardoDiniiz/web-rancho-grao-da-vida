import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { InputField, SelectField, TextareaField } from '../../components/common/InputField';
import { FormRow } from '../../components/common/FormCard';
import api from '../../services/api';
import type { Baia, PageResponse } from '../../types';
import { label } from '../../utils/format';
import { required, fieldErrorsFromApi } from '../../utils/validators';
import '../list.css';

type BaiaErrors = Partial<Record<'identificacao' | 'capacidade', string>>;

const STATUS_OPTS = [
  { value: 'LIVRE', label: 'Livre' },
  { value: 'OCUPADA', label: 'Ocupada' },
  { value: 'MANUTENCAO', label: 'Manutenção' },
];
const statusVariant: Record<string, BadgeVariant> = { LIVRE: 'success', OCUPADA: 'info', MANUTENCAO: 'warning' };
const EMPTY = { identificacao: '', localizacao: '', capacidade: '1', status: 'LIVRE', observacao: '' };

export function BaiasPage() {
  const isAdmin = localStorage.getItem('rancho_role') === 'ADMIN';
  const [baias, setBaias] = useState<Baia[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<BaiaErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [statusFilter]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Baia>>('/baias', {
        params: { status: statusFilter || undefined, size: 100 },
      });
      setBaias(res.data.content);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null); setForm(EMPTY); setErrors({}); setModalOpen(true);
  }
  function openEdit(b: Baia) {
    setEditingId(b.id);
    setForm({
      identificacao: b.identificacao, localizacao: b.localizacao ?? '',
      capacidade: String(b.capacidade), status: b.status, observacao: b.observacao ?? '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: BaiaErrors = {
      identificacao: required(form.identificacao, 'Identificação'),
      capacidade: Number(form.capacidade) >= 1 ? undefined : 'Capacidade mínima é 1.',
    };
    Object.keys(e).forEach((k) => e[k as keyof BaiaErrors] === undefined && delete e[k as keyof BaiaErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form, capacidade: Number(form.capacidade) };
      if (editingId) await api.put(`/baias/${editingId}`, payload);
      else await api.post('/baias', payload);
      setModalOpen(false);
      load();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar baia.');
    } finally { setSaving(false); }
  }

  async function remove(b: Baia) {
    if (!window.confirm(`Excluir a baia "${b.identificacao}"?`)) return;
    try {
      await api.delete(`/baias/${b.id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erro ao excluir baia.');
    }
  }

  const columns: Column<Baia>[] = [
    { key: 'identificacao', label: 'Identificação', render: (b) => <strong>{b.identificacao}</strong> },
    { key: 'localizacao', label: 'Localização', render: (b) => b.localizacao || '-' },
    { key: 'capacidade', label: 'Capacidade' },
    { key: 'animalAtual', label: 'Ocupante', render: (b) => b.animalAtual || '-' },
    { key: 'status', label: 'Status', render: (b) => <Badge label={label(b.status)} variant={statusVariant[b.status]} /> },
    {
      key: 'actions', label: 'Ações',
      render: (b) => (
        <div className="row-actions">
          <button className="btn-sm" onClick={() => openEdit(b)}>Editar</button>
          {isAdmin && <button className="btn-sm btn-sm--danger" onClick={() => remove(b)}>Excluir</button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Baias" subtitle={`${baias.length} baias`}
        action={{ label: 'Nova Baia', onClick: openCreate }} />

      <div className="list-toolbar">
        <select className="list-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todas</option>
          {STATUS_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <DataTable columns={columns} data={baias} emptyMessage="Nenhuma baia cadastrada." />
      )}

      <Modal open={modalOpen} title={editingId ? 'Editar Baia' : 'Nova Baia'} onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }>
        <FormRow>
          <InputField label="Identificação *" value={form.identificacao} error={errors.identificacao}
            onChange={(e) => setForm({ ...form, identificacao: e.target.value })} />
          <InputField label="Capacidade" type="number" min={1} value={form.capacidade} error={errors.capacidade}
            onChange={(e) => setForm({ ...form, capacidade: e.target.value })} />
        </FormRow>
        <FormRow>
          <InputField label="Localização" value={form.localizacao}
            onChange={(e) => setForm({ ...form, localizacao: e.target.value })} />
          <SelectField label="Status" value={form.status} options={STATUS_OPTS} placeholder="Selecione..."
            onChange={(e) => setForm({ ...form, status: e.target.value })} />
        </FormRow>
        <TextareaField label="Observação" value={form.observacao}
          onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
      </Modal>
    </div>
  );
}
