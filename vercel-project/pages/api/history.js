import axios from 'axios';

const cache = {
    history: { data: null, timestamp: 0, range: null },
};

const CACHE_DURATION = 86400000; // 24 horas

const RANGE_TO_INTERVAL = {
    '1mo': '1d',
    '3mo': '1d',
    '1y': '1d',
    '10y': '1wk',
};

async function fetchHistoryV8(symbol, range = '10y') {
    const interval = RANGE_TO_INTERVAL[range] || '1d';
    const encodedSymbol = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSymbol}?interval=${interval}&range=${range}`;

  const response = await axios.get(url, {
        headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
        },
        timeout: 15000,
  });

  const result = response.data.chart.result[0];
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;
    const adjCloses = result.indicators.adjclose
      ? result.indicators.adjclose[0].adjclose
          : closes;

  return timestamps.map((ts, i) => {
        const date = new Date(ts * 1000).toISOString().split('T')[0];
        return {
                date,
                timestamp: ts * 1000,
                value: adjCloses[i] ?? closes[i],
        };
  }).filter(item => item.value != null && !isNaN(item.value) && item.value > 0);
}

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');

  try {
        const range = req.query.range || '10y';
        const now = Date.now();

      if (
              cache.history.data &&
              cache.history.range === range &&
              (now - cache.history.timestamp) < CACHE_DURATION
            ) {
              return res.status(200).json({
                        success: true,
                        data: cache.history.data,
                        source: 'cache',
              });
      }

      const [vixHistory, spyHistory] = await Promise.all([
              fetchHistoryV8('^VIX', range),
              fetchHistoryV8('SPY', range),
            ]);

      // Construir mapa de SPY por fecha para lookup O(1)
      const spyMap = new Map(spyHistory.map(item => [item.date, item.value]));

      // Combinar por fecha
      const combined = vixHistory
          .map(vixItem => ({
                    date: vixItem.date,
                    timestamp: vixItem.timestamp,
                    vix: vixItem.value,
                    spy: spyMap.get(vixItem.date) || null,
          }))
          .filter(item => item.vix && item.spy);

      cache.history = { data: combined, timestamp: now, range };

      res.status(200).json({
              success: true,
              data: combined,
              count: combined.length,
      });
  } catch (error) {
        console.error('Error fetching history:', error.message);
        res.status(500).json({
                success: false,
                error: 'No se pudo obtener datos históricos',
                details: error.message,
        });
  }
}
