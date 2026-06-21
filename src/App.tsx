import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/login/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { ClientesPage } from './pages/clientes/ClientesPage';
import { AnimaisPage } from './pages/animais/AnimaisPage';
import { AnimalDetailPage } from './pages/animais/AnimalDetailPage';
import { BaiasPage } from './pages/baias/BaiasPage';
import { HospedagensPage } from './pages/hospedagens/HospedagensPage';
import { ServicosPage } from './pages/servicos/ServicosPage';
import { FinanceiroPage } from './pages/financeiro/FinanceiroPage';
import { VacinasPage } from './pages/vacinas/VacinasPage';
import { UsuariosPage } from './pages/usuarios/UsuariosPage';

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
          <Route path="/animais" element={<AnimaisPage />} />
          <Route path="/animais/:id" element={<AnimalDetailPage />} />
          <Route path="/baias" element={<BaiasPage />} />
          <Route path="/hospedagens" element={<HospedagensPage />} />
          <Route path="/servicos" element={<ServicosPage />} />
          <Route path="/financeiro" element={<FinanceiroPage />} />
          <Route path="/vacinas" element={<VacinasPage />} />
          <Route
            path="/usuarios"
            element={
              <ProtectedRoute adminOnly>
                <UsuariosPage />
              </ProtectedRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
