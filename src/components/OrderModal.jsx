import { useState, useEffect } from 'react';

export default function OrderModal({ isOpen, onClose, onSave, initialData }) {
  const [side, setSide] = useState('compra');
  const [type, setType] = useState('limit');
  const [market, setMarket] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // O preço armazena a string formatada (ex: "1.234,12345678")
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (initialData) {
      setMarket(initialData.market || '');
      setSide(initialData.side || 'compra');
      setType(initialData.type || 'limit');
    } else {
      setSide('compra');
      setType('limit');
      setMarket('');
      setQuantity('');
      setPrice('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const isAtmExecution = type === 'market' || type === 'instant';

  // --- MÁSCARA ATM PARA 8 CASAS DECIMAIS (Cripto Padrão) ---
  const handlePriceChange = (e) => {
    // 1. Remove tudo que não for dígito
    let rawValue = e.target.value.replace(/\D/g, '');
    
    if (!rawValue) {
      setPrice('');
      return;
    }

    // 2. Garante que a string tenha pelo menos 9 caracteres (1 inteiro + 8 decimais)
    // Se o usuário digitou "1", vira "000000001"
    rawValue = rawValue.padStart(9, '0');

    // 3. Separa a parte inteira (tudo menos os últimos 8) e a parte decimal (os últimos 8)
    // O regex .replace(/^0+(?!$)/, '') remove zeros à esquerda do inteiro (ex: 005 -> 5)
    let intPart = rawValue.slice(0, -8).replace(/^0+(?!$)/, '');
    const decPart = rawValue.slice(-8);

    // 4. Formata a parte inteira com os pontos de milhar (pt-BR)
    // Ex: se intPart for "1234", vira "1.234"
    if (intPart === '') intPart = '0'; // Garante que nunca fique vazio antes da vírgula
    intPart = parseInt(intPart, 10).toLocaleString('pt-BR');

    // 5. Junta as partes com a vírgula
    setPrice(`${intPart},${decPart}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Converte de volta para número limpo na hora de salvar (ex: "1.234,12345678" -> 1234.12345678)
    const numericPrice = price 
      ? parseFloat(price.replace(/\./g, '').replace(',', '.')) 
      : 0;

    onSave({
      side,
      type,
      market,
      quantity: parseFloat(quantity),
      price: isAtmExecution ? 'A Mercado (ATM)' : numericPrice
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Boletador de Ordem — Foxbit Monitor</div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Side (Direção)</label>
            <select 
              className="form-input" 
              value={side} 
              onChange={(e) => setSide(e.target.value)}
            >
              <option value="compra">Compra</option>
              <option value="venda">Venda</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo de Ordem</label>
            <select 
              className="form-input" 
              value={type} 
              onChange={(e) => {
                setType(e.target.value);
                if (e.target.value === 'market' || e.target.value === 'instant') {
                  setPrice('');
                }
              }}
            >
              <option value="limit">Limit</option>
              <option value="market">Market</option>
              <option value="instant">Instant</option>
              <option value="stop_limit">Stop Limit</option>
              <option value="stop_market">Stop Market</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Mercado</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ex: BTC/BRL" 
              value={market} 
              onChange={(e) => setMarket(e.target.value)} 
              required 
            />
          </div>

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

          <div className="form-group">
            <label className="form-label">Preço Unitário</label>
            <input 
              type="tel"
              className="form-input" 
              placeholder={isAtmExecution ? "Preço de Mercado — Execução ATM" : "0,00000000"} 
              value={isAtmExecution ? "" : price} 
              onChange={handlePriceChange} 
              disabled={isAtmExecution} 
              required={!isAtmExecution} 
              style={{ fontFamily: 'monospace', fontSize: '15px' }} /* Ajuda a ler números longos */
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-action review" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-action execute">Enviar Ordem</button>
          </div>
        </form>
      </div>
    </div>
  );
}