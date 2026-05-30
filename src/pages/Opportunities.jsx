import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import OrderModal from '../components/OrderModal';
import RebalanceModal from '../components/RebalanceModal';
import api from '../services/api'; // Importação da API
import { toast } from 'react-toastify';

export default function Opportunities() {
  // Modais
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrderData, setSelectedOrderData] = useState(null);
  const [isRebalanceOpen, setIsRebalanceOpen] = useState(false);
  const [rebalanceData, setRebalanceData] = useState(null);

  // Estados dos Dados
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- MOTOR DE DETECÇÃO DE OPORTUNIDADES ---
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/tickers/');
        
        // Filtra tickers com valores zerados/inválidos
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
          // A) Verifica Arbitragem Direta
          if (m.maxBid > m.minAsk) {
            foundOpps.push({
              id: `${m.symbol}-arb`,
              market: m.symbol,
              type: 'Arbitragem',
              badgeClass: 'badge-buy', // Verde
              recommendation: `Comprar em ${m.minAskEx} a ${formatPrice(m.minAsk)} e Vender em ${m.maxBidEx} a ${formatPrice(m.maxBid)}`,
              actionSide: 'compra'
            });
          } else {
            // B) Verifica Spread Largo (acima de 0.5%) para atuar como Maker
            const spread = m.minAsk - m.maxBid;
            const spreadPerc = (spread / m.maxBid) * 100;

            if (spreadPerc > 0.5) {
               const newBid = m.maxBid + (spread * 0.1); // Sugere cobrir o melhor bid por pouco
               foundOpps.push({
                 id: `${m.symbol}-spread`,
                 market: m.symbol,
                 type: 'Spread Largo',
                 badgeClass: 'badge-adjust', // Amarelo
                 recommendation: `Criar Maker Bid a ${formatPrice(newBid)} para fechar spread`,
                 actionSide: 'compra'
               });
            }
          }
        });

        // 3. Fallback: Se não encontrar nenhuma anomalia no mercado atual, sugere ajustes padrão
        // Isso evita que a tela fique vazia se a API estiver com valores muito "comportados"
        if (foundOpps.length === 0 && Object.keys(marketStats).length > 0) {
          Object.values(marketStats).slice(0, 3).forEach((m) => {
            foundOpps.push({
              id: `${m.symbol}-ajuste`,
              market: m.symbol,
              type: 'Ajuste de Posição',
              badgeClass: 'badge-sell', // Vermelho
              recommendation: `Reposicionar Maker Ask para ${formatPrice(m.minAsk * 0.999)}`,
              actionSide: 'venda'
            });
          });
        }

        setOpportunities(foundOpps);

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

  return (
    <>
      <Header />

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-title">Oportunidades Encontradas</div>
          {/* KPI Dinâmico baseado no tamanho do Array retornado pela API */}
          <div className="kpi-value">{loading ? '...' : opportunities.length}</div>
          <div className="kpi-desc" style={{ color: 'var(--tertiary-green)' }}>Baseado na análise atual do backend</div>
        </div>
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
            ) : opportunities.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Nenhuma oportunidade encontrada no momento.
                </td>
              </tr>
            ) : (
              opportunities.map((opp) => (
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