export class Lead {
    constructor(
      public name?: string,
      public email?: string,
      public phone?: string,
      public status: 'pending' | 'processed' | 'retrying' | 'dead' = 'pending',
      public retryCount: number = 0,
    ) {}
  
    get isProcessed(): boolean {
      return this.status === 'processed';
    }
  
    incrementRetryCount(): void {
      this.retryCount += 1;
    }

    markAsProcessed(): void {
      this.status = 'processed';
    }
  
    markAsDead(): void {
      this.status = 'dead';
    }
  }