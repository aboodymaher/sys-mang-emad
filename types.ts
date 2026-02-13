
export type MaterialType = 'عجينة' | 'أندي';
export type MaterialSize = 18 | 24;

export interface WarehouseStock {
  type: MaterialType;
  size: MaterialSize;
  color: string;
  count: number;
}

export interface WarehouseLog {
  id: string;
  date: string;
  type: MaterialType;
  size: MaterialSize;
  color: string;
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
  stockCount: number; // This represents current production stock
}

export interface ProductionEntry {
  raw: {
    type: MaterialType;
    size: MaterialSize;
    color: string;
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

export interface ProcessingEntry {
  modelId: string;
  quantitySent: number;
  quantityReceived: number;
  price: number;
}

export interface ProcessingWork {
  id: string;
  machineName: string;
  date: string;
  entries: ProcessingEntry[];
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
