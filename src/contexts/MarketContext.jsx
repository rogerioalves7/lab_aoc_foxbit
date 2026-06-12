import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // <-- IMPORTANTE: Adicionado useLocation
import api from '../services/api';
import { toast } from 'react-toastify';

const MarketContext = createContext();

export const MarketProvider = ({ children }) => {
  const [tickers, setTickers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [pendingOrder, setPendingOrder] = useState(null); 
  const navigate = useNavigate();
  const location = useLocation(); // Lemos em qual página o usuário está agora

  const prevOppsRef = useRef([]);

  const fetchMarketData = async () => {
    // 1. TRAVA DE SEGURANÇA: Se não houver token, aborta a execução silenciosamente
    const token = localStorage.getItem('@AcmeAuth:token');
    if (!token) return;

    try {
      // Para não piscar o "Carregando..." na tela inteira a cada 60s, só fazemos isso na primeira vez
      if (tickers.length === 0) setLoading(true);

      const response = await api.get('/api/tickers/');
      
      const validTickers = (response.data.results || []).filter(t => {
        return parseFloat(t.bid_price) > 0 && parseFloat(t.ask_price) > 0;
      });

      setTickers(validTickers);

      const groupedMarkets = {};
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

      Object.entries(groupedMarkets).forEach(([sym, exchanges]) => {
        if (exchanges.length < 2) return;

        let bestArb = null;
        let bestArbProfit = -Infinity;
        let bestSpreadOpp = null;
        let maxSpreadPerc = 0;

        exchanges.forEach(buyEx => { 
          exchanges.forEach(sellEx => { 
            if (buyEx.name === sellEx.name) return; 

            const profit = sellEx.bid - buyEx.ask;
            if (profit > 0 && profit > bestArbProfit) {
              bestArbProfit = profit;
              bestArb = { buyEx, sellEx, profit };
            }

            const gap = buyEx.ask - sellEx.bid;
            if (gap > 0) {
              const gapPerc = (gap / sellEx.bid) * 100;
              if (gapPerc > 0.5 && gapPerc > maxSpreadPerc) {
                maxSpreadPerc = gapPerc;
                bestSpreadOpp = { buyEx, sellEx, gap };
              }
            }
          });
        });

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

      const previousIds = prevOppsRef.current;
      const newOpportunities = foundOpps.filter(opp => !previousIds.includes(opp.id));

      // 2. DUPLA PROTEÇÃO: Garante que o toast nunca seja desenhado na rota /login
      const isPublicRoute = location.pathname === '/login' || location.pathname === '/signup';

      if (!isPublicRoute && newOpportunities.length > 0 && previousIds.length > 0) {
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
    // 3. ABORTA O LOOP NAS TELAS PÚBLICAS
    // Se o analista fizer logout ou entrar pela 1ª vez, o setInterval nem chega a existir.
    if (location.pathname === '/login' || location.pathname === '/signup') {
      return;
    }

    // Busca os dados imediatamente
    fetchMarketData();
    
    // Inicia o motor a cada 60s
    const intervalId = setInterval(fetchMarketData, 60000);
    
    // Limpa a memória se mudar de página
    return () => clearInterval(intervalId);
    
  }, [location.pathname]); // O motor destrói e recria quando o analista muda de página

  return (
    <MarketContext.Provider value={{ tickers, opportunities, loading, pendingOrder, setPendingOrder }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => useContext(MarketContext);