<script lang="ts">
	import ConfuseSpinner from './ConfuseSpinner.svelte';
</script>

<div class="demo-container">
	<h2>ConfuseSpinner Component Demo</h2>
	
	<div class="demo-section">
		<h3>Default Spinner (cycles o.0 → 0.o → o.o)</h3>
		<ConfuseSpinner />
	</div>

	<div class="demo-section">
		<h3>Custom Size and Speed</h3>
		<ConfuseSpinner size={80} speed={4} />
	</div>

	<div class="demo-section">
		<h3>Custom Text Patterns</h3>
		<ConfuseSpinner 
			size={60} 
			color="#ff4757" 
			text="🌀 🔄 ⭕" 
			fontSize={20}
		/>
	</div>

	<div class="demo-section">
		<h3>Different Text Patterns</h3>
		<ConfuseSpinner 
			size={70} 
			color="#2ed573" 
			text="Loading... Processing... Done!"
			fontSize={12}
		/>
	</div>

	<div class="demo-section">
		<h3>Custom Font and Styling</h3>
		<ConfuseSpinner 
			size={90}
			color="#1e90ff"
			fontFamily="monospace"
			fontWeight={700}
			letterSpacing="0.2em"
			text="CODE BUILDING... TESTING... DEPLOYING..."
		/>
	</div>

	<div class="demo-section">
		<h3>With Custom Children</h3>
		<ConfuseSpinner size={100}>
			<span style="color: #ffa502; font-size: 24px; font-weight: bold;">⭐</span>
		</ConfuseSpinner>
	</div>
</div>

<style>
	.demo-container {
		padding: 2rem;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	}

	.demo-section {
		margin-bottom: 2rem;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 8px;
		background: #fafafa;
	}

	h2 {
		color: #333;
		border-bottom: 2px solid #1e90ff;
		padding-bottom: 0.5rem;
	}

	h3 {
		color: #666;
		margin-bottom: 1rem;
	}
</style>