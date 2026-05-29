import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();
  const isOverview = location.pathname === '/';
  const isOpportunities = location.pathname === '/opportunities';
  const isSettings = location.pathname === '/settings';

  return (
    <header>
      <div className="logo-container">
        <img src="https://foxbit.com.br/wp-content/uploads/2024/08/Logo-Foxbit-Group.png" alt="Logo Foxbit" className="main-logo" />
        <div className="logo-subtitle">
          {isOverview && 'Visão Geral de Mercado'}
          {isOpportunities && 'Painel de Oportunidades - ACME'}
          {isSettings && 'Configurações do Sistema'}
        </div>
      </div>
      <div className="header-buttons">
        <Link to="/" className="btn-outline"><span>📊</span> Visão Gráficos</Link>
        <Link to="/opportunities" className="btn-outline"><span>💡</span> Oportunidades</Link>
        <Link to="/settings" className={`btn-outline ${isSettings ? 'active' : ''}`} style={isSettings ? {backgroundColor: '#f1f3f5'} : {}}>
          <span>⚙️</span> Configurar
        </Link>
        <Link to="/login" className="btn-outline"><span>&#x21B3;</span> Logout</Link>
      </div>
    </header>
  );
}