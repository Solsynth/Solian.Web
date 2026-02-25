<div class="flex flex-col gap-6 py-4">
	<!-- Search -->
	<div class="relative">
		<input
			type="text"
			placeholder="Search..."
			class="input-bordered input w-full bg-base-200/50 focus:bg-base-100"
		/>
	</div>

	<!-- Floating Island Note -->
	<div role="alert" class="alert alert-soft text-xs text-base-content/70">
		<div class="flex flex-col gap-2">
			<p>
				You're accessing Floating Island. The Solar Network client that specialized for the web
				browser to browse content. It does not contains all the features of the Solar Network have.
			</p>

			<p>
				If you want to experience the full features of Solar Network, please use the Solian instead.
				<a href="https://web.solian.app" class="font-bold underline">Open web version</a>
			</p>
		</div>
	</div>

	<!-- Legal Footer -->
	<div class="px-2 text-xs leading-relaxed text-base-content/40">
		<p>© {new Date().getFullYear()} Solar Network. All rights reserved.</p>
		<div class="flex flex-wrap gap-2 text-xs">
			<a href="/about" class="link link-hover">About</a>
			<span class="text-base-content/30">·</span>
			<a href="/privacy" class="link link-hover">Privacy</a>
			<span class="text-base-content/30">·</span>
			<a href="/terms" class="link link-hover">Terms</a>
			<span class="text-base-content/30">·</span>
			<a href="/help" class="link link-hover">Help</a>
		</div>
	</div>
</div>
