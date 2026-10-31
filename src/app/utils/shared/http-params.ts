import { HttpParams } from '@angular/common/http';

export function toHttpParams(filters: object): HttpParams {
  return Object.entries(filters).reduce(
    (params, [key, value]) =>
      value === null || value === undefined || value === ''
        ? params
        : params.set(key, String(value)),
    new HttpParams(),
  );
}
