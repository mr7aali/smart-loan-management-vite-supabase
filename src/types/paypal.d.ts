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

interface PayPalButtonsData {
  fundingSource?: PayPalFundingSource;
}

interface PayPalButtonsActions {
  disable?: () => void;
  enable?: () => void;
}

interface PayPalButtonsOptions {
  style?: PayPalButtonStyle;
  fundingSource?: PayPalFundingSource;
  createOrder: () => Promise<string> | string;
  onApprove?: (data: PayPalOrderData) => Promise<void> | void;
  onClick?: (
    data: PayPalButtonsData,
    actions: PayPalButtonsActions,
  ) => Promise<void> | void;
  onInit?: (
    data: PayPalButtonsData,
    actions: PayPalButtonsActions,
  ) => Promise<void> | void;
  onCancel?: () => void;
  onError?: (error: unknown) => void;
}

interface PayPalNamespace {
  Buttons: (options: PayPalButtonsOptions) => PayPalButtonsComponent;
}

declare global {
  type PayPalFundingSource =
    | 'paypal'
    | 'paylater'
    | 'venmo'
    | 'credit'
    | 'card';

  interface Window {
    paypal?: PayPalNamespace;
  }
}

export {};
