import React, { useState } from 'react';
import Header from '../components/Header';
import OrderModal from '../components/OrderModal';
import RebalanceModal from '../components/RebalanceModal';
import { useMarket } from '../contexts/MarketContext';
import { toast } from 'react-toastify';

export default function Opportunities() {
  const { opportunities, loading } = useMarket(); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);

  const availableMarkets = [...new Set(opportunities.map(opp => opp.market))].sort();
  const normalizedSearch = searchTerm.toLowerCase();
  
  const filteredOpportunities = opportunities.filter(opp => 
    opp.market.toLowerCase().includes(normalizedSearch) ||
    opp.type.toLowerCase().includes(normalizedSearch)
  );

  return (
    <>
      <Header />

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-title">Oportunidades Listadas</div>
          <div className="kpi-value">{loading && opportunities.length === 0 ? '...' : filteredOpportunities.length}</div>
          <div className="kpi-desc" style={{ color: 'var(--tertiary-green)' }}>Baseado na análise atual do backend</div>
        </div>
      </div>

      <div className="section-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '18px' }}>🔍</span>
        <input 
          type="text" 
          className="form-input" 
          style={{ margin: 0, flex: '1 1 300px', backgroundColor: 'var(--bg-light)' }}
          placeholder="Digite o mercado ou tipo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select 
          className="form-input"
          style={{ margin: 0, flex: '0 0 220px', backgroundColor: 'var(--bg-light)', cursor: 'pointer' }}
          value={availableMarkets.includes(searchTerm.toUpperCase()) ? searchTerm.toUpperCase() : ""}
          onChange={(e) => setSearchTerm(e.target.value)}
        >
          <option value="">Todos os Mercados</option>
          {availableMarkets.map(market => <option key={market} value={market}>{market}</option>)}
        </select>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div className="section-title">Painel de Precificação Inteligente</div>
        </div>
        <table className="data-table">
          <thead>
            {/* Coluna de Atualização inserida */}
            <tr><th>Mercado</th><th>Tipo</th><th>Ação Recomendada</th><th>Atualização</th><th>Ação</th></tr>
          </thead>
          <tbody>
            {loading && opportunities.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Buscando oportunidades...</td></tr>
            ) : filteredOpportunities.length === 0 ? (
              <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Nenhuma oportunidade encontrada.</td></tr>
            ) : (
              filteredOpportunities.map((opp) => (
                <tr key={opp.id}>
                  <td><span className="market-badge">{opp.market}</span></td>
                  <td><span className={`badge ${opp.badgeClass}`}>{opp.type}</span></td>
                  <td><strong>{opp.recommendation}</strong></td>
                  {/* Célula renderizando a hora */}
                  <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{opp.timestamp}</td>
                  <td>
                    <button className="btn-action execute" style={{ minWidth: '140px' }} onClick={() => { setSelectedOrderData({ market: opp.market, side: opp.actionSide, type: 'limit' }); setIsOrderModalOpen(true); }}>
                      Criar Ordem
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <OrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} onSave={(config) => { toast.success('Ordem criada!'); setIsOrderModalOpen(false); }} initialData={selectedOrderData} />
      <RebalanceModal isOpen={isRebalanceOpen} onClose={() => setIsRebalanceOpen(false)} onSave={() => { toast.success('Rebalanceado!'); setIsRebalanceOpen(false); }} initialData={rebalanceData} />
    </>
  );
}