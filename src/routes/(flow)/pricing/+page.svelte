<script lang="ts">
	import {
		BadgeCheck,
		Bot,
		Cloud,
		Gauge,
		Languages,
		Palette,
		Rocket,
		Sparkles,
		Stars
	} from 'lucide-svelte';

	type Tier = {
		name: string;
		tagline: string;
		description: string;
		storage: string;
		levelBoost: string;
		usernameStyle: string;
		icon: typeof Sparkles;
		accent: string;
		ctaClass: string;
		features: string[];
	};

	type ComparisonRow = {
		label: string;
		icon: typeof Cloud;
		values: [string, string, string];
	};

	const tiers: Tier[] = [
		{
			name: 'Stellar',
			tagline: 'Core membership',
			description:
				'A lighter upgrade for members who want better identity tools and a faster pace.',
			storage: '5GB cloud storage',
			levelBoost: '1.5x leveling boost',
			usernameStyle: 'Limited username colors',
			icon: Sparkles,
			accent: 'text-primary',
			ctaClass: 'btn-primary',
			features: [
				'5GB cloud storage',
				'Limited username color options',
				'Translation',
				'1.5x leveling up boost',
				'Ability to get verified',
				'Publisher quota: base 2, becomes 3 at level 30+, plus 2 per perk level'
			]
		},
		{
			name: 'Nova',
			tagline: 'Expanded creator tools',
			description:
				'Everything in Stellar, with more room for publishers, realms, and bot-driven workflows.',
			storage: '10GB cloud storage',
			levelBoost: '2x leveling boost',
			usernameStyle: 'Unlimited username colors',
			icon: Rocket,
			accent: 'text-secondary',
			ctaClass: 'btn-secondary',
			features: [
				'Everything in Stellar',
				'10GB cloud storage',
				'Unlimited username color options',
				'Publisher quota: base 2, becomes 3 at level 30+, plus 2 per perk level',
				'Bot quota: base 0, then 1 at level 30, 2 at level 60, 3 at level 90, plus 1 per perk level',
				'Realm quota: same as bot quota',
				'2x leveling up boost'
			]
		},
		{
			name: 'Supernova',
			tagline: 'Highest capacity tier',
			description:
				'Everything in Nova, with the largest storage tier and the most room to scale out your setup.',
			storage: '15GB cloud storage',
			levelBoost: '2.5x leveling boost',
			usernameStyle: 'Unlimited username colors with gradients',
			icon: Stars,
			accent: 'text-accent',
			ctaClass: 'btn-accent',
			features: [
				'Everything in Nova',
				'15GB cloud storage',
				'Unlimited username colors with gradient support',
				'Publisher quota: base 2, becomes 3 at level 30+, plus 2 per perk level',
				'Bot quota: base 0, then 1 at level 30, 2 at level 60, 3 at level 90, plus 1 per perk level',
				'Realm quota: same as bot quota',
				'2.5x leveling up boost'
			]
		}
	];

	const comparisonRows: ComparisonRow[] = [
		{ label: 'Cloud storage', icon: Cloud, values: ['5GB', '10GB', '15GB'] },
		{
			label: 'Username color',
			icon: Palette,
			values: ['Limited', 'Unlimited', 'Unlimited + gradient']
		},
		{ label: 'Translation', icon: Languages, values: ['Included', 'Included', 'Included'] },
		{ label: 'Leveling boost', icon: Gauge, values: ['1.5x', '2x', '2.5x'] },
		{
			label: 'Verification access',
			icon: BadgeCheck,
			values: ['Eligible', 'Eligible', 'Eligible']
		},
		{
			label: 'Publisher quota',
			icon: Sparkles,
			values: ['2 base, 3 at lvl 30+, +2/perk', 'Same', 'Same']
		},
		{
			label: 'Realm quota',
			icon: Rocket,
			values: ['Not included', '0/1/2/3 by lvl 0/30/60/90, +1/perk', 'Same']
		},
		{
			label: 'Bot quota',
			icon: Bot,
			values: ['Not included', '0/1/2/3 by lvl 0/30/60/90, +1/perk', 'Same']
		}
	];
</script>

/*! 🌼 daisyUI 5.5.19 */
<svelte:head>
	<title>Pricing - Stellar Program</title>
