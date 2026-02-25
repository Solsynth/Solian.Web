<script lang="ts">
	import {
		ArrowLeft,
		Download,
		Share2,
		Maximize2,
		X,
		ZoomIn,
		ZoomOut,
		RotateCcw
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let isFullscreen = $state(false);
	let scale = $state(1);
	let translateX = $state(0);
	let translateY = $state(0);
	let isDragging = $state(false);
	let startX = $state(0);
	let startY = $state(0);

	function handleBack() {
		if (typeof window !== 'undefined' && window.history.length > 1) {
			window.history.back();
			return;
		}
		goto('/');
	}

	function toggleFullscreen() {
		isFullscreen = !isFullscreen;
		resetTransform();
	}

	async function handleShare() {
		if (navigator.share) {
			try {
				await navigator.share({
					title: 'File',
					url: window.location.href
				});
			} catch {
				// User cancelled or share failed
			}
		} else {
			await navigator.clipboard.writeText(window.location.href);
		}
	}

	function handleDownload() {
		if (!data.fileUrl) return;
		const link = document.createElement('a');
		link.href = data.fileUrl;
		link.download = data.fileId;
		link.click();
	}

	function zoomIn() {
		scale = Math.min(scale + 0.25, 5);
	}

	function zoomOut() {
		scale = Math.max(scale - 0.25, 0.25);
	}

	function resetTransform() {
		scale = 1;
		translateX = 0;
		translateY = 0;
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault();
		if (e.deltaY < 0) {
			zoomIn();
		} else {
			zoomOut();
		}
	}

	function handleMouseDown(e: MouseEvent) {
		if (scale > 1) {
			isDragging = true;
			startX = e.clientX - translateX;
			startY = e.clientY - translateY;
		}
	}

	function handleMouseMove(e: MouseEvent) {
		if (isDragging && scale > 1) {
			translateX = e.clientX - startX;
			translateY = e.clientY - startY;
		}
	}

	function handleMouseUp() {
		isDragging = false;
	}

	let imageStyle = $derived(
		`transform: translate(${translateX}px, ${translateY}px) scale(${scale}); cursor: ${scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'};`
	);
</script>

<svelte:head>
	<title>File</title>
</svelte:head>

{#if isFullscreen}
	<div class="fixed inset-0 z-50 flex flex-col bg-black/90">
		<div class="flex items-center justify-between border-b border-white/10 px-4 py-3">
			<button class="btn btn-circle text-white btn-ghost" onclick={toggleFullscreen}>
				<X class="h-8 w-8" />
			</button>
			<div class="flex gap-2">
				<button class="btn btn-circle text-white btn-ghost" onclick={zoomOut}>
					<ZoomOut class="h-6 w-6" />
				</button>
				<button class="btn btn-circle text-white btn-ghost" onclick={zoomIn}>
					<ZoomIn class="h-6 w-6" />
				</button>
				<button class="btn btn-circle text-white btn-ghost" onclick={resetTransform}>
					<RotateCcw class="h-6 w-6" />
				</button>
				<button class="btn btn-circle text-white btn-ghost" onclick={handleShare}>
					<Share2 class="h-6 w-6" />
				</button>
				<button class="btn btn-circle text-white btn-ghost" onclick={handleDownload}>
					<Download class="h-6 w-6" />
				</button>
			</div>
		</div>
		<div
			class="flex flex-1 items-center justify-center overflow-hidden"
			role="img"
			aria-label="Zoomable image"
			onwheel={handleWheel}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
		>
			{#if data.fileUrl}
				<img
					src={data.fileUrl}
					alt="File"
					class="max-h-full max-w-full object-contain select-none"
					style={imageStyle}
					draggable="false"
				/>
			{/if}
		</div>
		<div
			class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-white"
		>
			{Math.round(scale * 100)}%
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-base-100">
		<div class="sticky top-0 z-10 border-b border-base-300 bg-base-100/95 backdrop-blur">
			<div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
				<button class="btn btn-circle btn-ghost btn-sm" onclick={handleBack}>
					<ArrowLeft class="h-5 w-5" />
				</button>
				<div class="flex gap-2">
					<button class="btn btn-circle btn-ghost btn-sm" onclick={zoomOut}>
						<ZoomOut class="h-5 w-5" />
					</button>
					<span class="flex w-12 items-center justify-center text-sm"
						>{Math.round(scale * 100)}%</span
					>
					<button class="btn btn-circle btn-ghost btn-sm" onclick={zoomIn}>
						<ZoomIn class="h-5 w-5" />
					</button>
					<button class="btn btn-circle btn-ghost btn-sm" onclick={resetTransform}>
						<RotateCcw class="h-5 w-5" />
					</button>
					<button class="btn btn-circle btn-ghost btn-sm" onclick={toggleFullscreen}>
						<Maximize2 class="h-5 w-5" />
					</button>
					<button class="btn btn-circle btn-ghost btn-sm" onclick={handleShare}>
						<Share2 class="h-5 w-5" />
					</button>
					<button class="btn btn-circle btn-ghost btn-sm" onclick={handleDownload}>
						<Download class="h-5 w-5" />
					</button>
				</div>
			</div>
		</div>

		<div
			class="flex min-h-[calc(100vh-65px)] items-center justify-center overflow-auto p-4"
			onwheel={handleWheel}
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
		>
			<div class="relative w-full max-w-5xl">
				{#if data.fileUrl}
					<img
						src={data.fileUrl}
						alt="File"
						class="w-full rounded-lg object-contain shadow-lg select-none"
						style={imageStyle}
						draggable="false"
					/>
				{/if}
			</div>
		</div>
	</div>
{/if}
