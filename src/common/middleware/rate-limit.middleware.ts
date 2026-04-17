import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
}

/**
 * Simple in-memory rate limiter for authentication endpoints.
 * Limits to MAX_ATTEMPTS requests per WINDOW_MS per IP.
 * Resets the window after WINDOW_MS milliseconds.
 */
@Injectable()
export class LoginRateLimitMiddleware implements NestMiddleware {
  private static readonly MAX_ATTEMPTS = 10;
  private static readonly WINDOW_MS = 60_000; // 1 minute

  // Map<ip, AttemptRecord>
  private readonly store = new Map<string, AttemptRecord>();

  use(req: Request, _res: Response, next: NextFunction): void {
    const ip =
      (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() ??
      req.socket.remoteAddress ??
      'unknown';

    const now = Date.now();
    const record = this.store.get(ip);

    if (!record || now - record.firstAttemptAt > LoginRateLimitMiddleware.WINDOW_MS) {
      this.store.set(ip, { count: 1, firstAttemptAt: now });
      return next();
    }

    record.count += 1;

    if (record.count > LoginRateLimitMiddleware.MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil(
        (LoginRateLimitMiddleware.WINDOW_MS - (now - record.firstAttemptAt)) / 1000,
      );
      throw new HttpException(
        { message: 'Demasiados intentos. Intente de nuevo más tarde.', retryAfter: retryAfterSec },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    next();
  }
}
