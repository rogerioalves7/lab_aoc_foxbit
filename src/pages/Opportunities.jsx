import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import OrderModal from '../components/OrderModal';
import RebalanceModal from '../components/RebalanceModal';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function Opportunities() {
  // Modais
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);

  // Estados dos Dados
  const [opportunities, setOpportunities] = useState([]);
  const [availableMarkets, setAvailableMarkets] = useState([]); // Lista para o Dropdown
  const [searchTerm, setSearchTerm] = useState(''); // Estado do Filtro
  const [loading, setLoading] = useState(true);

  // --- MOTOR DE DETECÇÃO DE OPORTUNIDADES ---
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/tickers/');
        
        const tickers = (response.data.results || []).filter(t => {
          return parseFloat(t.bid_price) > 0 && parseFloat(t.ask_price) > 0;
        });

        const marketStats = {};

        // 1. Agrupa as estatísticas por mercado
        tickers.forEach(t => {
          const sym = t.market_symbol;
          const bid = parseFloat(t.bid_price);
          const ask = parseFloat(t.ask_price);

          if (!marketStats[sym]) {
            marketStats[sym] = {
              symbol: sym,
              maxBid: bid, maxBidEx: t.exchange_name,
              minAsk: ask, minAskEx: t.exchange_name,
            };
          } else {
            if (bid > marketStats[sym].maxBid) {
              marketStats[sym].maxBid = bid;
              marketStats[sym].maxBidEx = t.exchange_name;
            }
            if (ask < marketStats[sym].minAsk) {
              marketStats[sym].minAsk = ask;
              marketStats[sym].minAskEx = t.exchange_name;
            }
          }
        });

        const foundOpps = [];
        const formatPrice = (p) => p.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });

        // 2. Analisa as estatísticas buscando oportunidades
        Object.values(marketStats).forEach(m => {
          if (m.maxBid > m.minAsk) {
            foundOpps.push({
              id: `${m.symbol}-arb`,
              market: m.symbol,
              type: 'Arbitragem',
              badgeClass: 'badge-buy', 
              recommendation: `Comprar em ${m.minAskEx} a ${formatPrice(m.minAsk)} e Vender em ${m.maxBidEx} a ${formatPrice(m.maxBid)}`,
              actionSide: 'compra'
            });
          } else {
            const spread = m.minAsk - m.maxBid;
            const spreadPerc = (spread / m.maxBid) * 100;

            if (spreadPerc > 0.5) {
               const newBid = m.maxBid + (spread * 0.1); 
               foundOpps.push({
                 id: `${m.symbol}-spread`,
                 market: m.symbol,
                 type: 'Spread Largo',
                 badgeClass: 'badge-adjust', 
                 recommendation: `Criar Maker Bid a ${formatPrice(newBid)} para fechar spread`,
                 actionSide: 'compra'
               });
            }
          }
        });

        // 3. Fallback
        if (foundOpps.length === 0 && Object.keys(marketStats).length > 0) {
          Object.values(marketStats).slice(0, 3).forEach((m) => {
            foundOpps.push({
              id: `${m.symbol}-ajuste`,
              market: m.symbol,
              type: 'Ajuste de Posição',
              badgeClass: 'badge-sell',
              recommendation: `Reposicionar Maker Ask para ${formatPrice(m.minAsk * 0.999)}`,
              actionSide: 'venda'
            });
          });
        }

        setOpportunities(foundOpps);

        // 4. Extrai a lista de mercados únicos para o Dropdown (em ordem alfabética)
        const uniqueMarkets = [...new Set(foundOpps.map(opp => opp.market))].sort();
        setAvailableMarkets(uniqueMarkets);

      } catch (error) {
        console.error("Erro ao buscar oportunidades:", error);
        toast.error("Falha ao carregar oportunidades de mercado.");
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, []);

  const openOrderModal = (market, side) => {
    setSelectedOrderData({ market, side, type: 'limit' });
    setIsOrderModalOpen(true);
  };

  const handleExecuteOrder = (orderConfig) => {
    toast.success(`Ordem enviada para ${orderConfig.market} com sucesso!`);
    setIsOrderModalOpen(false);
  };

  const handleExecuteRebalance = (rebalanceConfig) => {
    const campoPreenchido = rebalanceConfig.type === 'limite' 
      ? `Valor: R$ ${rebalanceConfig.price}` 
      : `Qtd: ${rebalanceConfig.quantity}`;

    toast.success(
      `Rebalanceamento de ${rebalanceConfig.side.toUpperCase()} para ${rebalanceConfig.market} executado. (${campoPreenchido})`
    );
    setIsRebalanceOpen(false);
  };

  // --- LÓGICA DE FILTRAGEM ---
  const normalizedSearch = searchTerm.toLowerCase();
  
  // Filtra as oportunidades baseando-se no mercado ou no tipo de operação
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
          {/* KPI reflete o número de itens filtrados na tela */}
          <div className="kpi-value">{loading ? '...' : filteredOpportunities.length}</div>
          <div className="kpi-desc" style={{ color: 'var(--tertiary-green)' }}>Baseado na análise atual do backend</div>
        </div>
      </div>

      {/* --- BARRA DE FILTRO (INPUT + DROPDOWN) --- */}
      <div className="section-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '18px' }}>🔍</span>
        
        {/* Campo de Digitação Livre */}
        <input 
          type="text" 
          className="form-input" 
          style={{ margin: 0, flex: '1 1 300px', backgroundColor: 'var(--bg-light)' }}
          placeholder="Digite o mercado (Ex: BTC) ou tipo (Ex: Arbitragem)..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Lista Suspensa (Dropdown) Sincronizada */}
        <select 
          className="form-input"
          style={{ margin: 0, flex: '0 0 220px', backgroundColor: 'var(--bg-light)', cursor: 'pointer' }}
          // O select assume o valor do input caso seja um mercado válido, ou fica em "" (Todos)
          value={availableMarkets.includes(searchTerm.toUpperCase()) ? searchTerm.toUpperCase() : ""}
          onChange={(e) => setSearchTerm(e.target.value)}
        >
          <option value="">Todos os Mercados</option>
          {availableMarkets.map(market => (
            <option key={market} value={market}>{market}</option>
          ))}
        </select>
      </div>

      <div className="section-card">
        <div className="section-header">
          <div className="section-title">Painel de Precificação Inteligente</div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Mercado</th>
              <th>Tipo</th>
              <th>Ação Recomendada (Sugerida)</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Analisando mercado e buscando oportunidades...
                </td>
              </tr>
            ) : filteredOpportunities.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  {searchTerm ? `Nenhuma oportunidade encontrada para "${searchTerm}".` : "Nenhuma oportunidade encontrada no momento."}
                </td>
              </tr>
            ) : (
              filteredOpportunities.map((opp) => (
                <tr key={opp.id}>
                  <td><span className="market-badge">{opp.market}</span></td>
                  <td><span className={`badge ${opp.badgeClass}`}>{opp.type}</span></td>
                  <td><strong>{opp.recommendation}</strong></td>
                  <td>
                    <button 
                      className="btn-action execute" 
                      style={{ minWidth: '140px' }} 
                      onClick={() => openOrderModal(opp.market, opp.actionSide)}
                    >
                      Criar Ordem
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modais */}
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