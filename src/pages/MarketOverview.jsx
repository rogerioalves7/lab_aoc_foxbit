import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import api from '../services/api';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale);

const getChartOptions = (datasets) => {
  const isSingleAsset = datasets.length === 1;

  return {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: isSingleAsset ? 'linear' : 'logarithmic',
        beginAtZero: false, 
        grace: isSingleAsset ? '5%' : '0%',
        title: { 
          display: true, 
          text: isSingleAsset ? 'USD (Auto-Scale)' : 'USD (Log Scale)', 
          color: '#6C757D' 
        },
        grid: { color: '#F0F0F0' },
        ticks: isSingleAsset 
          ? { callback: (value) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 }) }
          : { callback: (value) => [0.0001, 0.01, 1, 10, 100, 1000, 10000, 100000].includes(value) ? value.toLocaleString('pt-BR') : null }
      },
      x: { grid: { display: false } }
    },
    plugins: { 
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 8 
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    animation: { duration: 0 } 
  };
};

export default function MarketOverview() {
  const [expandedRow, setExpandedRow] = useState(null);
  
  // --- Estados do Filtro (Texto + Lista Suspensa) ---
  const [searchTerm, setSearchTerm] = useState('');
  const [availableMarkets, setAvailableMarkets] = useState([]); // Array para preencher o Dropdown

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
        const response = await api.get('/api/tickers/');
        
        const tickers = (response.data.results || []).filter(t => {
          const bid = parseFloat(t.bid_price);
          const ask = parseFloat(t.ask_price);
          return bid > 0 && ask > 0;
        });

        const groupedMarkets = {};
        
        tickers.forEach(ticker => {
          const market = ticker.market_symbol;
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

          groupedMarkets[market].exchanges.push({
            name: ticker.exchange_name,
            bid: bid,
            ask: ask,
            spread: spread
          });

          if (bid > groupedMarkets[market].bestBid) groupedMarkets[market].bestBid = bid;
          if (ask < groupedMarkets[market].bestAsk) groupedMarkets[market].bestAsk = ask;
        });

        setTableData(groupedMarkets);

        // --- NOVO: Extrai e ordena os mercados reais da API para o Dropdown ---
        const uniqueMarkets = Object.keys(groupedMarkets).sort();
        setAvailableMarkets(uniqueMarkets);

        const timestamps = [...new Set(tickers.map(t => t.timestamp))].sort();
        const labels = timestamps.map(ts => {
          const date = new Date(ts);
          return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        });

        const assetColors = {
          'BTC': '#007BFF',
          'ETH': '#A103DF',
          'PETE': '#FF5722'
        };

        const datasetsBid = [];
        const datasetsAsk = [];

        const assets = [...new Set(tickers.map(t => t.base_asset))];
        
        assets.forEach((asset) => {
          const color = assetColors[asset] || `#${Math.floor(Math.random()*16777215).toString(16)}`;
          
          const dataBid = timestamps.map(ts => {
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

  // --- LÓGICA DE FILTRAGEM ---
  const normalizedSearch = searchTerm.toLowerCase();

  const filteredTableData = Object.values(tableData).filter(market => 
    market.symbol.toLowerCase().includes(normalizedSearch)
  );

  const filteredChartBid = {
    ...chartDataBid,
    datasets: chartDataBid.datasets?.filter(ds => ds.label.toLowerCase().includes(normalizedSearch) || normalizedSearch.includes(ds.label.toLowerCase())) || []
  };

  const filteredChartAsk = {
    ...chartDataAsk,
    datasets: chartDataAsk.datasets?.filter(ds => ds.label.toLowerCase().includes(normalizedSearch) || normalizedSearch.includes(ds.label.toLowerCase())) || []
  };

  const isSingleBid = filteredChartBid.datasets.length === 1;
  const isSingleAsk = filteredChartAsk.datasets.length === 1;

  // Verifica se o termo digitado bate exatamente com algum mercado para sincronizar o select
  const currentSelectValue = availableMarkets.find(m => m.toLowerCase() === searchTerm.toLowerCase()) || "";

  return (
    <>
      <Header />

      {/* --- NOVA BARRA DE FILTRO INTEGRADA (INPUT + DROPDOWN) --- */}
      <div className="section-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '18px' }}>🔍</span>
        
        {/* Campo de Texto */}
        <input 
          type="text" 
          className="form-input" 
          style={{ margin: 0, flex: '1 1 300px', backgroundColor: 'var(--bg-light)' }}
          placeholder="Filtrar por ativo ou mercado (Ex: BTC, ETH...)" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        {/* Lista Suspensa Sincronizada */}
        <select 
          className="form-input"
          style={{ margin: 0, flex: '0 0 220px', backgroundColor: 'var(--bg-light)', cursor: 'pointer' }}
          value={currentSelectValue}
          onChange={(e) => setSearchTerm(e.target.value)}
        >
          <option value="">Todos os Mercados</option>
          {availableMarkets.map(market => (
            <option key={market} value={market}>{market}</option>
          ))}
        </select>
      </div>
      
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
            ) : filteredChartBid.datasets.length > 0 ? (
              <Line 
                key={isSingleBid ? 'bid-linear' : 'bid-log'} 
                data={filteredChartBid} 
                options={getChartOptions(filteredChartBid.datasets)} 
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Nenhum ativo corresponde ao filtro</div>
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
            ) : filteredChartAsk.datasets.length > 0 ? (
              <Line 
                key={isSingleAsk ? 'ask-linear' : 'ask-log'} 
                data={filteredChartAsk} 
                options={getChartOptions(filteredChartAsk.datasets)} 
              />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>Nenhum ativo corresponde ao filtro</div>
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
            ) : filteredTableData.length === 0 ? (
               <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  {searchTerm ? `Nenhum mercado encontrado para "${searchTerm}".` : "Nenhum ticker ativo retornado pela API."}
                </td>
              </tr>
            ) : (
              filteredTableData.map((market) => (
                <React.Fragment key={market.symbol}>
                  <tr className={`exchange-row ${expandedRow === market.symbol ? 'expanded' : ''}`} onClick={() => toggleAccordion(market.symbol)}>
                    <td className="row-icon-cell"><span className="arrow-icon">▼</span></td>
                    <td><span className="market-badge">{market.symbol}</span></td>
                    <td className="best-price">{market.bestBid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                    <td className="best-price">{market.bestAsk.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                    <td>{market.spread.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
                  </tr>
                  
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
                                    {ex.bid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                  </td>
                                  <td className={ex.ask === market.bestAsk ? "best-price" : ""}>
                                    {ex.ask.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}
                                  </td>
                                  <td>{ex.spread.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })}</td>
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