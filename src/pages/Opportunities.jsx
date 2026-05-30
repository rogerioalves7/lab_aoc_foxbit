import { useState } from 'react';
import Header from '../components/Header';
import OrderModal from '../components/OrderModal';
import RebalanceModal from '../components/RebalanceModal';
import { toast } from 'react-toastify';

export default function Opportunities() {
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState(null);

  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);

  const openOrderModal = (market, side) => {
    setSelectedOrderData({ market, side, type: 'limit' });
    setIsOrderModalOpen(true);
  };

  const openRebalanceModal = (market, side) => {
    setRebalanceData({ market, side });
    setIsRebalanceOpen(true);
  };

  const handleExecuteOrder = (orderConfig) => {
    toast.success(`Ordem de Oportunidade enviada para ${orderConfig.market}!`);
    setIsOrderModalOpen(false);
  };

  const handleExecuteRebalance = (rebalanceConfig) => {
    console.log('Dados do Rebalanceamento:', rebalanceConfig);
    
    const campoPreenchido = rebalanceConfig.type === 'limite' 
      ? `Valor: R$ ${rebalanceConfig.price}` 
      : `Qtd: ${rebalanceConfig.quantity}`;

    toast.success(
      `Rebalanceamento de ${rebalanceConfig.side.toUpperCase()} para ${rebalanceConfig.market} executado via tipo ${rebalanceConfig.type.toUpperCase()}. (${campoPreenchido})`
    );
    setIsRebalanceOpen(false);
  };

  return (
    <>
      <Header />

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-title">Oportunidades de Arbitragem / Spread</div>
          <div className="kpi-value">14</div>
          <div className="kpi-desc" style={{ color: 'var(--tertiary-green)' }}>↑ 3 novas na última hora</div>
        </div>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div className="section-title">Oportunidades de Precificação</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mercado</th>
              <th>Tipo</th>
              <th>Ação Recomendada (ACME)</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="market-badge">BTC / USD</span></td>
              <td><span className="badge badge-adjust">Ajuste de Ask</span></td>
              <td><strong>Subir Ask para 62.145,00</strong></td>
              <td>
                <button className="btn-action execute" style={{ minWidth: '140px' }} onClick={() => openOrderModal('BTC/USD', 'venda')}>
                  Criar Ordem
                </button>
              </td>
            </tr>
            <tr>
              <td><span className="market-badge">PETE / USD</span></td>
              <td><span className="badge badge-buy">Ordem Maker (Buy)</span></td>
              <td><strong>Criar Maker Buy limit a 12,32</strong></td>
              <td>
                <button className="btn-action execute" style={{ minWidth: '140px' }} onClick={() => openOrderModal('PETE/USD', 'compra')}>
                  Criar Ordem
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <OrderModal 
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSave={handleExecuteOrder}
        initialData={selectedOrderData}
      />

      <RebalanceModal 
        isOpen={isRebalanceOpen}
        onClose={() => setIsRebalanceOpen(false)}
        onSave={handleExecuteRebalance}
        initialData={rebalanceData}
      />
    </>
  );
}