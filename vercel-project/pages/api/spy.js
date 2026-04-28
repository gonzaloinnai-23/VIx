import axios from 'axios';

const cache = {
    spyCurrent: { data: null, timestamp: 0 },
};

const CACHE_DURATION = 3600000; // 1 hora

export default async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');

  try {
        const now = Date.now();

      if (cache.spyCurrent.data && (now - cache.spyCurrent.timestamp) < CACHE_DURATION) {
              return res.status(200).json({
                        success: true,
                        data: cache.spyCurrent.data,
                        source: 'cache'
              });
      }

      // Obtener SPY actual de Yahoo Finance v8 API
      const spyResponse = await axios.get(
              'https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1d&range=1d',
        {
                  headers: {
                              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                              'Accept': 'application/json',
                              'Accept-Language': 'en-US,en;q=0.9',
                  },
                  timeout: 10000
        }
            );

      const result = spyResponse.data.chart.result[0];
        const meta = result.meta;
        const currentPrice = meta.regularMarketPrice;
        const previousClose = meta.chartPreviousClose || meta.previousClose || currentPrice;

      const spyData = {
              symbol: 'SPY',
              current: currentPrice,
              previousClose: previousClose,
              change: currentPrice - previousClose,
              changePercent: ((currentPrice - previousClose) / previousClose) * 100,
              timestamp: new Date(),
              source: 'Yahoo Finance'
      };

      cache.spyCurrent = { data: spyData, timestamp: now };

      res.status(200).json({
              success: true,
              data: spyData,
      });
  } catch (error) {
        console.error('Error fetching SPY:', error.message);
        res.status(500).json({
                success: false,
                error: 'No se pudo obtener datos de SPY',
                details: error.message
        });
  }
}
