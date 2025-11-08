export enum OrderStatus {
  Unpaid = 0,
  Processing = 1,
  Paid = 2,
  Failed = 3,
  Cancelled = 4
}

export interface SnWalletOrder {
  id: string
  status: OrderStatus
  currency: string
  remarks?: string
  appIdentifier?: string
  productIdentifier?: string
  meta?: Record<string, unknown>
  amount: number
  expiredAt: string
  payeeWalletId?: string
  payeeWallet?: unknown
  transactionId?: string
  transaction?: unknown
}
