import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';

const MarketContext = createContext();

export const MarketProvider = ({ children }) => {
  const [tickers, setTickers] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const prevOppsRef = useRef([]);

  const fetchMarketData = async () => {
    try {
      const response = await api.get('/api/tickers/');
      
      const validTickers = (response.data.results || []).filter(t => {
        return parseFloat(t.bid_price) > 0 && parseFloat(t.ask_price) > 0;
      });

      setTickers(validTickers);

      // --- MOTOR DE DETECÇÃO ---
      const marketStats = {};
      validTickers.forEach(t => {
        const sym = t.market_symbol;
        const bid = parseFloat(t.bid_price);
        const ask = parseFloat(t.ask_price);
        const ts = t.timestamp; // Captura o Timestamp da API

        if (!marketStats[sym]) {
          marketStats[sym] = { 
            symbol: sym, 
            maxBid: bid, maxBidEx: t.exchange_name, maxBidTs: ts,
            minAsk: ask, minAskEx: t.exchange_name, minAskTs: ts
          };
        } else {
          if (bid > marketStats[sym].maxBid) { 
            marketStats[sym].maxBid = bid; 
            marketStats[sym].maxBidEx = t.exchange_name; 
            marketStats[sym].maxBidTs = ts;
          }
          if (ask < marketStats[sym].minAsk) { 
            marketStats[sym].minAsk = ask; 
            marketStats[sym].minAskEx = t.exchange_name; 
            marketStats[sym].minAskTs = ts;
          }
        }
      });

      const foundOpps = [];
      const formatPrice = (p) => p.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 });

      Object.values(marketStats).forEach(m => {
        // Pega o Timestamp mais recente entre as duas pontas da operação
        const latestTs = new Date(Math.max(new Date(m.maxBidTs), new Date(m.minAskTs)));
        const formattedTime = latestTs.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

        if (m.maxBid > m.minAsk) {
          foundOpps.push({
            id: `${m.symbol}-arb`, market: m.symbol, type: 'Arbitragem', badgeClass: 'badge-buy', 
            recommendation: `Comprar em ${m.minAskEx} a ${formatPrice(m.minAsk)} e Vender em ${m.maxBidEx} a ${formatPrice(m.maxBid)}`,
            actionSide: 'compra',
            timestamp: formattedTime // Injeta a hora na oportunidade
          });
        } else {
          const spread = m.minAsk - m.maxBid;
          const spreadPerc = (spread / m.maxBid) * 100;
          if (spreadPerc > 0.5) {
             const newBid = m.maxBid + (spread * 0.1); 
             foundOpps.push({
               id: `${m.symbol}-spread`, market: m.symbol, type: 'Spread Largo', badgeClass: 'badge-adjust', 
               recommendation: `Criar Maker Bid a ${formatPrice(newBid)} para fechar spread`,
               actionSide: 'compra',
               timestamp: formattedTime // Injeta a hora na oportunidade
             });
          }
        }
      });

      const previousIds = prevOppsRef.current;
      const newOpportunities = foundOpps.filter(opp => !previousIds.includes(opp.id));

      if (newOpportunities.length > 0 && previousIds.length > 0) {
        newOpportunities.forEach(opp => {
          toast.info(`Nova oportunidade: ${opp.type} em ${opp.market}!`, { theme: 'dark' });
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
    <MarketContext.Provider value={{ tickers, opportunities, loading }}>
      {children}
    </MarketContext.Provider>
  );
};

export const useMarket = () => useContext(MarketContext);