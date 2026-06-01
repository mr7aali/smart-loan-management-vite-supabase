declare module 'recharts' {
  import { ComponentType } from 'react';

  export interface AreaProps {
    type?: 'basis' | 'basisClosed' | 'basisOpen' | 'linear' | 'linearClosed' | 'natural' | 'monotone' | 'step' | 'stepBefore' | 'stepAfter';
    dataKey: string;
    stroke?: string;
    fill?: string;
    fillOpacity?: number;
    strokeWidth?: number;
  }

  export interface XAxisProps {
    dataKey?: string;
    type?: 'number' | 'category';
    stroke?: string;
    fontSize?: number;
    tickFormatter?: (value: any) => string;
  }

  export interface YAxisProps {
    stroke?: string;
    fontSize?: number;
    tickFormatter?: (value: any) => string;
    type?: 'number' | 'category';
    dataKey?: string;
    width?: number;
  }

  export interface TooltipProps {
    formatter?: (value: any, name: any, props: any) => [string, string];
    contentStyle?: React.CSSProperties;
  }

  export interface PieProps {
    data: any[];
    cx?: string | number;
    cy?: string | number;
    innerRadius?: number;
    outerRadius?: number;
    paddingAngle?: number;
    dataKey: string;
    label?: (props: any) => string;
    children?: React.ReactNode;
  }

  export interface CellProps {
    fill?: string;
  }

  export interface BarProps {
    dataKey: string;
    fill?: string;
    radius?: number[];
  }

  export type LegendProps = Record<string, never>;

  export interface CartesianGridProps {
    strokeDasharray?: string;
    stroke?: string;
  }

  export interface ResponsiveContainerProps {
    width?: string | number;
    height?: string | number;
    children: React.ReactElement;
  }

  export const Area: ComponentType<AreaProps>;
  export const XAxis: ComponentType<XAxisProps>;
  export const YAxis: ComponentType<YAxisProps>;
  export const Tooltip: ComponentType<TooltipProps>;
  export const Pie: ComponentType<PieProps>;
  export const Cell: ComponentType<CellProps>;
  export const Bar: ComponentType<BarProps>;
  export const BarChart: ComponentType<any>;
  export const PieChart: ComponentType<any>;
  export const AreaChart: ComponentType<any>;
  export const Legend: ComponentType<LegendProps>;
  export const CartesianGrid: ComponentType<CartesianGridProps>;
  export const ResponsiveContainer: ComponentType<ResponsiveContainerProps>;
}
