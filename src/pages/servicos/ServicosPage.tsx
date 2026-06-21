import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { InputField, TextareaField } from '../../components/common/InputField';
import api from '../../services/api';
import type { Servico, PageResponse } from '../../types';
import { formatCurrency } from '../../utils/format';
import { required, validatePositiveNumber, fieldErrorsFromApi } from '../../utils/validators';
import '../list.css';

type ServicoErrors = Partial<Record<'nome' | 'valorPadrao', string>>;

const EMPTY = { nome: '', descricao: '', valorPadrao: '' };

export function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<ServicoErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [search]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Servico>>('/servicos', {
        params: { search: search || undefined, size: 100 },
      });
      setServicos(res.data.content);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() { setEditingId(null); setForm(EMPTY); setErrors({}); setModalOpen(true); }
  function openEdit(s: Servico) {
    setEditingId(s.id);
    setForm({ nome: s.nome, descricao: s.descricao ?? '', valorPadrao: String(s.valorPadrao) });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: ServicoErrors = {
      nome: required(form.nome, 'Nome'),
      valorPadrao: validatePositiveNumber(form.valorPadrao, 'Valor'),
    };
    Object.keys(e).forEach((k) => e[k as keyof ServicoErrors] === undefined && delete e[k as keyof ServicoErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { nome: form.nome, descricao: form.descricao || null, valorPadrao: Number(form.valorPadrao) };
      if (editingId) await api.put(`/servicos/${editingId}`, payload);
      else await api.post('/servicos', payload);
      setModalOpen(false);
      load();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar serviço.');
    } finally { setSaving(false); }
  }

  async function toggleActive(s: Servico) {
    await api.patch(`/servicos/${s.id}/active`, null, { params: { active: !s.active } });
    load();
  }

  const columns: Column<Servico>[] = [
    { key: 'nome', label: 'Serviço', render: (s) => <strong>{s.nome}</strong> },
    { key: 'descricao', label: 'Descrição', render: (s) => s.descricao || '-' },
    { key: 'valorPadrao', label: 'Valor padrão', render: (s) => formatCurrency(s.valorPadrao) },
    { key: 'active', label: 'Status', render: (s) => <Badge label={s.active ? 'Ativo' : 'Inativo'} variant={s.active ? 'success' : 'neutral'} /> },
    {
      key: 'actions', label: 'Ações',
      render: (s) => (
        <div className="row-actions">
          <button className="btn-sm" onClick={() => openEdit(s)}>Editar</button>
          <button className="btn-sm" onClick={() => toggleActive(s)}>{s.active ? 'Inativar' : 'Ativar'}</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Serviços" subtitle="Catálogo de serviços cobráveis"
        action={{ label: 'Novo Serviço', onClick: openCreate }} />

      <div className="list-toolbar">
        <input className="list-search" placeholder="Buscar serviço..."
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <DataTable columns={columns} data={servicos} emptyMessage="Nenhum serviço cadastrado." />
      )}

      <Modal open={modalOpen} title={editingId ? 'Editar Serviço' : 'Novo Serviço'} onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }>
        <InputField label="Nome *" value={form.nome} error={errors.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <InputField label="Valor padrão (R$) *" type="number" step="0.01" min={0} value={form.valorPadrao} error={errors.valorPadrao}
          onChange={(e) => setForm({ ...form, valorPadrao: e.target.value })} />
        <TextareaField label="Descrição" value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
      </Modal>
    </div>
  );
}
