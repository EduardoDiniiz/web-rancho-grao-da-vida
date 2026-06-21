import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Cross } from 'lucide-react';
import api from '../../services/api';
import type { AuthResponse } from '../../types';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>('/auth/login', { login, password });
      localStorage.setItem('rancho_token', res.data.token);
      localStorage.setItem('rancho_role', res.data.role);
      localStorage.setItem('rancho_name', res.data.name);
      navigate('/');
    } catch {
      setError('Usuário ou senha incorretos.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__header">
          <div className="login-card__logo"><Cross size={32} color="var(--primary)" /></div>
          <h1 className="login-card__title">Grão da Vida</h1>
          <p className="login-card__subtitle">Gestão de Baias para Cavalos</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          {error && <div className="login-card__error">{error}</div>}

          <div className="login-card__field">
            <label>Usuário ou e-mail</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="usuário ou e-mail"
              autoComplete="username"
              required
            />
          </div>

          <div className="login-card__field">
            <label>Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="login-card__btn" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
