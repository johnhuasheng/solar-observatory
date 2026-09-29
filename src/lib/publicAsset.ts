/** Keep bundled public assets working at both / and a GitHub Pages project path. */
export function publicAsset(pathname: string): string {
  return `${import.meta.env.BASE_URL}${pathname.replace(/^\/+/, "")}`;
}

