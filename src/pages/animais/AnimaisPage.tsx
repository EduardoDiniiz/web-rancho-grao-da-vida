import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { InputField, SelectField, TextareaField, ButtonGroup, ButtonGroupField } from '../../components/common/InputField';
import { FormRow } from '../../components/common/FormCard';
import api from '../../services/api';
import type { Animal, Cliente, PageResponse } from '../../types';
import { label } from '../../utils/format';
import { required, fieldErrorsFromApi } from '../../utils/validators';
import '../list.css';

const TODAY = new Date().toISOString().slice(0, 10);
type AnimalErrors = Partial<Record<'clienteId' | 'nome' | 'dataNascimento', string>>;

const SEXO_OPTS = [{ value: 'MACHO', label: 'Macho' }, { value: 'FEMEA', label: 'Fêmea' }];
const ESPORTE_OPTS = [
  { value: 'VAQUEJADA', label: 'Vaquejada' },
  { value: 'TRES_TAMBORES', label: 'Três Tambores' },
  { value: 'HIPISMO', label: 'Hipismo' },
  { value: 'CORRIDA', label: 'Corrida' },
  { value: 'OUTRO', label: 'Outro' },
];
const STATUS_FILTER_OPTS = [
  { value: '', label: 'Todos' },
  { value: 'ATIVO', label: 'Ativos' },
  { value: 'ARQUIVADO', label: 'Arquivados' },
];

const EMPTY = {
  clienteId: '', nome: '', dataNascimento: '', sexo: '', esporte: '',
  registro: '', enfermidades: '', observacoes: '',
};

export function AnimaisPage() {
  const navigate = useNavigate();
  const [animais, setAnimais] = useState<Animal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ATIVO');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<AnimalErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [page, search, statusFilter]);
  useEffect(() => { loadClientes(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Animal>>('/animais', {
        params: { page, search: search || undefined, status: statusFilter || undefined, size: 15 },
      });
      setAnimais(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } finally {
      setLoading(false);
    }
  }

  async function loadClientes() {
    const res = await api.get<PageResponse<Cliente>>('/clientes', { params: { size: 200 } });
    setClientes(res.data.content);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(a: Animal) {
    setEditingId(a.id);
    setForm({
      clienteId: String(a.clienteId),
      nome: a.nome,
      dataNascimento: a.dataNascimento ?? '',
      sexo: a.sexo ?? '',
      esporte: a.esporte ?? '',
      registro: a.registro ?? '',
      enfermidades: a.enfermidades ?? '',
      observacoes: a.observacoes ?? '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: AnimalErrors = {
      clienteId: required(form.clienteId, 'Proprietário'),
      nome: required(form.nome, 'Nome'),
      dataNascimento: form.dataNascimento && form.dataNascimento > TODAY ? 'Data de nascimento não pode ser futura.' : undefined,
    };
    Object.keys(e).forEach((k) => e[k as keyof AnimalErrors] === undefined && delete e[k as keyof AnimalErrors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        clienteId: Number(form.clienteId),
        nome: form.nome,
        dataNascimento: form.dataNascimento || null,
        sexo: form.sexo || null,
        esporte: form.esporte || null,
        registro: form.registro || null,
        enfermidades: form.enfermidades || null,
        observacoes: form.observacoes || null,
      };
      if (editingId) await api.put(`/animais/${editingId}`, payload);
      else await api.post('/animais', payload);
      setModalOpen(false);
      load();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar animal.');
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<Animal>[] = [
    { key: 'nome', label: 'Nome', render: (a) => <strong>{a.nome}</strong> },
    { key: 'clienteNome', label: 'Proprietário' },
    { key: 'esporte', label: 'Esporte', render: (a) => label(a.esporte) },
    { key: 'sexo', label: 'Sexo', render: (a) => label(a.sexo) },
    {
      key: 'status', label: 'Status',
      render: (a) => <Badge label={label(a.status)} variant={a.status === 'ATIVO' ? 'success' : 'neutral'} />,
    },
    {
      key: 'actions', label: 'Ações',
      render: (a) => (
        <div className="row-actions">
          <button className="btn-sm" onClick={(e) => { e.stopPropagation(); openEdit(a); }}>Editar</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Animais" subtitle={`${totalElements} registros`}
        action={{ label: 'Novo Animal', onClick: openCreate }} />

      <div className="list-toolbar">
        <input className="list-search" placeholder="Buscar por nome ou registro..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <ButtonGroup value={statusFilter} options={STATUS_FILTER_OPTS}
          onChange={(v) => { setStatusFilter(v); setPage(0); }} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <>
          <DataTable columns={columns} data={animais}
            onRowClick={(a) => navigate(`/animais/${a.id}`)}
            emptyMessage="Nenhum animal encontrado." />
          {totalPages > 1 && (
            <div className="list-pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
              <span>Página {page + 1} de {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} title={editingId ? 'Editar Animal' : 'Novo Animal'} onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="modal__btn modal__btn--cancel" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="modal__btn modal__btn--save" onClick={save} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }>
        <SelectField label="Proprietário *" value={form.clienteId} error={errors.clienteId}
          onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
          options={clientes.map((c) => ({ value: String(c.id), label: c.nome }))} />
        <InputField label="Nome *" value={form.nome} error={errors.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })} />
        <ButtonGroupField label="Sexo" value={form.sexo} options={SEXO_OPTS} clearable
          onChange={(v) => setForm({ ...form, sexo: v })} />
        <ButtonGroupField label="Esporte" value={form.esporte} options={ESPORTE_OPTS} clearable
          onChange={(v) => setForm({ ...form, esporte: v })} />
        <FormRow>
          <InputField label="Data de Nascimento" type="date" value={form.dataNascimento} max={TODAY} error={errors.dataNascimento}
            onChange={(e) => setForm({ ...form, dataNascimento: e.target.value })} />
          <InputField label="Nº de Registro" value={form.registro}
            onChange={(e) => setForm({ ...form, registro: e.target.value })} />
        </FormRow>
        <TextareaField label="Enfermidades" value={form.enfermidades}
          onChange={(e) => setForm({ ...form, enfermidades: e.target.value })} />
        <TextareaField label="Observações" value={form.observacoes}
          onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
      </Modal>
    </div>
  );
}
