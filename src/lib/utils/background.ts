export type ThemeMode = 'light' | 'dark';

const backgroundModules = import.meta.glob('../assets/background/*.{jpg,jpeg,png,webp,avif}', {
	eager: true,
	import: 'default'
}) as Record<string, string>;

interface BackgroundGroup {
	any: string[];
	light: string[];
	dark: string[];
}

const groupedBackgrounds: BackgroundGroup = Object.entries(
	backgroundModules
).reduce<BackgroundGroup>(
	(acc, [path, url]) => {
		const name = path.split('/').pop()?.toLowerCase() || '';
		if (name.startsWith('light-')) acc.light.push(url);
		else if (name.startsWith('dark-')) acc.dark.push(url);
		else acc.any.push(url);
		return acc;
	},
	{ any: [], light: [], dark: [] }
);

function pickRandom<T>(list: T[]): T | null {
	if (list.length === 0) return null;
	return list[Math.floor(Math.random() * list.length)] ?? null;
}

export function resolveThemeMode(): ThemeMode {
	if (typeof window === 'undefined' || typeof document === 'undefined') return 'light';

	const dataTheme = (document.documentElement.getAttribute('data-theme') || '').toLowerCase();
	if (dataTheme.includes('dark')) return 'dark';
	if (dataTheme.includes('light')) return 'light';

	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function pickBackgroundForTheme(mode: ThemeMode): string | null {
	const themeSpecific = mode === 'dark' ? groupedBackgrounds.dark : groupedBackgrounds.light;
	const candidates = [...themeSpecific, ...groupedBackgrounds.any];
	return pickRandom(candidates) || pickRandom(groupedBackgrounds.any);
}
