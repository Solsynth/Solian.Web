import type { Publisher } from '$lib/types/post';

class PublisherStore {
	publishers = $state<Publisher[]>([]);
	loading = $state(false);
	error = $state<string | null>(null);

	async fetchPublishers(): Promise<Publisher[]> {
		this.loading = true;
		this.error = null;

		try {
			const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
			const response = await fetch('https://api.solian.app/sphere/publishers', {
				headers: token ? { Authorization: `Bearer ${token}` } : {}
			});

			if (!response.ok) {
				throw new Error('Failed to fetch publishers');
			}

			const data: Publisher[] = await response.json();
			this.publishers = data;
			return data;
		} catch (e) {
			this.error = e instanceof Error ? e.message : 'Failed to load publishers';
			return [];
		} finally {
			this.loading = false;
		}
	}

	getCurrentPublisher(): Publisher | null {
		return this.publishers[0] ?? null;
	}
}

export const publisherStore = new PublisherStore();
