export const SITE_NAME = 'Solar Network';
export const DEFAULT_SEO_TITLE = SITE_NAME;
export const DEFAULT_SEO_DESCRIPTION =
	'Explore posts, realms, publishers, and livestreams on Solar Network.';
export const DEFAULT_SEO_IMAGE_PATH = '/og-default.svg';

export interface SeoData {
	title?: string;
	description?: string;
	image?: string | null;
	canonicalPath?: string;
	robots?: string;
	type?: 'website' | 'article' | 'profile';
	keywords?: string[];
}

export interface ResolvedSeo {
	title: string;
	description: string;
	canonical: string;
	image: string;
	robots: string;
	type: 'website' | 'article' | 'profile';
	keywords: string | null;
}

function toAbsoluteUrl(url: URL, value: string): string {
	if (/^https?:\/\//i.test(value)) return value;
	return new URL(value.startsWith('/') ? value : `/${value}`, url.origin).toString();
}

function buildCanonical(url: URL, canonicalPath?: string): string {
	if (canonicalPath?.trim()) {
		return toAbsoluteUrl(url, canonicalPath.trim());
	}

	return new URL(url.pathname, url.origin).toString();
}

function buildTitle(rawTitle?: string): string {
	if (!rawTitle?.trim()) return DEFAULT_SEO_TITLE;
	const title = rawTitle.trim();
	return title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
}

export function excerptText(value: string | null | undefined, max = 160): string {
	if (!value?.trim()) return '';
	const plain = value.replace(/\s+/g, ' ').trim();
	if (plain.length <= max) return plain;
	return `${plain.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

export function resolveSeo(url: URL, seo?: SeoData, robotsOverride?: string): ResolvedSeo {
	const description =
		seo?.description?.trim() || seo?.title?.trim() || DEFAULT_SEO_DESCRIPTION;
	const image = toAbsoluteUrl(url, seo?.image?.trim() || DEFAULT_SEO_IMAGE_PATH);

	return {
		title: buildTitle(seo?.title),
		description: excerptText(description),
		canonical: buildCanonical(url, seo?.canonicalPath),
		image,
		robots: robotsOverride || seo?.robots || 'index, follow',
		type: seo?.type || 'website',
		keywords: seo?.keywords?.length ? seo.keywords.join(', ') : null
	};
}
