import { useState } from 'react';
import Header from '../components/Header';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale } from 'chart.js';
import { Line } from 'react-chartjs-2';

// Registra os componentes do ChartJS
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, LogarithmicScale);

// Função geradora de dados
const generateAssetData = (numPoints, basePrice, volatility) => {
  let currentPrice = basePrice;
  let data = [currentPrice];
  for (let i = 1; i < numPoints; i++) {
    let movement = (Math.random() - 0.5) * 2 * volatility;
    currentPrice += movement;
    currentPrice = Math.max(0.01, currentPrice);
    data.push(Number(currentPrice.toFixed(2)));
  }
  return data;
};

// Dados Fixos
const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
const btcBidData = generateAssetData(timeLabels.length, 62100, 500);
const ethBidData = generateAssetData(timeLabels.length, 3400, 50);
const peteBidData = generateAssetData(timeLabels.length, 12.50, 0.5);

const btcAskData = btcBidData.map(val => val + 2.5);
const ethAskData = ethBidData.map(val => val + 0.8);
const peteAskData = peteBidData.map(val => val + 0.03);

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
  // Estado para controlar qual acordeão está aberto
  const [expandedRow, setExpandedRow] = useState('btc');

  const toggleAccordion = (market) => {
    setExpandedRow(expandedRow === market ? null : market);
  };

  const bidData = {
    labels: timeLabels,
    datasets: [
      { label: 'BTC', data: btcBidData, borderColor: '#007BFF', tension: 0.3, pointRadius: 2 },
      { label: 'ETH', data: ethBidData, borderColor: '#A103DF', tension: 0.3, pointRadius: 2 },
      { label: 'PETE', data: peteBidData, borderColor: '#FF5722', tension: 0.3, pointRadius: 2 }
    ]
  };

  const askData = {
    labels: timeLabels,
    datasets: [
      { label: 'BTC', data: btcAskData, borderColor: '#007BFF', tension: 0.3, pointRadius: 2 },
      { label: 'ETH', data: ethAskData, borderColor: '#A103DF', tension: 0.3, pointRadius: 2 },
      { label: 'PETE', data: peteAskData, borderColor: '#FF5722', tension: 0.3, pointRadius: 2 }
    ]
  };

  return (
    <>
      <Header />
      
      <div className="top-charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">BEST BID PRICES</div>
              <div className="chart-subtitle">Comparativo Multi-Ativos</div>
            </div>
          </div>
          <div className="chart-container">
            <Line data={bidData} options={chartOptions} />
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-title">BEST ASK PRICES</div>
              <div className="chart-subtitle">Comparativo Multi-Ativos</div>
            </div>
          </div>
          <div className="chart-container">
            <Line data={askData} options={chartOptions} />
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
              <th>Melhor Bid</th>
              <th>Melhor Ask</th>
              <th>Spread</th>
            </tr>
          </thead>
          <tbody>
            {/* Linha BTC */}
            <tr className={`exchange-row ${expandedRow === 'btc' ? 'expanded' : ''}`} onClick={() => toggleAccordion('btc')}>
              <td className="row-icon-cell"><span className="arrow-icon">▼</span></td>
              <td><span className="market-badge">BTC / USD</span></td>
              <td className="best-price">62.150,00</td>
              <td className="best-price">62.151,50</td>
              <td>1,50 USD</td>
            </tr>
            {expandedRow === 'btc' && (
              <tr className="row-details show">
                <td colSpan="5">
                  <div className="details-container">
                    <div className="details-title">Comparativo de Exchanges - BTC/USD</div>
                    <table className="nested-table">
                      <thead>
                        <tr><th>Exchange</th><th>Bid Price</th><th>Ask Price</th><th>Spread Local</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>Binance</td><td className="best-price">62.150,00</td><td>62.152,00</td><td>2,00</td></tr>
                        <tr><td>Coinbase</td><td>62.148,50</td><td className="best-price">62.151,50</td><td>3,00</td></tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            )}

            {/* Linha ETH */}
            <tr className={`exchange-row ${expandedRow === 'eth' ? 'expanded' : ''}`} onClick={() => toggleAccordion('eth')}>
              <td className="row-icon-cell"><span className="arrow-icon">▼</span></td>
              <td><span className="market-badge">ETH / USD</span></td>
              <td className="best-price">3.405,20</td>
              <td className="best-price">3.406,00</td>
              <td>0,80 USD</td>
            </tr>
            {expandedRow === 'eth' && (
              <tr className="row-details show">
                <td colSpan="5">
                  <div className="details-container">
                    <div className="details-title">Comparativo de Exchanges - ETH/USD</div>
                    <table className="nested-table">
                      <thead>
                        <tr><th>Exchange</th><th>Bid Price</th><th>Ask Price</th><th>Spread Local</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>Binance</td><td>3.404,50</td><td>3.406,50</td><td>2,00</td></tr>
                        <tr><td>Coinbase</td><td className="best-price">3.405,20</td><td className="best-price">3.406,00</td><td>0,80</td></tr>
                      </tbody>
                    </table>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}