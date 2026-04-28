import axios from 'axios';

const cache = {
  history: { data: null, timestamp: 0 },
};

const CACHE_DURATION = 86400000; // 24 horas

async function fetchVIXHistory(range = '10y') {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v7/finance/download/^VIX?interval=1d&range=${range}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      }
    );

    const lines = response.data.split('\n').slice(1).filter(line => line.trim());
    return lines.map(line => {
      const [date, open, high, low, close, adjClose, volume] = line.split(',');
      return {
        date,
        timestamp: new Date(date).getTime(),
        vix: parseFloat(close),
      };
    }).filter(item => !isNaN(item.vix) && item.vix > 0);
  } catch (error) {
    console.error('Error fetching VIX history:', error.message);
    throw error;
  }
}

async function fetchSPYHistory(range = '10y') {
  try {
    const response = await axios.get(
      `https://query1.finance.yahoo.com/v7/finance/download/SPY?interval=1d&range=${range}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 15000
      }
    );

    const lines = response.data.split('\n').slice(1).filter(line => line.trim());
    return lines.map(line => {
      const [date, open, high, low, close, adjClose, volume] = line.split(',');
      return {
        date,
        timestamp: new Date(date).getTime(),
        spy: parseFloat(adjClose),
      };
    }).filter(item => !isNaN(item.spy) && item.spy > 0);
  } catch (error) {
    console.error('Error fetching SPY history:', error.message);
    throw error;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=172800');

  try {
    const range = req.query.range || '10y';
    const now = Date.now();

    if (cache.history.data && (now - cache.history.timestamp) < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        data: cache.history.data,
        source: 'cache'
      });
    }

    const [vixHistory, spyHistory] = await Promise.all([
      fetchVIXHistory(range),
      fetchSPYHistory(range),
    ]);

    // Combinar por fecha
    const combined = vixHistory.map(vixItem => {
      const spyItem = spyHistory.find(s => s.date === vixItem.date);
      return {
        date: vixItem.date,
        timestamp: vixItem.timestamp,
        vix: vixItem.vix,
        spy: spyItem?.spy || null,
      };
    }).filter(item => item.vix && item.spy);

    cache.history = { data: combined, timestamp: now };

    res.status(200).json({
      success: true,
      data: combined,
      count: combined.length,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'No se pudo obtener datos históricos',
      details: error.message
    });
  }
}
