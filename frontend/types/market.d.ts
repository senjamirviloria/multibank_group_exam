type MarketInstrument = {
  symbol: string;
  name: string;
  price: number;
  currency: string;
};

type MarketSnapshot = {
  updatedAt: string;
  instruments: MarketInstrument[];
};
