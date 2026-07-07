const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  });
  
  export function money(amount: number): string {
    return usd.format(amount);
  }
  
  /** "$9.99/mo" for subscription pricing, "$27.98" otherwise. */
  export function price(amount: number, per?: 'mo'): string {
    return per ? `${usd.format(amount)}/${per}` : usd.format(amount);
  }
  