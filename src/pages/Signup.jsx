import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    toast.success('Cadastro realizado com sucesso! Faça login para continuar.');
    navigate('/login');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <img src="https://foxbit.com.br/wp-content/uploads/2024/08/Logo-Foxbit-Group.png" alt="Logo Foxbit" className="auth-logo" />
          <div className="auth-title">Criar Conta</div>
          <div className="auth-subtitle">Solicite seu acesso ao painel ACME</div>
        </div>

        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label className="form-label">Nome Completo</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="João Silva"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              placeholder="Crie uma senha forte"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-action execute btn-block">
            Cadastrar
          </button>
        </form>

        <div className="auth-footer">
          Já possui acesso? <br/>
          <Link to="/login" className="auth-link">Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
}