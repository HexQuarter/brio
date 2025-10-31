export interface PaymentServiceStorage {
  createPayment(paymentItem: PaymentItem): Promise<void>;
  getPayment(paymentId: string): Promise<PaymentItem | null>;
}

export type PaymentItem = {
  id: string,
  amount: number,
  method: string
}