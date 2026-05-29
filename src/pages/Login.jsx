import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    toast.success('Bem-vindo de volta, Analista!');
    navigate('/');
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
            <label className="form-label">E-mail Corporativo</label>
            <input 
              type="email" 
              className="form-input" 
              placeholder="analista@foxbit.com.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          <button type="submit" className="btn-action execute btn-block">
            Entrar no Sistema
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