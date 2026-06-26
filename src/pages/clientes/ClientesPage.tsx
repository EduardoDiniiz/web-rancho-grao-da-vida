import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge } from '../../components/common/Badge';
import api from '../../services/api';
import type { Cliente, PageResponse } from '../../types';
import { onlyDigits } from '../../utils/masks';
import { formatCpfCnpj, formatPhone } from '../../utils/format';
import { WhatsAppIcon } from '../../components/icons/WhatsAppIcon';
import '../list.css';

// Monta o número para o link wa.me; adiciona o DDI 55 quando não houver código do país.
function waNumber(telefone: string): string {
  const d = onlyDigits(telefone);
  return d.length > 11 ? d : `55${d}`;
}

export function ClientesPage() {
  const isAdmin = localStorage.getItem('rancho_role') === 'ADMIN';
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);

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
          {c.telefone && (
            <a
              className="btn-sm"
              href={`https://wa.me/${waNumber(c.telefone)}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Conversar com ${c.nome} no WhatsApp`}
            >
              <WhatsAppIcon size={14} /> WhatsApp
            </a>
          )}
          <button className="btn-sm" onClick={() => navigate(`/clientes/${c.id}/editar`)}>Editar</button>
          {isAdmin && <button className="btn-sm btn-sm--danger" onClick={() => remove(c)}>Excluir</button>}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${totalElements} registros`}
        action={{ label: 'Novo Cliente', onClick: () => navigate('/clientes/novo') }} />

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
    </div>
  );
}
