const EXCHANGE_URL = 'https://divisascuba.vercel.app/tasas/v1/tasas.json';

export interface ExchangeRate {
  usdToCup: number;
  date: string;
}

export async function getExchangeRate(): Promise<ExchangeRate> {
  try {
    const res = await fetch(EXCHANGE_URL, {
      next: { revalidate: 3600 }, // cache 1 hora
    });
    const data = await res.json();
    return {
      usdToCup: data.eltoque.USD,
      date: data.fecha,
    };
  } catch {
    return { usdToCup: 530, date: '' }; // fallback
  }
}