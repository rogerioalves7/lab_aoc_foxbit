import { useState, useEffect } from 'react';

export default function RebalanceModal({ isOpen, onClose, onSave, initialData }) {
  const [market, setMarket] = useState('');
  const [type, setType] = useState('mercado'); // 'mercado' ou 'limite'
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  // Sincroniza os dados sempre que o modal for aberto para um ativo específico
  useEffect(() => {
    if (initialData) {
      setMarket(initialData.market || '');
      setType('mercado'); // Reseta para mercado por padrão ao abrir
      setQuantity('');
      setPrice('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      side: initialData?.side, // 'compra' ou 'venda'
      market,
      type,
      // Envia dinamicamente apenas o campo que estava visível e preenchido
      ...(type === 'limite' ? { price: parseFloat(price.replace(',', '.')) } : { quantity: parseFloat(quantity) })
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            Rebalanceamento de Estoque — {initialData?.side === 'compra' ? 'Ordem de Compra' : 'Ordem de Venda'}
          </div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Campo: Mercado (Sempre visível) */}
          <div className="form-group">
            <label className="form-label">Nome do Mercado</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: ETH/USD"
              value={market} 
              onChange={(e) => setMarket(e.target.value)} 
              required 
            />
          </div>

          {/* Campo: Tipo (Sempre visível) */}
          <div className="form-group">
            <label className="form-label">Tipo de Ordem</label>
            <select 
              className="form-input" 
              value={type} 
              onChange={(e) => setType(e.target.value)}
            >
              <option value="mercado">Mercado</option>
              <option value="limite">Limite</option>
            </select>
          </div>

          {/* RENDEREZAÇÃO CONDICIONAL: Tipo Limite traz VALOR, Tipo Mercado traz QUANTIDADE */}
          {type === 'limite' ? (
            <div className="form-group">
              <label className="form-label">Valor / Preço (R$)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="0,00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
          ) : (
            <div className="form-group">
              <label className="form-label">Quantidade</label>
              <input 
                type="number" 
                step="any"
                className="form-input" 
                placeholder="0.00000000"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn-action review" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-action execute">Executar Ordem</button>
          </div>
        </form>
      </div>
    </div>
  );
}