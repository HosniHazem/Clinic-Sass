declare module '@stripe/stripe-js' {
  export function loadStripe(key?: string | null): Promise<any>;
}

declare module '@stripe/react-stripe-js' {
  import React from 'react';
  export const Elements: React.FC<any>;
  export const CardElement: React.FC<any>;
  export function useStripe(): any;
  export function useElements(): any;
}
