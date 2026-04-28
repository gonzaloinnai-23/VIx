import React, { useState, useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Activity, Calendar, RefreshCw } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function VIXTradingSimulator() {
  const [timeframe, setTimeframe] = useState('3m');
  const [vixData, setVixData] = useState({
    current: null,
    change: 0,
    changePercent: 0,
    signal: null,
    lastUpdate: new Date(),
  });

  const [spyData, setSPYData] = useState({
    current: null,
    change: 0,
    changePercent: 0,
    lastUpdate: new Date(),
  });

  const [chartData, setChartData] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [portfolio, setPortfolio] = useState({
    cash: 100000,
    positions: [],
    balance: 100000,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const chartDataRef = useRef([]);

  const THRESHOLD_BUY = 20;
  const THRESHOLD_SELL = 30;

  // Obtener datos actuales
  const fetchCurrentData = async () => {
    try {
      const [vixRes, spyRes] = await Promise.all([
        fetch('/api/vix'),
        fetch('/api/spy'),
      ]);

      const vixJson = await vixRes.json();
      const spyJson = await spyRes.json();

      if (vixJson.success && spyJson.success) {
        setVixData({
          current: parseFloat(vixJson.data.current.toFixed(2)),
          change: parseFloat(vixJson.data.change.toFixed(2)),
          changePercent: parseFloat(vixJson.data.changePercent.toFixed(2)),
          signal: generateSignal(vixJson.data.current),
          lastUpdate: new Date(),
        });

        setSPYData({
          current: parseFloat(spyJson.data.current.toFixed(2)),
          change: parseFloat(spyJson.data.change.toFixed(2)),
          changePercent: parseFloat(spyJson.data.changePercent.toFixed(2)),
          lastUpdate: new Date(),
        });

        generateOpportunities(vixJson.data.current);
      }
    } catch (err) {
      setError('Error obteniendo datos actuales');
      console.error(err);
    }
  };

  // Obtener datos históricos
  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/history?range=10y');
      const json = await res.json();

      if (json.success && json.data) {
        chartDataRef.current = json.data;
        setChartData(json.data);
        setError(null);
      }
    } catch (err) {
      setError('Error obteniendo datos históricos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateSignal = (vixValue) => {
    if (vixValue < THRESHOLD_BUY) return 'COMPRA FUERTE';
    if (vixValue < 25) return 'COMPRA MODERADA';
    if (vixValue > THRESHOLD_SELL) return 'VENTA FUERTE';
    if (vixValue > 27) return 'VENTA MODERADA';
    return null;
  };

  const generateOpportunities = (vixValue) => {
    const opps = [];

    if (vixValue < THRESHOLD_BUY) {
      opps.push({
        id: 1,
        type: 'COMPRA',
        instrument: 'SPY (S&P 500)',
        rationale: `VIX en ${vixValue.toFixed(2)} - Baja volatilidad`,
        confidence: Math.min(95, (THRESHOLD_BUY - vixValue) * 5),
      });
    }

    if (vixValue > 35) {
      opps.push({
        id: 2,
        type: 'COMPRA',
        instrument: 'Índices (pánico)',
        rationale: `VIX ${vixValue.toFixed(2)} - Oportunidad de valor`,
        confidence: Math.min(95, (vixValue - 30) * 6),
      });
    }

    if (vixValue >= 25 && vixValue <= 30) {
      opps.push({
        id: 3,
        type: 'NEUTRAL',
        instrument: 'Iron Condor',
        rationale: 'Volatilidad normal - estrategia de rango',
        confidence: 70,
      });
    }

    setOpportunities(opps);
  };

  const getFilteredData = () => {
    let daysBack = 90;
    if (timeframe === '1m') daysBack = 30;
    else if (timeframe === '1y') daysBack = 365;
    else if (timeframe === '10y') daysBack = 3650;

    const cutoff = Date.now() - (daysBack * 24 * 60 * 60 * 1000);
    return chartData.filter(item => item.timestamp >= cutoff);
  };

  const executeTradeImmediately = (opportunity) => {
    const tradeAmount = portfolio.cash * 0.1;
    if (portfolio.cash < tradeAmount) {
      alert('Capital insuficiente');
      return;
    }

    setPortfolio((prev) => ({
      ...prev,
      cash: prev.cash - tradeAmount,
      positions: [...prev.positions, { ...opportunity, amount: tradeAmount, entryTime: new Date() }],
      balance: prev.balance - tradeAmount,
    }));

    alert(`✓ Orden ejecutada: ${opportunity.type}`);
  };

  useEffect(() => {
    fetchHistoricalData();
    fetchCurrentData();
    
    // Actualizar datos actuales cada 1 hora
    const interval = setInterval(fetchCurrentData, 3600000);
    return () => clearInterval(interval);
  }, []);

  const filteredData = getFilteredData();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold flex items-center gap-2 mb-2">
            <Activity className="w-10 h-10 text-blue-400" />
            Simulador de Trading VIX + S&P 500
          </h1>
          <p className="text-slate-400">Datos en Tiempo Real | Actualización cada 1 hora</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-200 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </p>
          </div>
        )}

        {/* Main Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* VIX */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm mb-2">VIX Índice</p>
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {vixData.current !== null ? vixData.current.toFixed(2) : '—'}
            </div>
            {vixData.current !== null && (
              <div className={`flex items-center gap-2 text-sm ${vixData.change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                {vixData.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {vixData.change >= 0 ? '+' : ''}{vixData.change.toFixed(2)} ({vixData.changePercent}%)
              </div>
            )}
          </div>

          {/* SPY */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
            <p className="text-slate-400 text-sm mb-2">S&P 500 (SPY)</p>
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {spyData.current !== null ? `$${spyData.current.toFixed(2)}` : '—'}
            </div>
            {spyData.current !== null && (
              <div className={`flex items-center gap-2 text-sm ${spyData.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {spyData.change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                {spyData.change >= 0 ? '+' : ''}{spyData.change.toFixed(2)} ({spyData.changePercent}%)
              </div>
            )}
          </div>

          {/* Señal */}
          <div className={`rounded-lg p-6 border-2 ${vixData.signal?.includes('COMPRA') ? 'bg-green-900/20 border-green-500' : vixData.signal?.includes('VENTA') ? 'bg-red-900/20 border-red-500' : 'bg-slate-800 border-slate-700'}`}>
            <p className="text-slate-400 text-sm mb-2">SEÑAL</p>
            <div className={`text-2xl font-bold ${vixData.signal?.includes('COMPRA') ? 'text-green-400' : vixData.signal?.includes('VENTA') ? 'text-red-400' : 'text-slate-400'}`}>
              {vixData.signal || '—'}
            </div>
          </div>

          {/* Botón Refrescar */}
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 flex items-center justify-center">
            <button
              onClick={() => {
                fetchCurrentData();
                fetchHistoricalData();
              }}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition font-semibold"
            >
              <RefreshCw size={20} />
              Actualizar Ahora
            </button>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={20} className="text-blue-400" />
            <p className="font-semibold">Período de Datos</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            {[
              { value: '1m', label: '1 Mes' },
              { value: '3m', label: '3 Meses' },
              { value: '1y', label: '1 Año' },
              { value: '10y', label: '10 Años' },
            ].map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  timeframe === tf.value
                    ? 'bg-blue-600'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>

        {/* VIX Chart */}
        {filteredData.length > 0 && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
            <h2 className="text-xl font-semibold mb-4">📊 Índice VIX</h2>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorVix" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" interval={Math.max(0, Math.floor(filteredData.length / 10))} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Area type="monotone" dataKey="vix" stroke="#3b82f6" fill="url(#colorVix)" name="VIX" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* SPY Chart */}
        {filteredData.length > 0 && filteredData.some(d => d.spy) && (
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 mb-8">
            <h2 className="text-xl font-semibold mb-4">📈 S&P 500 (SPY)</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={filteredData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" interval={Math.max(0, Math.floor(filteredData.length / 10))} />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                <Line type="monotone" dataKey="spy" stroke="#a855f7" strokeWidth={2} name="SPY" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Loading */}
        {loading && chartData.length === 0 && (
          <div className="bg-slate-800 rounded-lg p-12 border border-slate-700 text-center">
            <Activity className="w-12 h-12 text-blue-400 mx-auto mb-4 animate-spin" />
            <p className="text-slate-300">Descargando datos...</p>
          </div>
        )}

        {/* Oportunidades */}
        {opportunities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">📈 Oportunidades</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className={`rounded-lg p-4 border-2 ${
                    opp.type === 'COMPRA'
                      ? 'border-green-500 bg-green-900/20'
                      : 'border-red-500 bg-red-900/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <p className={`font-bold ${opp.type === 'COMPRA' ? 'text-green-400' : 'text-red-400'}`}>
                      {opp.type}
                    </p>
                    <p className="text-2xl font-bold text-blue-400">{opp.confidence.toFixed(0)}%</p>
                  </div>
                  <button
                    onClick={() => executeTradeImmediately(opp)}
                    className={`w-full py-2 rounded font-semibold ${
                      opp.type === 'COMPRA'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Ejecutar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-400 mt-8">
          <p className="flex items-center gap-2">
            <AlertCircle size={16} />
            <strong>Datos Reales:</strong> Conectado a Yahoo Finance. Actualización cada 1 hora.
          </p>
        </div>
      </div>
    </div>
  );
}
