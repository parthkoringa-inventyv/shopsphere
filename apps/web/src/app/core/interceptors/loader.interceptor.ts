import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';

import { LoaderService } from '../services/loader.service';

/** Per-request flag; set through `ApiRequestOptions.showLoader`. */
export const SHOW_LOADER = new HttpContextToken<boolean>(() => false);

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.context.get(SHOW_LOADER)) {
    return next(req);
  }

  const loader = inject(LoaderService);
  loader.show();

  // finalize runs on success, error and cancellation, so the count always balances.
  return next(req).pipe(finalize(() => loader.hide()));
};
