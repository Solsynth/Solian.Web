<script lang="ts">
	import { getFileUrl } from '$lib/utils/files';
	import { renderMarkdown } from '$lib/utils/markdown';
	import {
		ShieldCheck,
		UserX,
		Calendar,
		MapPin,
		Cake,
		Link as LinkIcon,
		Mail,
		Phone,
		Home,
		Fingerprint,
		Clock,
		Share2,
		BadgeCheck,
		Star,
		CircleDollarSign
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	interface AccountProfile {
		id: string;
		name: string;
		nick: string;
		profile: {
			firstName: string;
			middleName: string;
			lastName: string;
			bio: string;
			gender: string;
			pronouns: string;
			timeZone: string;
			location: string;
			links: Array<{
				name: string;
				url: string;
			}>;
			birthday: string | null;
			verification: {
				type: number;
				title: string;
				description: string;
				verifiedBy: string;
			} | null;
			experience: number;
			level: number;
			levelingProgress: number;
			socialCredits: number;
			socialCreditsLevel: number;
			picture: {
				id: string;
			} | null;
			background: {
				id: string;
			} | null;
		};
		contacts: Array<{
			type: number;
			content: string;
			isPublic: boolean;
		}>;
		badges: Array<{
			id: string;
			type: string;
			label: string;
			caption: string | null;
		}>;
		createdAt: string;
	}

	let { data }: { data: PageData } = $props();

	const account = $derived(data.account as AccountProfile | null);
	const profile = $derived(account?.profile);
	const displayName = $derived(account?.nick || account?.name || 'Unknown');
	const avatarUrl = $derived(getFileUrl(profile?.picture?.id));
	const backgroundUrl = $derived(getFileUrl(profile?.background?.id));
	const bioHtml = $derived(profile?.bio ? renderMarkdown(profile.bio) : '');

	function getInitials(name: string): string {
		return (
			name
				.split(/\s+/)
				.filter(Boolean)
				.map((part) => part[0]?.toUpperCase())
				.slice(0, 2)
				.join('') || '?'
		);
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
	}

	function getAge(birthday: string | null): number | null {
		if (!birthday) return null;
		const birth = new Date(birthday);
		const today = new Date();
		let age = today.getFullYear() - birth.getFullYear();
		const monthDiff = today.getMonth() - birth.getMonth();
		if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
			age--;
		}
		return age;
	}

	function getSocialCreditsLevel(level: number): string {
		switch (level) {
			case -1:
				return 'Poor';
			case 0:
				return 'Normal';
			case 1:
				return 'Good';
			case 2:
				return 'Excellent';
			default:
				return 'Unknown';
		}
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function shareProfile() {
		if (account?.name) {
			navigator.share({
				title: displayName,
				url: `https://solian.app/@${account?.name}`
			});
		}
	}
</script>

{#if data.notFound}
	<div class="mx-auto max-w-2xl p-6">
		<div class="card">
			<div class="card-body items-center text-center">
				<UserX class="text-base-content/50" size={40} />
				<h1 class="text-xl font-bold">Account not found</h1>
				<p class="text-base-content/60">The profile you requested does not exist.</p>
			</div>
		</div>
	</div>
{:else if !account}
	<div class="mx-auto max-w-2xl p-6">
		<div class="alert alert-error">
			<span>{data.error || 'Failed to load account profile'}</span>
		</div>
	</div>
{:else}
	<div class="mx-auto max-w-5xl">
		<section class="relative overflow-hidden">
			<div class="h-40 w-full bg-base-200 sm:h-52">
				{#if backgroundUrl}
					<img
						src={backgroundUrl}
						alt={`${displayName} background`}
						class="h-full w-full object-cover"
					/>
				{/if}
			</div>
			<div
				class="mx-auto -mt-16 flex max-w-5xl flex-col gap-4 px-4 pb-4 sm:-mt-14 sm:flex-row sm:items-end sm:px-6"
			>
				<div class="shrink-0">
					{#if avatarUrl}
						<div class="avatar">
							<div
								class="h-24 w-24 rounded-full ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-28 sm:w-28"
							>
								<img src={avatarUrl} alt={displayName} />
							</div>
						</div>
					{:else}
						<div class="avatar avatar-placeholder">
							<div
								class="h-24 w-24 rounded-full bg-primary text-primary-content ring ring-base-300 ring-offset-2 ring-offset-base-100 sm:h-28 sm:w-28"
							>
								<span class="text-2xl font-semibold">{getInitials(displayName)}</span>
							</div>
						</div>
					{/if}
				</div>
				<div class="min-w-0 flex-1">
					<div class="flex flex-wrap items-center gap-2 pt-18">
						<h1 class="truncate text-2xl font-black sm:text-3xl">{displayName}</h1>
						{#if profile?.verification}
							<span class="badge gap-1 badge-primary">
								<ShieldCheck size={12} />
								{profile.verification.title}
							</span>
						{/if}
					</div>
					<p class="truncate text-sm text-base-content/60">@{account.name}</p>
				</div>
				<div class="flex gap-3">
					<button class="btn btn-outline btn-sm" onclick={shareProfile}>
						<Share2 size={16} />
						Share
					</button>
				</div>
			</div>
		</section>

		<div class="space-y-4 px-4 py-4 lg:px-6">
			<section class="space-y-4">
				<div class="card">
					<div class="card-body p-4">
						<h2 class="text-sm font-semibold text-base-content/70">Bio</h2>
						{#if bioHtml}
							<article class="prose prose-sm max-w-none">{@html bioHtml}</article>
						{:else}
							<p class="text-sm text-base-content/60">No bio yet.</p>
						{/if}
					</div>
				</div>

				{#if profile?.verification}
					<div class="card">
						<div class="card-body p-4">
							<p class="text-sm font-semibold">
								{profile.verification.title || 'Verified account'}
							</p>
							{#if profile.verification.description}
								<p class="text-sm text-base-content/70">{profile.verification.description}</p>
							{/if}
							{#if profile.verification.verifiedBy}
								<p class="text-xs text-base-content/60">By {profile.verification.verifiedBy}</p>
							{/if}
						</div>
					</div>
				{/if}
			</section>

			<section class="space-y-4">
				<div class="card">
					<div class="card-body gap-4 p-4">
						<h2 class="text-sm font-semibold text-base-content/70">Details</h2>
						<div class="grid gap-3 sm:grid-cols-2">
							<div class="flex items-center gap-2 text-sm">
								<Calendar size={16} class="text-base-content/50" />
								<span>Joined {formatDate(account.createdAt)}</span>
							</div>

							{#if profile?.birthday}
								<div class="flex items-center gap-2 text-sm">
									<Cake size={16} class="text-base-content/50" />
									<span>{formatDate(profile.birthday)} · {getAge(profile.birthday)} years old</span>
								</div>
							{/if}

							{#if profile?.location}
								<div class="flex items-center gap-2 text-sm">
									<MapPin size={16} class="text-base-content/50" />
									<span>{profile.location}</span>
								</div>
							{/if}

							{#if profile?.pronouns || profile?.gender}
								<div class="flex items-center gap-2 text-sm">
									<UserX size={16} class="text-base-content/50" />
									<span>
										{profile?.gender || 'Unspecified'} · {profile?.pronouns || 'Unspecified'}
									</span>
								</div>
							{/if}

							{#if profile?.firstName || profile?.middleName || profile?.lastName}
								<div class="flex items-center gap-2 text-sm">
									<BadgeCheck size={16} class="text-base-content/50" />
									<span>
										{[profile?.firstName, profile?.middleName, profile?.lastName]
											.filter(Boolean)
											.join(' ')}
									</span>
								</div>
							{/if}

							{#if profile?.socialCredits !== undefined}
								<div class="flex items-center gap-2 text-sm">
									<CircleDollarSign size={16} class="text-base-content/50" />
									<span>
										{profile?.socialCredits?.toFixed(2) ?? '0.00'} pts ·
										<span class="font-medium"
											>{getSocialCreditsLevel(profile?.socialCreditsLevel ?? 0)}</span
										>
									</span>
								</div>
							{/if}

							{#if profile?.level}
								<div class="flex items-center gap-2 text-sm">
									<Star size={16} class="text-base-content/50" />
									<span>Level {profile.level}</span>
								</div>
							{/if}

							{#if profile?.timeZone}
								<div class="flex items-center gap-2 text-sm">
									<Clock size={16} class="text-base-content/50" />
									<span>{profile.timeZone}</span>
								</div>
							{/if}

							<div class="flex items-center gap-2 text-sm">
								<Fingerprint size={16} class="text-base-content/50" />
								<button
									class="truncate hover:text-primary"
									onclick={() => copyToClipboard(account.id)}
								>
									{account.id}
								</button>
							</div>
						</div>
					</div>
				</div>

				{#if profile?.links && profile.links.length > 0}
					<div class="card">
						<div class="card-body p-4">
							<h2 class="text-sm font-semibold text-base-content/70">Links</h2>
							<div class="space-y-2">
								{#each profile.links as link}
									<a
										href={link.url.startsWith('http') ? link.url : `https://${link.url}`}
										target="_blank"
										rel="noopener noreferrer"
										class="flex items-center gap-2 text-sm hover:text-primary"
									>
										<LinkIcon size={16} class="text-base-content/50" />
										<span class="capitalize">{link.name}</span>
									</a>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				{#if account.contacts && account.contacts.filter((c) => c.isPublic).length > 0}
					<div class="card">
						<div class="card-body p-4">
							<h2 class="text-sm font-semibold text-base-content/70">Contact</h2>
							<div class="space-y-2">
								{#each account.contacts.filter((c) => c.isPublic) as contact}
									<div class="flex items-center gap-2 text-sm">
										{#if contact.type === 0}
											<Mail size={16} class="text-base-content/50" />
										{:else if contact.type === 1}
											<Phone size={16} class="text-base-content/50" />
										{:else}
											<Home size={16} class="text-base-content/50" />
										{/if}
										<span>{contact.content}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				{#if account.badges && account.badges.length > 0}
					<div class="card">
						<div class="card-body p-4">
							<h2 class="text-sm font-semibold text-base-content/70">Badges</h2>
							<div class="flex flex-wrap gap-2">
								{#each account.badges as badge}
									<div class="badge gap-1 badge-lg" title={badge.caption ?? undefined}>
										<span>{badge.label || badge.type}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</section>
		</div>
	</div>
{/if}
