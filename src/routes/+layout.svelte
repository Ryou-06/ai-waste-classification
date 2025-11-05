<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
	import { onMount } from 'svelte';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let userMenuOpen = $state(false);
	let user: any = $state(null);
	let authInitialized = $state(false);

	const auth = getAuth();

	onMount(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			user = currentUser;
			authInitialized = true;
			console.log('Auth state changed:', currentUser ? 'Logged in' : 'Logged out');
		});

		function handleClickOutside(event: MouseEvent) {
			const target = event.target as HTMLElement;
			if (userMenuOpen && !target.closest('.user-menu-container')) {
				userMenuOpen = false;
			}
		}

		document.addEventListener('click', handleClickOutside);
		return () => {
			unsubscribe();
			document.removeEventListener('click', handleClickOutside);
		};
	});

	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
	}

	function toggleUserMenu() {
		userMenuOpen = !userMenuOpen;
	}

	function handleLogin() {
		goto('/login');
	}

async function handleLogout() {
	try {
		await signOut(auth);
		user = null;
		userMenuOpen = false;
		goto('/'); // redirect home
		setTimeout(() => location.reload(), 300); // 🔄 force full refresh
	} catch (error) {
		console.error('Logout error:', error);
	}
}


	function handleProtectedNav(href: string) {
		if (!user) {
			alert('Please log in to access this page.');
			return;
		}
		goto(href);
	}

	const navItems = [
		{ href: '/', label: 'Dashboard', icon: '📊', protected: false },
		{ href: '/wasteClassifier', label: 'Classifier', icon: '🔍', protected: true },
		{ href: '/history', label: 'History', icon: '📜', protected: true },
		{ href: '/about', label: 'About', icon: 'ℹ️', protected: false }
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
					{#if item.protected}
						<!-- Protected links -->
						<button
							on:click={() => handleProtectedNav(item.href)}
							class="relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 group
								{!user
									? 'cursor-not-allowed text-slate-500 bg-slate-800/30'
									: $page.url.pathname === item.href
										? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 border border-green-500/30'
										: 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
							disabled={!user}
							title={!user ? 'Login required' : ''}
						>
							<span class="text-xl">{item.icon}</span>
							<span>{item.label}</span>
							{#if $page.url.pathname === item.href && user}
								<div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
							{/if}
						</button>
					{:else}
						<!-- Public links -->
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
					{/if}
				{/each}
			</div>

			<!-- User Menu / CTA -->
			<div class="hidden md:flex items-center gap-4">
				{#if authInitialized}
					{#if user}
						<div class="relative user-menu-container">
							<button
								on:click={toggleUserMenu}
								class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl font-semibold shadow flex items-center gap-2 transition-all duration-200"
							>
								<span>{user.displayName || user.email?.split('@')[0] || 'User'}</span>
								<svg 
									class="w-4 h-4 transition-transform duration-200 {userMenuOpen ? 'rotate-180' : ''}" 
									fill="none" 
									stroke="currentColor" 
									viewBox="0 0 24 24"
								>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
								</svg>
							</button>
							
							{#if userMenuOpen}
								<div class="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
									<button
										on:click={handleLogout}
										class="w-full text-left px-4 py-3 hover:bg-red-600 hover:text-white transition-colors duration-200 flex items-center gap-2"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
										</svg>
										<span>Logout</span>
									</button>
								</div>
							{/if}
						</div>
					{:else}
						<button
							on:click={handleLogin}
							class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300 flex items-center gap-2"
						>
							Login
						</button>
					{/if}
				{/if}
			</div>

			<!-- Mobile menu button -->
			<button
				on:click={toggleMobileMenu}
				class="md:hidden relative w-10 h-10 text-slate-300 hover:text-white focus:outline-none"
			>
				<span class="sr-only">Open menu</span>
				<div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
					<span class="block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen ? 'rotate-45' : '-translate-y-2'}"></span>
					<span class="block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen ? 'opacity-0' : 'opacity-100'}"></span>
					<span class="block absolute h-0.5 w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen ? '-rotate-45' : 'translate-y-2'}"></span>
				</div>
			</button>
		</div>
	</div>
</nav>

<!-- Main Content -->
<main>
	{@render children?.()}
</main>

<style>
	:global(body) {
		margin: 0;
		background: #0f172a;
	}
</style>
