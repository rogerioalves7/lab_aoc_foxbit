import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const MarketContext = createContext();

export const MarketProvider = ({ children }) => {
  const [tickers, setTickers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [pendingOrder, setPendingOrder] = useState(null); 
  const navigate = useNavigate();

  const prevOppsRef = useRef([]);

  const fetchMarketData = async () => {
    try {
      const response = await api.get('/api/tickers/');
      
      const validTickers = (response.data.results || []).filter(t => {
        return parseFloat(t.bid_price) > 0 && parseFloat(t.ask_price) > 0;
      });

      setTickers(validTickers);

      // --- NOVO MOTOR DE DETECÇÃO (Prevenindo Operações Circulares) ---
      const groupedMarkets = {};
      
      // 1. Agrupamos todos os dados por mercado para ter uma lista das corretoras em cada moeda
      validTickers.forEach(t => {
        const sym = t.market_symbol;
        if (!groupedMarkets[sym]) groupedMarkets[sym] = [];
        
        groupedMarkets[sym].push({
          name: t.exchange_name,
          bid: parseFloat(t.bid_price),
          ask: parseFloat(t.ask_price),
          ts: t.timestamp
        });
      });

      const foundOpps = [];
      const formatPrice = (p) => p.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });

      // 2. Analisamos os cruzamentos de corretoras
      Object.entries(groupedMarkets).forEach(([sym, exchanges]) => {
        // Só faz sentido buscar oportunidade "Cross-Exchange" se houver pelo menos 2 corretoras reportando preços
        if (exchanges.length < 2) return;

        let bestArb = null;
        let bestArbProfit = -Infinity;

        let bestSpreadOpp = null;
        let maxSpreadPerc = 0;

        // Cruzamos todas as corretoras contra todas as corretoras
        exchanges.forEach(buyEx => { // buyEx é onde nós COMPRAMOS (olhamos o Ask deles)
          exchanges.forEach(sellEx => { // sellEx é onde nós VENDEMOS (olhamos o Bid deles)
            
            // REGRA VITAL: Impede operações na mesma corretora (Foxbit x Foxbit, Binance x Binance)
            if (buyEx.name === sellEx.name) return; 

            // A) Arbitragem Direta: Conseguimos vender mais caro do que compramos na outra ponta?
            const profit = sellEx.bid - buyEx.ask;
            if (profit > 0 && profit > bestArbProfit) {
              bestArbProfit = profit;
              bestArb = { buyEx, sellEx, profit };
            }

            // B) Spread Largo: Se não há arbitragem, qual a maior distância entre Ask e Bid?
            const gap = buyEx.ask - sellEx.bid;
            if (gap > 0) {
              const gapPerc = (gap / sellEx.bid) * 100;
              // Se a distância entre a corretora A e B for maior que 0.5%, é uma chance de atuar como Maker no meio
              if (gapPerc > 0.5 && gapPerc > maxSpreadPerc) {
                maxSpreadPerc = gapPerc;
                bestSpreadOpp = { buyEx, sellEx, gap };
              }
            }
          });
        });

        // 3. Cadastra as oportunidades encontradas na ordem de prioridade
        if (bestArb) {
          const { buyEx, sellEx } = bestArb;
          const latestTs = new Date(Math.max(new Date(buyEx.ts), new Date(sellEx.ts)));
          const formattedTime = latestTs.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

          foundOpps.push({
            id: `${sym}-arb`, market: sym, type: 'Arbitragem', badgeClass: 'badge-buy', 
            recommendation: `Comprar em ${buyEx.name} a ${formatPrice(buyEx.ask)} e Vender em ${sellEx.name} a ${formatPrice(sellEx.bid)}`,
            actionSide: 'compra', timestamp: formattedTime 
          });
        } 
        else if (bestSpreadOpp) {
          const { buyEx, sellEx, gap } = bestSpreadOpp;
          const latestTs = new Date(Math.max(new Date(buyEx.ts), new Date(sellEx.ts)));
          const formattedTime = latestTs.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

          const newBid = sellEx.bid + (gap * 0.1); 
          foundOpps.push({
            id: `${sym}-spread`, market: sym, type: 'Spread Largo', badgeClass: 'badge-adjust', 
            recommendation: `Criar Maker Bid a ${formatPrice(newBid)} para fechar spread entre ${sellEx.name} e ${buyEx.name}`,
            actionSide: 'compra', timestamp: formattedTime 
          });
        }
      });

      // Fallback para não deixar a tela vazia caso o mercado esteja perfeitamente alinhado sem spreads
      if (foundOpps.length === 0 && Object.keys(groupedMarkets).length > 0) {
        Object.entries(groupedMarkets).slice(0, 3).forEach(([sym, exchanges]) => {
          const ex = exchanges[0];
          const formattedTime = new Date(ex.ts).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
          foundOpps.push({
            id: `${sym}-ajuste`, market: sym, type: 'Ajuste de Posição', badgeClass: 'badge-sell', 
            recommendation: `Reposicionar Maker Ask em ${ex.name} para ${formatPrice(ex.ask * 0.999)}`,
            actionSide: 'venda', timestamp: formattedTime 
          });
        });
      }

      // --- SISTEMA DE NOTIFICAÇÕES GLOBAL ---
      const previousIds = prevOppsRef.current;
      const newOpportunities = foundOpps.filter(opp => !previousIds.includes(opp.id));

      if (newOpportunities.length > 0 && previousIds.length > 0) {
        newOpportunities.forEach(opp => {
          toast.info(`🎯 Nova oportunidade: ${opp.type} em ${opp.market}! Clique para operar.`, { 
            theme: 'dark',
            style: { cursor: 'pointer' },
            onClick: () => {
              setPendingOrder({ market: opp.market, side: opp.actionSide });
              navigate('/opportunities');
            }
          });
        });
      }

      prevOppsRef.current = foundOpps.map(o => o.id);
      setOpportunities(foundOpps);

    } catch (error) {
      console.error("Erro ao sincronizar dados de mercado:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const intervalId = setInterval(fetchMarketData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <MarketContext.Provider value={{ tickers, opportunities, loading, pendingOrder, setPendingOrder }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => useContext(MarketContext);