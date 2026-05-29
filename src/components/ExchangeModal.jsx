import { useState, useEffect } from 'react';

export default function ExchangeModal({ isOpen, onClose, onSave, currentExchange }) {
  const [formData, setFormData] = useState({
    name: '',
    apiKey: '',
    status: 'Ativo'
  });

  useEffect(() => {
    if (currentExchange) {
      setFormData({
        name: currentExchange.name,
        apiKey: currentExchange.apiKey,
        status: currentExchange.status
      });
    } else {
      setFormData({ name: '', apiKey: '', status: 'Ativo' });
    }
  }, [currentExchange, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData); 
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            {currentExchange ? 'Editar Exchange' : 'Adicionar Nova Exchange'}
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nome da Exchange</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: Binance, Huobi, KuCoin..." 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">API Key (Leitura e Maker)</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Cole sua API Key aqui" 
              value={formData.apiKey}
              onChange={(e) => setFormData({...formData, apiKey: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status da Conexão</label>
            <select 
              className="form-input" 
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
            >
              <option value="Ativo">Ativo</option>
              <option value="Pausado">Pausado</option>
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-action review" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-action execute">
              {currentExchange ? 'Salvar Alterações' : 'Conectar Exchange'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}