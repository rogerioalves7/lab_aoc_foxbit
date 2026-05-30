import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useMarket } from '../contexts/MarketContext';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale);

const getChartOptions = () => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      type: 'linear',
      beginAtZero: false, 
      grace: '5%',
      title: { display: true, text: 'USD (Auto-Scale)', color: '#6C757D' },
      grid: { color: '#F0F0F0' },
      ticks: { callback: (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) }
    },
    x: { grid: { display: false } }
  },
  plugins: { legend: { display: false } },
  animation: { duration: 0 } 
});

export default function MarketOverview() {
  const { tickers, loading } = useMarket();
  const [selectedMarket, setSelectedMarket] = useState('');
  
  const availableMarkets = [...new Set(tickers.map(t => t.market_symbol))].sort();

  useEffect(() => {
    if (availableMarkets.length > 0 && !selectedMarket) {
      setSelectedMarket(availableMarkets[0]);
    }
  }, [availableMarkets, selectedMarket]);

  const filteredTickers = tickers.filter(t => t.market_symbol === selectedMarket);
  
  // Processamento Tabela
  const marketStats = { bestBid: 0, bestAsk: Infinity, exchanges: [] };
  filteredTickers.forEach(t => {
    const bid = parseFloat(t.bid_price);
    const ask = parseFloat(t.ask_price);
    
    // Formata o timestamp do ticker
    const formattedTime = new Date(t.timestamp).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

    marketStats.exchanges.push({ name: t.exchange_name, bid, ask, spread: ask - bid, timestamp: formattedTime });
    if (bid > marketStats.bestBid) marketStats.bestBid = bid;
    if (ask < marketStats.bestAsk) marketStats.bestAsk = ask;
  });

  const timestamps = [...new Set(filteredTickers.map(t => t.timestamp))].sort();
  const labels = timestamps.map(ts => new Date(ts).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
  
  const bidData = timestamps.map(ts => parseFloat(filteredTickers.find(t => t.timestamp === ts)?.bid_price || 0));
  const askData = timestamps.map(ts => parseFloat(filteredTickers.find(t => t.timestamp === ts)?.ask_price || 0));

  const chartDataBid = { labels, datasets: [{ label: selectedMarket, data: bidData, borderColor: '#007BFF', pointRadius: 2, tension: 0.3 }] };
  const chartDataAsk = { labels, datasets: [{ label: selectedMarket, data: askData, borderColor: '#A103DF', pointRadius: 2, tension: 0.3 }] };

  return (
    <>
      <Header />

      <div className="section-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontSize: '18px' }}>🎯</span>
        <strong style={{ color: 'var(--text-dark)' }}>Mercado Analisado:</strong>
        <select 
          className="form-input"
          style={{ margin: 0, maxWidth: '300px', backgroundColor: 'var(--bg-light)', cursor: 'pointer', fontWeight: 'bold' }}
          value={selectedMarket}
          onChange={(e) => setSelectedMarket(e.target.value)}
        >
          {availableMarkets.length === 0 && <option value="">Aguardando dados...</option>}
          {availableMarkets.map(market => <option key={market} value={market}>{market}</option>)}
        </select>
      </div>
      
      <div className="top-charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">BEST BID PRICES</div></div>
          </div>
          <div className="chart-container">
            {loading && !selectedMarket ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Carregando gráfico...</div>
            ) : (
              <Line data={chartDataBid} options={getChartOptions()} />
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div><div className="chart-title">BEST ASK PRICES</div></div>
          </div>
          <div className="chart-container">
             {loading && !selectedMarket ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Carregando gráfico...</div>
            ) : (
              <Line data={chartDataAsk} options={getChartOptions()} />
            )}
          </div>
        </div>
      </div>

      <div className="accordion-section">
        <div className="accordion-title">DISTRIBUIÇÃO EM EXCHANGES ({selectedMarket})</div>
        <table className="accordion-table">
          <thead>
            {/* Coluna Atualização adicionada */}
            <tr><th>Exchange</th><th>Bid Price</th><th>Ask Price</th><th>Spread Local</th><th>Atualização</th></tr>
          </thead>
          <tbody>
            {loading && marketStats.exchanges.length === 0 ? (
               <tr><td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>Buscando dados no servidor...</td></tr>
            ) : marketStats.exchanges.map((ex, idx) => (
              <tr key={idx}>
                <td>{ex.name}</td>
                <td className={ex.bid === marketStats.bestBid ? "best-price" : ""}>{ex.bid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                <td className={ex.ask === marketStats.bestAsk ? "best-price" : ""}>{ex.ask.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                <td>{ex.spread.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                {/* Exibição da hora formatada */}
                <td style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{ex.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}