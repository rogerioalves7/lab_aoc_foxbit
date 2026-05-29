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
        <div className="kpi-card orange">
          <div className="kpi-title">Alertas de Rebalanceamento</div>
          <div className="kpi-value">3</div>
          <div className="kpi-desc" style={{ color: 'var(--danger-red)' }}>Ação imediata recomendada</div>
        </div>
        <div className="kpi-card green">
          <div className="kpi-title">Ganho Potencial Estimado (24h)</div>
          <div className="kpi-value">$ 12.450,00</div>
          <div className="kpi-desc" style={{ color: 'var(--tertiary-green)' }}>Baseado na execução total</div>
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

      <div className="section-card">
        <div className="section-header">
          <div className="section-title">Rebalanceamento de Estoque</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Status do Estoque</th>
              <th>Nível Atual</th>
              <th>Recomendação</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="market-badge">ETH</span></td>
              <td style={{ width: '30%' }}>
                <div className="inventory-bar-container">
                  <div className="inventory-target" style={{ left: '50%' }}></div>
                  <div className="inventory-bar low" style={{ width: '15%' }}></div>
                </div>
              </td>
              <td style={{ color: 'var(--danger-red)', fontWeight: 'bold' }}>150 ETH (Crítico)</td>
              <td><span className="badge badge-buy">Comprar Externamente</span></td>
              <td>
                <button className="btn-action execute" style={{ minWidth: '140px' }} onClick={() => openRebalanceModal('ETH/USD', 'compra')}>
                  Executar Compra
                </button>
              </td>
            </tr>
            <tr>
              <td><span className="market-badge">BTC</span></td>
              <td style={{ width: '30%' }}>
                <div className="inventory-bar-container">
                  <div className="inventory-target" style={{ left: '50%' }}></div>
                  <div className="inventory-bar high" style={{ width: '85%' }}></div>
                </div>
              </td>
              <td style={{ color: 'var(--secondary-blue)', fontWeight: 'bold' }}>170 BTC (Excesso)</td>
              <td><span className="badge badge-sell">Despejar no Mercado</span></td>
              <td>
                <button className="btn-action execute" style={{ minWidth: '140px' }} onClick={() => openRebalanceModal('BTC/USD', 'venda')}>
                  Executar Venda
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