import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api'; // Importa a conexão

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Faz o POST para a rota do schema
      const response = await api.post('/api-token-auth/', { username, password });
      
      // Salva o token real no localStorage
      localStorage.setItem('@AcmeAuth:token', response.data.token);
      
      toast.success('Bem-vindo ao sistema ACME!');
      navigate('/');
    } catch (error) {
      console.error(error);
      // O interceptor já mostra o toast de erro geral, mas podemos colocar um fallback
      if (error.response?.status === 400) {
        toast.error('Usuário ou senha inválidos.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <img src="https://foxbit.com.br/wp-content/uploads/2024/08/Logo-Foxbit-Group.png" alt="Logo Foxbit" className="auth-logo" />
          <div className="auth-title">Bem-vindo de volta</div>
          <div className="auth-subtitle">Acesse o painel de operações ACME</div>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Usuário</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Digite seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <input 
              type="password" 
              className="form-input" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-action execute btn-block" disabled={loading}>
            {loading ? 'Autenticando...' : 'Entrar no Sistema'}
          </button>
        </form>

        <div className="auth-footer">
          Não tem uma conta de analista? <br/>
          <Link to="/signup" className="auth-link">Solicitar acesso (Cadastro)</Link>
        </div>
      </div>
    </div>
  );
}