</svelte:head>

<div class="w-full max-w-7xl">
	<div class="card border border-base-300 bg-base-100/88 shadow-xl backdrop-blur-xl">
		<div class="card-body gap-6 p-5 md:p-8">
			<div class="flex flex-col gap-3 border-b border-base-300 pb-5">
				<div class="flex items-center gap-2 text-sm text-base-content/60">
					<Sparkles class="h-4 w-4 text-primary" />
					<span>Stellar Program</span>
				</div>
				<div class="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
					<div class="max-w-3xl">
						<h1 class="text-3xl font-black tracking-tight text-base-content">Membership tiers</h1>
						<p class="mt-2 text-sm leading-6 text-base-content/70 md:text-base">
							Pick the Stellar plan that matches how you use Solar Network. Every tier improves
							storage, progression, and account capabilities without changing the core experience.
						</p>
					</div>
					<div class="text-sm text-base-content/55">
						Billing details can be added when memberships open.
					</div>
				</div>
			</div>

			<div class="grid gap-4 xl:grid-cols-3">
				{#each tiers as tier}
					<section class="card border border-base-300 bg-base-100">
						<div class="card-body gap-5">
							<div class="flex items-start justify-between gap-4">
								<div>
									<p class="text-sm font-semibold text-base-content/55">{tier.tagline}</p>
									<h2 class="mt-1 text-2xl font-black tracking-tight">{tier.name}</h2>
								</div>
								<div class={`rounded-box bg-base-200 p-3 ${tier.accent}`}>
									<tier.icon class="h-5 w-5" />
								</div>
							</div>

							<p class="text-sm leading-6 text-base-content/70">{tier.description}</p>

							<div class="grid gap-3 sm:grid-cols-2">
								<div class="rounded-box border border-base-300 bg-base-200/60 p-3">
									<div class="text-xs font-semibold text-base-content/45">Storage</div>
									<div class="mt-1 text-sm font-semibold">{tier.storage}</div>
								</div>
								<div class="rounded-box border border-base-300 bg-base-200/60 p-3">
									<div class="text-xs font-semibold text-base-content/45">Progression</div>
									<div class="mt-1 text-sm font-semibold">{tier.levelBoost}</div>
								</div>
								<div class="rounded-box border border-base-300 bg-base-200/60 p-3 sm:col-span-2">
									<div class="text-xs font-semibold text-base-content/45">Username style</div>
									<div class="mt-1 text-sm font-semibold">{tier.usernameStyle}</div>
								</div>
							</div>

							<ul class="space-y-3">
								{#each tier.features as feature}
									<li class="flex items-start gap-3 text-sm text-base-content/80">
										<BadgeCheck class="mt-0.5 h-4 w-4 shrink-0 text-success" />
										<span>{feature}</span>
									</li>
								{/each}
							</ul>

							<div class="mt-auto card-actions">
								<a href="/auth/login" class={`btn w-full ${tier.ctaClass}`}>Choose {tier.name}</a>
							</div>
						</div>
					</section>
				{/each}
			</div>

			<section class="card border border-base-300 bg-base-100">
				<div class="card-body gap-5">
					<div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
						<div>
							<h2 class="text-xl font-bold">Compare membership benefits</h2>
							<p class="mt-1 text-sm text-base-content/65">
								A quick view of how each Stellar Program tier scales up.
							</p>
						</div>
						<div class="text-sm text-base-content/55">
							All tiers include the base Solar Network experience.
						</div>
					</div>

					<div class="overflow-x-auto">
						<table class="table">
							<thead>
								<tr class="text-sm text-base-content/55">
									<th>Benefit</th>
									<th>Stellar</th>
									<th>Nova</th>
									<th>Supernova</th>
								</tr>
							</thead>
							<tbody>
								{#each comparisonRows as row}
									<tr class="align-top">
										<th class="min-w-44">
											<div class="flex items-center gap-2 font-semibold">
												<row.icon class="h-4 w-4 text-base-content/55" />
												<span>{row.label}</span>
											</div>
										</th>
										<td>{row.values[0]}</td>
										<td>{row.values[1]}</td>
										<td>{row.values[2]}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</section>
		</div>
	</div>
</div>
