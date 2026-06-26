import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ClientesPage } from './pages/clientes/ClientesPage';
import { ClienteFormPage } from './pages/clientes/ClienteFormPage';
import { AnimaisPage } from './pages/animais/AnimaisPage';
import { AnimalFormPage } from './pages/animais/AnimalFormPage';
import { AnimalDetailPage } from './pages/animais/AnimalDetailPage';
import { VacinaFormPage } from './pages/animais/VacinaFormPage';
import { ContratoFormPage } from './pages/animais/ContratoFormPage';
import { ExameFormPage } from './pages/animais/ExameFormPage';
import { BaiasPage } from './pages/baias/BaiasPage';
import { BaiaFormPage } from './pages/baias/BaiaFormPage';
import { HospedagensPage } from './pages/hospedagens/HospedagensPage';
import { HospedagemFormPage } from './pages/hospedagens/HospedagemFormPage';
import { ServicosPage } from './pages/servicos/ServicosPage';
import { ServicoFormPage } from './pages/servicos/ServicoFormPage';
import { FinanceiroPage } from './pages/financeiro/FinanceiroPage';
import { CobrancaAvulsaPage } from './pages/financeiro/CobrancaAvulsaPage';
import { BaixaPage } from './pages/financeiro/BaixaPage';
import { VacinasPage } from './pages/vacinas/VacinasPage';
import { DispositivosPage } from './pages/dispositivos/DispositivosPage';
import { DispositivoNomePage } from './pages/dispositivos/DispositivoNomePage';
import { DispositivoAgendamentoPage } from './pages/dispositivos/DispositivoAgendamentoPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';
import { UsuarioFormPage } from './pages/usuarios/UsuarioFormPage';

function ProtectedRoute({ children, adminOnly }: { children: ReactNode; adminOnly?: boolean }) {
  const token = localStorage.getItem('rancho_token');
  const role = localStorage.getItem('rancho_role');
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && role !== 'ADMIN') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/clientes/novo" element={<ClienteFormPage />} />
          <Route path="/clientes/:id/editar" element={<ClienteFormPage />} />
          <Route path="/animais" element={<AnimaisPage />} />
          <Route path="/animais/novo" element={<AnimalFormPage />} />
          <Route path="/animais/:id/editar" element={<AnimalFormPage />} />
          <Route path="/animais/:id/vacinas/nova" element={<VacinaFormPage />} />
          <Route path="/animais/:id/contratos/novo" element={<ContratoFormPage />} />
          <Route path="/animais/:id/exames/novo" element={<ExameFormPage />} />
          <Route path="/animais/:id" element={<AnimalDetailPage />} />
          <Route path="/baias" element={<BaiasPage />} />
          <Route path="/baias/novo" element={<BaiaFormPage />} />
          <Route path="/baias/:id/editar" element={<BaiaFormPage />} />
          <Route path="/hospedagens" element={<HospedagensPage />} />
          <Route path="/hospedagens/nova" element={<HospedagemFormPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/servicos/novo" element={<ServicoFormPage />} />
          <Route path="/servicos/:id/editar" element={<ServicoFormPage />} />
          <Route path="/financeiro" element={<FinanceiroPage />} />
          <Route path="/financeiro/avulsa" element={<CobrancaAvulsaPage />} />
          <Route path="/financeiro/:id/baixa" element={<BaixaPage />} />
          <Route path="/vacinas" element={<VacinasPage />} />
          <Route path="/dispositivos" element={<DispositivosPage />} />
          <Route path="/dispositivos/:id/nome" element={<DispositivoNomePage />} />
          <Route path="/dispositivos/:id/agendamento" element={<DispositivoAgendamentoPage />} />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute adminOnly>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/novo"
            element={
              <ProtectedRoute adminOnly>
                <UsuarioFormPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/usuarios/:id/editar"
            element={
              <ProtectedRoute adminOnly>
                <UsuarioFormPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
