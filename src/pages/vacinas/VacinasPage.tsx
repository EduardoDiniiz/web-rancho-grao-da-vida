import { useEffect, useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { DataTable, type Column } from '../../components/common/DataTable';
import { Badge, type BadgeVariant } from '../../components/common/Badge';
import api from '../../services/api';
import type { Vacina } from '../../types';
import { formatDate, label } from '../../utils/format';
import '../list.css';

const variant: Record<string, BadgeVariant> = { EM_DIA: 'success', PROXIMA: 'warning', VENCIDA: 'error' };

export function VacinasPage() {
  const [vacinas, setVacinas] = useState<Vacina[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Vacina[]>('/vacinas/alertas')
      .then((res) => setVacinas(res.data))
      .finally(() => setLoading(false));
  }, []);

  const columns: Column<Vacina>[] = [
    { key: 'animalNome', label: 'Animal', render: (v) => <strong>{v.animalNome}</strong> },
    { key: 'nome', label: 'Vacina' },
    { key: 'dataAplicacao', label: 'Aplicação', render: (v) => formatDate(v.dataAplicacao) },
    { key: 'dataVencimento', label: 'Vencimento', render: (v) => formatDate(v.dataVencimento) },
    { key: 'situacao', label: 'Situação', render: (v) => <Badge label={label(v.situacao)} variant={variant[v.situacao]} /> },
  ];

  return (
    <div>
      <PageHeader title="Alertas de Vacinas" subtitle="Vacinas vencidas ou próximas do vencimento (30 dias)" />
      {loading ? <div className="list-loading">Carregando...</div> : (
        <DataTable columns={columns} data={vacinas}
          emptyMessage="Nenhum alerta de vacina no momento. 🎉" />
      )}
    </div>
  );
}
