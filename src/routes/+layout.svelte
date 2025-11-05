<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';

	let { children } = $props();
	
	let mobileMenuOpen = $state(false);

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	// Navigation items
	const navItems = [
		{ href: '/', label: 'Dashboard', icon: '📊' },
		{ href: '/wasteClassifier', label: 'Classifier', icon: '🔍' },
		{ href: '/history', label: 'History', icon: '📜' },
		{ href: '/about', label: 'About', icon: 'ℹ️' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Navbar -->
<nav class="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
	<div class="w-full mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-20">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3 group">
				<div class="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl transform group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/30">
					<span class="text-2xl">♻️</span>
				</div>
				<div class="hidden sm:block">
					<h1 class="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
						EcoSort AI
					</h1>
					<p class="text-xs text-slate-400">Waste Classification System</p>
				</div>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center gap-2">
				{#each navItems as item}
					<a
						href={item.href}
						class="relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 group
							{$page.url.pathname === item.href 
								? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
								: 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
					>
						<span class="text-xl">{item.icon}</span>
						<span>{item.label}</span>
						{#if $page.url.pathname === item.href}
							<div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
						{/if}
					</a>
				{/each}
			</div>

			<!-- User Menu / CTA -->
			<div class="hidden md:flex items-center gap-4">
				<button class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-2">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
					Login
				</button>
			</div>

			<!-- Mobile menu button -->
			<button
				onclick={toggleMobileMenu}
				class="md:hidden relative w-10 h-10 text-slate-300 hover:text-white focus:outline-none"
			>
				<span class="sr-only">Open menu</span>
				<div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
					<span
						class="block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen
							? 'rotate-45'
							: '-translate-y-2'}"
					></span>
					<span
						class="block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen
							? 'opacity-0'
							: 'opacity-100'}"
					></span>
					<span
						class="block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen
							? '-rotate-45'
							: 'translate-y-2'}"
					></span>
				</div>
			</button>
		</div>
	</div>

	<!-- Mobile menu -->
	<div
		class="md:hidden transition-all duration-300 ease-in-out overflow-hidden {mobileMenuOpen
			? 'max-h-screen opacity-100'
			: 'max-h-0 opacity-0'}"
	>
		<div class="px-4 pt-2 pb-6 space-y-2 bg-slate-800/50 backdrop-blur-lg border-t border-slate-700/50">
			{#each navItems as item}
				<a
					href={item.href}
					onclick={closeMobileMenu}
					class="flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300
						{$page.url.pathname === item.href 
							? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30' 
							: 'text-slate-300 hover:text-white hover:bg-slate-700/50'}"
				>
					<span class="text-2xl">{item.icon}</span>
					<span>{item.label}</span>
				</a>
			{/each}

			<button class="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
				Profile
			</button>
		</div>
	</div>
</nav>

<!-- Main Content -->
<main>
	{@render children?.()}
</main>

<!-- Footer -->
<footer class="bg-slate-900 border-t border-slate-700/50 mt-20">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid md:grid-cols-4 gap-8">
			<!-- About -->
			<div class="md:col-span-2">
				<div class="flex items-center gap-3 mb-4">
					<div class="bg-gradient-to-r from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg shadow-green-500/30">
						<span class="text-2xl">♻️</span>
					</div>
					<h3 class="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
						EcoSort AI
					</h3>
				</div>
				<p class="text-slate-400 mb-4">
					Empowering sustainable waste management through artificial intelligence. 
					Classify, track, and reduce your environmental impact.
				</p>
				<div class="flex gap-4">
					<a href="#" class="text-slate-400 hover:text-green-400 transition-colors">
						<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
						</svg>
					</a>
					<!-- <a href="#" class="text-slate-400 hover:text-green-400 transition-colors">
						<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
						</svg>
					</a> -->
					<a href="#" class="text-slate-400 hover:text-green-400 transition-colors">
						<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
						</svg>
					</a>
				</div>
			</div>

		</div>
</footer>

<style>
	:global(body) {
		margin: 0;
		background: #0f172a;
	}
</style>