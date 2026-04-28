import axios from 'axios';

const cache = {
  vixCurrent: { data: null, timestamp: 0 },
  spyCurrent: { data: null, timestamp: 0 },
};

const CACHE_DURATION = 3600000; // 1 hora

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  try {
    const now = Date.now();
    
    if (cache.vixCurrent.data && (now - cache.vixCurrent.timestamp) < CACHE_DURATION) {
      return res.status(200).json({
        success: true,
        data: cache.vixCurrent.data,
        source: 'cache'
      });
    }

    // Obtener VIX actual de Yahoo Finance
    const vixResponse = await axios.get(
      'https://query1.finance.yahoo.com/v10/finance/quoteSummary/^VIX?modules=price',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 10000
      }
    );

    const price = vixResponse.data.quoteSummary.result[0].price;
    const vixData = {
      symbol: '^VIX',
      current: price.regularMarketPrice.raw,
      previousClose: price.regularMarketPreviousClose.raw,
      change: price.regularMarketPrice.raw - price.regularMarketPreviousClose.raw,
      changePercent: ((price.regularMarketPrice.raw - price.regularMarketPreviousClose.raw) / price.regularMarketPreviousClose.raw) * 100,
      timestamp: new Date(),
      source: 'Yahoo Finance'
    };

    cache.vixCurrent = { data: vixData, timestamp: now };

    res.status(200).json({
      success: true,
      data: vixData,
    });
  } catch (error) {
    console.error('Error fetching VIX:', error.message);
    res.status(500).json({
      success: false,
      error: 'No se pudo obtener datos del VIX',
      details: error.message
    });
  }
}
