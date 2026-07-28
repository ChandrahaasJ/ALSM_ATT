export type CityId = 'hyderabad' | 'bangalore';

export interface CityConfig {
  id: CityId;
  name: string;
  items: string[];
  price: number;
}

export const cities: Record<CityId, CityConfig> = {
  hyderabad: {
    id: 'hyderabad',
    name: 'Hyderabad',
    items: ['Biryani', 'Double Kamita'],
    price: 2300,
  },
  bangalore: {
    id: 'bangalore',
    name: 'Bangalore',
    items: ['Masala Dosa', 'Filter Coffee'],
    price: 1450,
  },
};

export function isCityId(value: string): value is CityId {
  return value in cities;
}

export function formatPrice(amount: number): string {
  return amount.toLocaleString('en-IN');
}
