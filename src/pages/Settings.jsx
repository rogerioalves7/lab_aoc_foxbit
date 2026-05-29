import { useState } from 'react';
import Header from '../components/Header';
import ExchangeModal from '../components/ExchangeModal';
import { toast } from 'react-toastify';

export default function Settings() {
  const [profile] = useState({
    name: 'Analista Foxbit',
    email: 'analista@foxbit.com.br',
    password: '*************'
  });

  const [exchanges, setExchanges] = useState([
    { id: 1, name: 'Binance', apiKey: '****-****-1234', status: 'Ativo' },
    { id: 2, name: 'Coinbase', apiKey: '****-****-5678', status: 'Ativo' },
    { id: 3, name: 'Kraken', apiKey: '****-****-9012', status: 'Pausado' },
  ]);

  // --- Controle do Modal de Adição/Edição ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExchange, setCurrentExchange] = useState(null);

  // --- Controle do Modal de Confirmação de Exclusão ---
  const [exchangeToDelete, setExchangeToDelete] = useState(null);

  // Funções de Adição/Edição
  const openModal = (exchange = null) => {
    setCurrentExchange(exchange);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentExchange(null);
  };

  const handleSaveExchange = (formData) => {
    if (currentExchange) {
      setExchanges(exchanges.map(ex => 
        ex.id === currentExchange.id ? { ...ex, ...formData } : ex
      ));
      toast.success('Exchange atualizada com sucesso!');
    } else {
      const newExchange = {
        id: Date.now(),
        ...formData
      };
      setExchanges([...exchanges, newExchange]);
      toast.success('Nova exchange conectada com sucesso!');
    }
    closeModal();
  };

  // Funções de Exclusão
  const confirmDelete = (id) => {
    setExchangeToDelete(id);
  };

  const cancelDelete = () => {
    setExchangeToDelete(null);
  };

  const executeDelete = () => {
    if (exchangeToDelete) {
      setExchanges(exchanges.filter(ex => ex.id !== exchangeToDelete));
      toast.info('Conexão removida permanentemente.');
      setExchangeToDelete(null);
    }
  };

  return (
    <>
      <Header />

      <div className="top-charts-row">
        {/* Seção de Perfil */}
        <div className="section-card" style={{ flex: '0 0 35%' }}>
          <div className="section-title">Perfil da Conta</div>
          <p className="chart-subtitle" style={{ marginBottom: '20px' }}>Gerencie suas informações de acesso</p>
          
          <form onSubmit={(e) => { e.preventDefault(); toast.success('Perfil salvo com sucesso!'); }}>
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <input type="text" className="form-input" defaultValue={profile.name} />
            </div>
            
            <div className="form-group">
              <label className="form-label">E-mail de Trabalho</label>
              <input type="email" className="form-input" defaultValue={profile.email} />
            </div>

            <div className="form-group">
              <label className="form-label">Senha</label>
              <input type="password" className="form-input" defaultValue={profile.password} />
              <small style={{ color: 'var(--text-muted)', fontSize: '11px', marginTop: '5px', display: 'block' }}>
                Última alteração há 30 dias.
              </small>
            </div>

            <button type="submit" className="btn-action execute btn-block">Salvar Alterações</button>
          </form>
        </div>

        {/* Seção de Exchanges */}
        <div className="section-card">
          <div className="section-header">
            <div>
              <div className="section-title">Conexões com Exchanges</div>
              <p className="chart-subtitle">Adicione chaves de API para monitoramento externo</p>
            </div>
            <button className="btn-action execute" onClick={() => openModal()}>+ Adicionar Exchange</button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Exchange</th>
                <th>API Key (Public)</th>
                <th>Status</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {exchanges.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                    Nenhuma exchange conectada.
                  </td>
                </tr>
              ) : (
                exchanges.map((ex) => (
                  <tr key={ex.id}>
                    <td><strong>{ex.name}</strong></td>
                    <td style={{ fontFamily: 'monospace' }}>{ex.apiKey}</td>
                    <td>
                      <span className={`badge ${ex.status === 'Ativo' ? 'badge-buy' : 'badge-adjust'}`}>
                        {ex.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="btn-action review" style={{ padding: '4px 8px' }} onClick={() => openModal(ex)}>Editar</button>
                        {/* AQUI ESTÁ A MUDANÇA: Chama o confirmDelete ao invés do prompt padrão */}
                        <button className="btn-action" style={{ padding: '4px 8px', backgroundColor: 'var(--danger-red)' }} onClick={() => confirmDelete(ex.id)}>Remover</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Adição/Edição (Componente Externo) */}
      <ExchangeModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveExchange}
        currentExchange={currentExchange}
      />

      {/* NOVO: Modal de Confirmação de Exclusão */}
      {exchangeToDelete && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--danger-red)' }}>Atenção</div>
              <button className="modal-close" onClick={cancelDelete}>&times;</button>
            </div>
            
            <p style={{ fontSize: '14px', color: 'var(--text-dark)', margin: '10px 0 20px 0' }}>
              Tem certeza que deseja remover esta conexão? O sistema Foxbit Monitor perderá o acesso e você precisará configurar uma nova API Key posteriormente.
            </p>
            
            <div className="modal-footer">
              <button type="button" className="btn-action review" onClick={cancelDelete}>
                Cancelar
              </button>
              <button type="button" className="btn-action" style={{ backgroundColor: 'var(--danger-red)' }} onClick={executeDelete}>
                Sim, Remover Exchange
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}