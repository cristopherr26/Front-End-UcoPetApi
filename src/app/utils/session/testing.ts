export function clearCookies(): void {
  document.cookie
    .split('; ')
    .filter(Boolean)
    .forEach((cookie) => {
      document.cookie = `${cookie.split('=')[0]}=; Max-Age=0; Path=/`;
    });
}

export function setSessionCookies(token: string, roles: string[]): void {
  document.cookie = `ucopet_token=${encodeURIComponent(token)}; Path=/`;
  document.cookie = `ucopet_profile=${encodeURIComponent(JSON.stringify({ personId: 'p1', fullName: 'Ana Prueba', roles }))}; Path=/`;
}
