import { useState, useEffect } from 'react';
import Header from '../components/Header';
import ExchangeModal from '../components/ExchangeModal';
import { toast } from 'react-toastify';
import api from '../services/api'; // Importação do serviço de API

export default function Settings() {
  const [profile] = useState({
    name: 'Analista Foxbit',
    email: 'analista@foxbit.com.br',
    password: '*************'
  });

  // --- Estados das Exchanges (Agora integrados com a API) ---
  const [exchanges, setExchanges] = useState([]);
  const [loadingExchanges, setLoadingExchanges] = useState(true);

  // --- Controle do Modal de Adição/Edição ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentExchange, setCurrentExchange] = useState(null);

  // --- Controle do Modal de Confirmação de Exclusão ---
  const [exchangeToDelete, setExchangeToDelete] = useState(null);

  // --- Efeito para carregar as Exchanges da API ao abrir a tela ---
  useEffect(() => {
    const fetchExchanges = async () => {
      try {
        // GET na rota fornecida no schema do backend
        const response = await api.get('/api/exchanges/');
        
        // Mapeia os resultados da paginação.
        // Como o backend atualmente só retorna "name", criamos dados complementares visuais provisórios.
        const formattedData = response.data.results.map((item, index) => ({
          id: index, // ID provisório para a iteração local
          name: item.name,
          apiKey: '****-****-****', // Campo simulado até o backend suportar
          status: 'Ativo' // Campo simulado até o backend suportar
        }));

        setExchanges(formattedData);
      } catch (error) {
        console.error("Erro ao buscar exchanges:", error);
      } finally {
        setLoadingExchanges(false);
      }
    };

    fetchExchanges();
  }, []);

  // --- Funções de Adição/Edição ---
  const openModal = (exchange = null) => {
    setCurrentExchange(exchange);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentExchange(null);
  };

  const handleSaveExchange = (formData) => {
    // ATENÇÃO: Aqui faremos apenas alteração local em memória. 
    // Quando o backend disponibilizar as rotas POST/PUT, substituiremos pela chamada API.
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

  // --- Funções de Exclusão ---
  const confirmDelete = (id) => {
    setExchangeToDelete(id);
  };

  const cancelDelete = () => {
    setExchangeToDelete(null);
  };

  const executeDelete = () => {
    // ATENÇÃO: Exclusão local em memória até a rota DELETE ser criada no backend.
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
        
      </div>

      {/* Modal de Adição/Edição (Componente Externo) */}
      <ExchangeModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveExchange}
        currentExchange={currentExchange}
      />

      {/* Modal de Confirmação de Exclusão */}
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