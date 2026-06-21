import { useEffect, useState } from 'react';
import {
  TrendingUp, Banknote, AlertTriangle, Warehouse,
  CircleCheck, Wrench, Users,
} from 'lucide-react';
import { HorseIcon } from '../../components/icons/HorseIcon';
import { PageHeader } from '../../components/common/PageHeader';
import api from '../../services/api';
import type { DashboardResumo } from '../../types';
import { formatCurrency } from '../../utils/format';
import './DashboardPage.css';

export function DashboardPage() {
  const [data, setData] = useState<DashboardResumo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardResumo>('/dashboard')
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  const financeiro = [
    { label: 'Total a Receber', value: formatCurrency(data?.totalAReceber), icon: TrendingUp, color: 'var(--primary)' },
    { label: 'Recebido no Mês', value: formatCurrency(data?.totalRecebidoMes), icon: Banknote, color: 'var(--secondary)' },
    { label: 'Cobranças Vencidas', value: String(data?.cobrancasVencidas ?? 0), icon: AlertTriangle, color: 'var(--error)' },
  ];

  const operacional = [
    { label: 'Animais Hospedados', value: String(data?.animaisHospedados ?? 0), icon: HorseIcon },
    { label: 'Baias Ocupadas', value: String(data?.baiasOcupadas ?? 0), icon: Warehouse },
    { label: 'Baias Livres', value: String(data?.baiasLivres ?? 0), icon: CircleCheck },
    { label: 'Baias em Manutenção', value: String(data?.baiasManutencao ?? 0), icon: Wrench },
    { label: 'Clientes Ativos', value: String(data?.totalClientes ?? 0), icon: Users },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Visão geral do rancho" />

      {loading ? (
        <p className="dashboard__loading">Carregando...</p>
      ) : (
        <>
          <h2 className="dashboard__section">Financeiro</h2>
          <div className="dashboard__grid">
            {financeiro.map((card) => {
              const Icon = card.icon;
              return (
              <div key={card.label} className="dashboard__card">
                <div className="dashboard__card-icon" style={{ background: card.color + '1A' }}>
                  <Icon size={24} color={card.color} />
                </div>
                <div>
                  <p className="dashboard__card-value">{card.value}</p>
                  <p className="dashboard__card-label">{card.label}</p>
                </div>
              </div>
              );
            })}
          </div>

          <h2 className="dashboard__section">Operacional</h2>
          <div className="dashboard__grid">
            {operacional.map((card) => {
              const Icon = card.icon;
              return (
              <div key={card.label} className="dashboard__card">
                <div className="dashboard__card-icon" style={{ background: 'var(--primary-light)' }}>
                  <Icon size={24} color="var(--primary-dark)" />
                </div>
                <div>
                  <p className="dashboard__card-value">{card.value}</p>
                  <p className="dashboard__card-label">{card.label}</p>
                </div>
              </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
