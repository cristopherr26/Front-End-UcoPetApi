import { Pipe, PipeTransform } from '@angular/core';

import { normalize } from '../../utils/egress/egress-filters';

@Pipe({ name: 'payMethodIcon' })
export class PayMethodIconPipe implements PipeTransform {
  transform(name: string | null | undefined): string {
    const text = normalize(name ?? '');
    if (text.includes('efectivo')) {
      return 'bi-cash-stack';
    }
    if (text.includes('tarjeta') || text.includes('credito') || text.includes('debito')) {
      return 'bi-credit-card';
    }
    if (text.includes('transfer') || text.includes('pse') || text.includes('banc')) {
      return 'bi-bank';
    }
    if (text.includes('nequi') || text.includes('daviplata')) {
      return 'bi-phone';
    }
    if (text.includes('cheque')) {
      return 'bi-journal-check';
    }
    return 'bi-wallet2';
  }
}
