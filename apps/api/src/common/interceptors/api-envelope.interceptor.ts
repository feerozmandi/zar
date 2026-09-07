import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from "@nestjs/common";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface ApiEnvelope<T> {
  success: true;
  data: T;
}

/** پاسخ یکدست همه‌ی مسیرها — مطابق قرارداد apiEnvelopeSchema در @xennic/shared */
@Injectable()
export class ApiEnvelopeInterceptor<T> implements NestInterceptor<T, ApiEnvelope<T>> {
  public intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(map((data) => ({ success: true as const, data })));
  }
}
