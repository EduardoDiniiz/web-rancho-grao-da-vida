import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { InputField, TextareaField } from '../../components/common/InputField';
import { FormRow } from '../../components/common/FormCard';
import api from '../../services/api';
import type { Cliente, PageResponse } from '../../types';
import { maskCpfCnpj, maskPhone, onlyDigits } from '../../utils/masks';
import { formatCpfCnpj, formatPhone } from '../../utils/format';
import { required, validateCpfCnpj, validateEmail, validatePhone, fieldErrorsFromApi } from '../../utils/validators';
import '../list.css';

const EMPTY = { nome: '', cpfCnpj: '', telefone: '', email: '', endereco: '', observacoes: '' };
type Errors = Partial<Record<keyof typeof EMPTY, string>>;

export function ClientesPage() {
  const isAdmin = localStorage.getItem('rancho_role') === 'ADMIN';
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, [page, search]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<PageResponse<Cliente>>('/clientes', {
        params: { page, search: search || undefined, size: 15 },
      });
      setClientes(res.data.content);
      setTotalPages(res.data.totalPages);
      setTotalElements(res.data.totalElements);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(c: Cliente) {
    setEditingId(c.id);
    setForm({
      nome: c.nome, cpfCnpj: maskCpfCnpj(c.cpfCnpj ?? ''), telefone: maskPhone(c.telefone ?? ''),
      email: c.email ?? '', endereco: c.endereco ?? '', observacoes: c.observacoes ?? '',
    });
    setErrors({});
    setModalOpen(true);
  }

  function validate(): boolean {
    const e: Errors = {
      nome: required(form.nome, 'Nome'),
      cpfCnpj: validateCpfCnpj(form.cpfCnpj),
      telefone: validatePhone(form.telefone),
      email: validateEmail(form.email),
    };
    Object.keys(e).forEach((k) => e[k as keyof Errors] === undefined && delete e[k as keyof Errors]);
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      // CPF/CNPJ e telefone trafegam e sao persistidos apenas com digitos
      const payload = { ...form, cpfCnpj: onlyDigits(form.cpfCnpj), telefone: onlyDigits(form.telefone) };
      if (editingId) await api.put(`/clientes/${editingId}`, payload);
      else await api.post('/clientes', payload);
      setModalOpen(false);
      load();
    } catch (err: any) {
      const apiErrors = fieldErrorsFromApi(err);
      if (Object.keys(apiErrors).length) setErrors(apiErrors);
      else alert(err.response?.data?.message ?? 'Erro ao salvar cliente.');
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: Cliente) {
    if (!window.confirm(`Excluir o cliente "${c.nome}"?`)) return;
    try {
      await api.delete(`/clientes/${c.id}`);
      load();
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Erro ao excluir cliente.');
    }
  }

  const columns: Column<Cliente>[] = [
    { key: 'nome', label: 'Nome', render: (c) => <strong>{c.nome}</strong> },
    { key: 'cpfCnpj', label: 'CPF/CNPJ', render: (c) => formatCpfCnpj(c.cpfCnpj) },
    { key: 'telefone', label: 'Telefone', render: (c) => formatPhone(c.telefone) },
    { key: 'totalAnimais', label: 'Animais', render: (c) => <Badge label={String(c.totalAnimais)} variant="info" /> },
    {
      key: 'actions', label: 'Ações',
      render: (c) => (
        <div className="row-actions">
          <button className="btn-sm" onClick={() => openEdit(c)}>Editar</button>
          {isAdmin && <button className="btn-sm btn-sm--danger" onClick={() => remove(c)}>Excluir</button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${totalElements} registros`}
        action={{ label: 'Novo Cliente', onClick: openCreate }} />

      <div className="list-toolbar">
        <input className="list-search" placeholder="Buscar por nome, CPF/CNPJ ou telefone..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
      </div>

      {loading ? <div className="list-loading">Carregando...</div> : (
        <>
          <DataTable columns={columns} data={clientes} emptyMessage="Nenhum cliente encontrado." />
          {totalPages > 1 && (
            <div className="list-pagination">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
              <span>Página {page + 1} de {totalPages}</span>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>Próxima</button>
            </div>
          )}
        </>
      )}

      <Modal open={modalOpen} title={editingId ? 'Editar Cliente' : 'Novo Cliente'} onClose={() => setModalOpen(false)}
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
        <FormRow>
          <InputField label="CPF/CNPJ" value={form.cpfCnpj} error={errors.cpfCnpj} inputMode="numeric"
            placeholder="000.000.000-00" maxLength={18}
            onChange={(e) => setForm({ ...form, cpfCnpj: maskCpfCnpj(e.target.value) })} />
          <InputField label="Telefone" value={form.telefone} error={errors.telefone} inputMode="numeric"
            placeholder="(00) 00000-0000" maxLength={15}
            onChange={(e) => setForm({ ...form, telefone: maskPhone(e.target.value) })} />
        </FormRow>
        <InputField label="E-mail" type="email" value={form.email} error={errors.email}
          placeholder="email@exemplo.com" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <InputField label="Endereço" value={form.endereco} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
        <TextareaField label="Observações" value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
      </Modal>
    </div>
  );
}
