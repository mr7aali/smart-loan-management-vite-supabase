interface PayPalOrderData {
  orderID: string;
}

interface PayPalButtonStyle {
  color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
  height?: number;
  label?: 'paypal' | 'checkout' | 'buynow' | 'pay';
  layout?: 'vertical' | 'horizontal';
  shape?: 'rect' | 'pill';
  tagline?: boolean;
}

interface PayPalButtonsComponent {
  isEligible?: () => boolean;
  render: (container: HTMLElement | string) => Promise<void>;
  close?: () => Promise<void> | void;
}

interface PayPalButtonsOptions {
  style?: PayPalButtonStyle;
  fundingSource?: 'paypal' | 'paylater' | 'venmo' | 'credit' | 'card';
  createOrder: () => Promise<string> | string;
  onApprove?: (data: PayPalOrderData) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

interface PayPalNamespace {
  Buttons: (options: PayPalButtonsOptions) => PayPalButtonsComponent;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

export {};
