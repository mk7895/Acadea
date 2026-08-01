const DEFAULT_PUBLIC_SITE_URL = "https://acadea.org";

export function getPublicSiteUrl() {
  return (process.env.PUBLIC_SITE_URL?.trim() || DEFAULT_PUBLIC_SITE_URL).replace(/\/+$/, "");
}

export function buildPublicSiteUrl(
  pathname: string,
  query: Record<string, string | undefined> = {},
) {
  const url = new URL(pathname, `${getPublicSiteUrl()}/`);

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}
