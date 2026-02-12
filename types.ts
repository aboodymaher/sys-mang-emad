
export type MaterialType = 'عجينة' | 'أندي';
export type MaterialSize = 18 | 24;

export interface WarehouseStock {
  type: MaterialType;
  size: MaterialSize;
  count: number;
}

export interface WarehouseLog {
  id: string;
  date: string;
  type: MaterialType;
  size: MaterialSize;
  quantity: number;
}

export interface FabricModel {
  id: string;
  name: string;
  code: string;
  length: number;
  width: number;
  sleeveLength: number;
  sleeveWidth: number;
  neckType: string;
  stockCount: number;
}

export interface ProductionEntry {
  raw: {
    type: MaterialType;
    size: MaterialSize;
    quantity: number;
  };
  produced: {
    modelId: string;
    quantity: number;
    price: number;
  };
}

export interface MachineWork {
  id: string;
  machineName: string;
  entries: ProductionEntry[];
  date: string;
}

export interface InvoiceItem {
  modelId: string;
  machineName: string; // Linked to production source
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  date: string;
  items: InvoiceItem[];
  total: number;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  invoices: Invoice[];
  payments: Payment[];
}
