import { Pipe, PipeTransform } from '@angular/core';

import { INVOICE_STATES, InvoiceState } from '../../models/invoice/invoice-enums';
import { labelOf } from '../../models/product/catalog-enums';

@Pipe({ name: 'invoiceState' })
export class InvoiceStatePipe implements PipeTransform {
  transform(value: InvoiceState | null | undefined): string {
    return labelOf(INVOICE_STATES, value);
  }
}
