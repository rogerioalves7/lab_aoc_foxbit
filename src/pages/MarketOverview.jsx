import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import api from '../services/api'; // Conexão com o backend
import { toast } from 'react-toastify';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registra os componentes do ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      type: 'logarithmic',
      title: { display: true, text: 'USD (Log Scale)', color: '#6C757D' },
      grid: { color: '#F0F0F0' },
      ticks: {
        callback: (value) => [10, 100, 1000, 10000, 100000].includes(value) ? value.toLocaleString('pt-BR') : null
      }
    },
    x: { grid: { display: false } }
  },
  plugins: { legend: { display: false } }
};

export default function MarketOverview() {
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Estados para armazenar os dados reais da API
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState({});
  const [chartDataBid, setChartDataBid] = useState({ labels: [], datasets: [] });
  const [chartDataAsk, setChartDataAsk] = useState({ labels: [], datasets: [] });

  const toggleAccordion = (market) => {
    setExpandedRow(expandedRow === market ? null : market);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Busca os tickers mais recentes do backend
        const response = await api.get('/api/tickers/');
        const tickers = response.data.results || [];

        // 1. PROCESSAMENTO PARA A TABELA (Agrupar por market_symbol)
        const groupedMarkets = {};
        
        tickers.forEach(ticker => {
          const market = ticker.market_symbol; // Ex: 'BTC/USD'
          const bid = parseFloat(ticker.bid_price);
          const ask = parseFloat(ticker.ask_price);
          const spread = ask - bid;

          if (!groupedMarkets[market]) {
            groupedMarkets[market] = {
              symbol: market,
              bestBid: bid,
              bestAsk: ask,
              spread: spread,
              exchanges: []
            };
          }

          // Adiciona a exchange na lista deste mercado
          groupedMarkets[market].exchanges.push({
            name: ticker.exchange_name,
            bid: bid,
            ask: ask,
            spread: spread
          });

          // Atualiza o melhor bid global (maior) e melhor ask global (menor)
          if (bid > groupedMarkets[market].bestBid) groupedMarkets[market].bestBid = bid;
          if (ask < groupedMarkets[market].bestAsk) groupedMarkets[market].bestAsk = ask;
        });

        setTableData(groupedMarkets);

        // 2. PROCESSAMENTO PARA OS GRÁFICOS (Eixo X: Tempo, Eixo Y: Preços por Ativo)
        // Pega todos os timestamps únicos, converte para hora local e ordena
        const timestamps = [...new Set(tickers.map(t => t.timestamp))].sort();
        const labels = timestamps.map(ts => {
          const date = new Date(ts);
          return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        });

        // Cores fixas para os ativos principais
        const assetColors = {
          'BTC': '#007BFF',
          'ETH': '#A103DF',
          'PETE': '#FF5722'
        };

        const datasetsBid = [];
        const datasetsAsk = [];

        // Agrupa os preços baseando-se no base_asset (BTC, ETH, etc)
        const assets = [...new Set(tickers.map(t => t.base_asset))];
        
        assets.forEach((asset, index) => {
          const color = assetColors[asset] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
          
          // Mapeia os dados cronologicamente
          const dataBid = timestamps.map(ts => {
            // Acha o ticker desse ativo nesse exato timestamp
            const t = tickers.find(t => t.timestamp === ts && t.base_asset === asset);
            return t ? parseFloat(t.bid_price) : null; 
          });

          const dataAsk = timestamps.map(ts => {
            const t = tickers.find(t => t.timestamp === ts && t.base_asset === asset);
            return t ? parseFloat(t.ask_price) : null;
          });

          datasetsBid.push({ label: asset, data: dataBid, borderColor: color, tension: 0.3, pointRadius: 2, spanGaps: true });
          datasetsAsk.push({ label: asset, data: dataAsk, borderColor: color, tension: 0.3, pointRadius: 2, spanGaps: true });
        });

        setChartDataBid({ labels, datasets: datasetsBid });
        setChartDataAsk({ labels, datasets: datasetsAsk });

        // Abre o primeiro acordeão automaticamente se houver dados
        if (Object.keys(groupedMarkets).length > 0) {
          setExpandedRow(Object.keys(groupedMarkets)[0]);
        }

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <>
      <Header />
      
      <div className="top-charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">BEST BID PRICES</div>
              <div className="chart-subtitle">Comparativo Multi-Ativos (Dados da API)</div>
            </div>
          </div>
          <div className="chart-container">
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Carregando gráfico...</div>
            ) : chartDataBid.labels.length > 0 ? (
              <Line data={chartDataBid} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Sem dados suficientes</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">BEST ASK PRICES</div>
              <div className="chart-subtitle">Comparativo Multi-Ativos (Dados da API)</div>
            </div>
          </div>
          <div className="chart-container">
             {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Carregando gráfico...</div>
            ) : chartDataAsk.labels.length > 0 ? (
              <Line data={chartDataAsk} options={chartOptions} />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Sem dados suficientes</div>
            )}
          </div>
        </div>
      </div>

      <div className="accordion-section">
        <div className="accordion-title">VISÃO GERAL POR MERCADO E DISTRIBUIÇÃO EM EXCHANGES</div>
        <table className="accordion-table">
          <thead>
            <tr>
              <th className="row-icon-cell"></th>
              <th>Mercado Base</th>
              <th>Melhor Bid (Global)</th>
              <th>Melhor Ask (Global)</th>
              <th>Spread (Global)</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
               <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Buscando dados no servidor...
                </td>
              </tr>
            ) : Object.keys(tableData).length === 0 ? (
               <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  Nenhum ticker encontrado na API.
                </td>
              </tr>
            ) : (
              // Mapeia dinamicamente os mercados agrupados
              Object.values(tableData).map((market) => (
                <React.Fragment key={market.symbol}>
                  <tr className={`exchange-row ${expandedRow === market.symbol ? 'expanded' : ''}`} onClick={() => toggleAccordion(market.symbol)}>
                    <td className="row-icon-cell"><span className="arrow-icon">▼</span></td>
                    <td><span className="market-badge">{market.symbol}</span></td>
                    <td className="best-price">{market.bestBid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="best-price">{market.bestAsk.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>{market.spread.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  
                  {/* Tabela Interna (Exchanges do Mercado) */}
                  {expandedRow === market.symbol && (
                    <tr className="row-details show">
                      <td colSpan="5">
                        <div className="details-container">
                          <div className="details-title">Comparativo de Exchanges - {market.symbol}</div>
                          <table className="nested-table">
                            <thead>
                              <tr>
                                <th>Exchange</th>
                                <th>Bid Price</th>
                                <th>Ask Price</th>
                                <th>Spread Local</th>
                              </tr>
                            </thead>
                            <tbody>
                              {market.exchanges.map((ex, idx) => (
                                <tr key={idx}>
                                  <td>{ex.name}</td>
                                  <td className={ex.bid === market.bestBid ? "best-price" : ""}>
                                    {ex.bid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td className={ex.ask === market.bestAsk ? "best-price" : ""}>
                                    {ex.ask.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </td>
                                  <td>{ex.spread.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}