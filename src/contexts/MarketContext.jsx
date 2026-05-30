import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const MarketContext = createContext();

export const MarketProvider = ({ children }) => {
  const [tickers, setTickers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Usamos useRef para guardar as oportunidades da rodada anterior sem forçar re-render
  const prevOppsRef = useRef([]);

  const fetchMarketData = async () => {
    try {
      const response = await api.get('/api/tickers/');
      
      const validTickers = (response.data.results || []).filter(t => {
        return parseFloat(t.bid_price) > 0 && parseFloat(t.ask_price) > 0;
      });

      setTickers(validTickers);

      // --- MOTOR DE DETECÇÃO DE OPORTUNIDADES ---
      const marketStats = {};
      validTickers.forEach(t => {
        const sym = t.market_symbol;
        const bid = parseFloat(t.bid_price);
        const ask = parseFloat(t.ask_price);

        if (!marketStats[sym]) {
          marketStats[sym] = { symbol: sym, maxBid: bid, maxBidEx: t.exchange_name, minAsk: ask, minAskEx: t.exchange_name };
        } else {
          if (bid > marketStats[sym].maxBid) { marketStats[sym].maxBid = bid; marketStats[sym].maxBidEx = t.exchange_name; }
          if (ask < marketStats[sym].minAsk) { marketStats[sym].minAsk = ask; marketStats[sym].minAskEx = t.exchange_name; }
        }
      });

      const foundOpps = [];
      const formatPrice = (p) => p.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });

      Object.values(marketStats).forEach(m => {
        if (m.maxBid > m.minAsk) {
          foundOpps.push({
            id: `${m.symbol}-arb`, market: m.symbol, type: 'Arbitragem', badgeClass: 'badge-buy', 
            recommendation: `Comprar em ${m.minAskEx} a ${formatPrice(m.minAsk)} e Vender em ${m.maxBidEx} a ${formatPrice(m.maxBid)}`,
            actionSide: 'compra'
          });
        } else {
          const spread = m.minAsk - m.maxBid;
          const spreadPerc = (spread / m.maxBid) * 100;
          if (spreadPerc > 0.5) {
             const newBid = m.maxBid + (spread * 0.1); 
             foundOpps.push({
               id: `${m.symbol}-spread`, market: m.symbol, type: 'Spread Largo', badgeClass: 'badge-adjust', 
               recommendation: `Criar Maker Bid a ${formatPrice(newBid)} para fechar spread`,
               actionSide: 'compra'
             });
          }
        }
      });

      // --- SISTEMA DE NOTIFICAÇÃO GLOBAL ---
      // Compara se o ID da oportunidade nova já existia na rodada anterior
      const previousIds = prevOppsRef.current;
      const newOpportunities = foundOpps.filter(opp => !previousIds.includes(opp.id));

      if (newOpportunities.length > 0 && previousIds.length > 0) {
        newOpportunities.forEach(opp => {
          toast.info(`Nova oportunidade detectada: ${opp.type} em ${opp.market}!`, { theme: 'dark' });
        });
      }

      // Atualiza as referências e estados
      prevOppsRef.current = foundOpps.map(o => o.id);
      setOpportunities(foundOpps);

    } catch (error) {
      console.error("Erro ao sincronizar dados de mercado:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Busca imediatamente ao abrir o sistema
    fetchMarketData();

    // 2. Cria o loop infinito a cada 60 segundos (60000 ms)
    const intervalId = setInterval(fetchMarketData, 60000);

    // Limpa o loop se o usuário fechar o sistema
    return () => clearInterval(intervalId);
  }, []);

  return (
    <MarketContext.Provider value={{ tickers, opportunities, loading }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => useContext(MarketContext);