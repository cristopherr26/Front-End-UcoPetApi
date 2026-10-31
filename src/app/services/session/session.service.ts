import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LoginResponse, SessionProfile } from '../../models/session/session.model';

const TOKEN_COOKIE = 'ucopet_token';
const PROFILE_COOKIE = 'ucopet_profile';
const HEADQUARTER_COOKIE = 'ucopet_headquarter';
const MAX_AGE_SECONDS = 12 * 60 * 60;

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);

  private readonly tokenState = signal<string | null>(readCookie(TOKEN_COOKIE));
  private readonly profileState = signal<SessionProfile | null>(
    parseProfile(readCookie(PROFILE_COOKIE)),
  );
  private readonly headquarterState = signal<string | null>(readCookie(HEADQUARTER_COOKIE));

  readonly token = this.tokenState.asReadonly();
  readonly profile = this.profileState.asReadonly();
  readonly headquarterId = this.headquarterState.asReadonly();
  readonly isLoggedIn = computed(() => this.tokenState() !== null);
  readonly isAdmin = computed(() => this.profileState()?.roles.includes('ADMIN') ?? false);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${environment.apiUrl}/persons/login`, { email, password })
      .pipe(
        tap((response) => {
          const profile: SessionProfile = {
            personId: response.personId,
            fullName: response.fullName,
            roles: response.roles,
          };
          writeCookie(TOKEN_COOKIE, response.token);
          writeCookie(PROFILE_COOKIE, JSON.stringify(profile));
          this.tokenState.set(response.token);
          this.profileState.set(profile);
        }),
      );
  }

  logout(): void {
    if (this.isLoggedIn()) {
      this.http
        .post<void>(`${environment.apiUrl}/persons/logout`, null)
        .subscribe({ error: () => undefined });
    }
    this.clear();
  }

  clear(): void {
    deleteCookie(TOKEN_COOKIE);
    deleteCookie(PROFILE_COOKIE);
    deleteCookie(HEADQUARTER_COOKIE);
    this.tokenState.set(null);
    this.profileState.set(null);
    this.headquarterState.set(null);
  }

  selectHeadquarter(headquarterId: string | null): void {
    if (headquarterId === null) {
      deleteCookie(HEADQUARTER_COOKIE);
    } else {
      writeCookie(HEADQUARTER_COOKIE, headquarterId);
    }
    this.headquarterState.set(headquarterId);
  }
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((cookie) => cookie.startsWith(prefix));
  return entry ? decodeURIComponent(entry.substring(prefix.length)) : null;
}

function writeCookie(name: string, value: string): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Strict${secure}`;
}

function deleteCookie(name: string): void {
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Strict`;
}

function parseProfile(raw: string | null): SessionProfile | null {
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw) as SessionProfile;
  } catch {
    return null;
  }
}
