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

	function handleGetStarted() {
		goto('/register');
	}

async function handleLogout() {
    try {
        await signOut(auth);
        userMenuOpen = false;
        // Wait a bit for auth state to clear
        await new Promise(resolve => setTimeout(resolve, 100));
        goto('/');
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
		closeMobileMenu();
	}

	const navItems = [
		{ href: '/dashboard', label: 'Dashboard', icon: '📊', protected: false },
		{ href: '/wasteClassifier', label: 'Classifier', icon: '🔍', protected: true },
		{ href: '/history', label: 'History', icon: '📜', protected: true },
		{ href: '/about', label: 'About', icon: 'ℹ️', protected: false }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!-- Modern Navbar -->
<nav class="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-3 group">
				<div class="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/30">
					<span class="text-2xl">♻️</span>
				</div>
				<div class="hidden sm:block">
					<h1 class="text-xl font-bold text-white">EcoSort AI</h1>
					<p class="text-xs text-slate-400">Waste Classification System</p>
				</div>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden md:flex items-center gap-1">
				{#each navItems as item}
					{#if item.protected}
						<!-- Protected links -->
						<button
							on:click={() => handleProtectedNav(item.href)}
							class="relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
								{!user
									? 'cursor-not-allowed text-slate-500'
									: $page.url.pathname === item.href
										? 'bg-slate-800 text-white'
										: 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
							disabled={!user}
							title={!user ? 'Login required' : ''}
						>
							<span class="text-lg">{item.icon}</span>
							<span>{item.label}</span>
						</button>
					{:else}
						<!-- Public links -->
						<a
							href={item.href}
							class="relative px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
								{$page.url.pathname === item.href 
									? 'bg-slate-800 text-white' 
									: 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
						>
							<span class="text-lg">{item.icon}</span>
							<span>{item.label}</span>
						</a>
					{/if}
				{/each}
			</div>

			<!-- User Menu / Auth Buttons -->
			<div class="hidden md:flex items-center gap-3">
				{#if authInitialized}
					{#if user}
						<div class="relative user-menu-container">
							<button
								on:click={toggleUserMenu}
								class="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-all duration-200"
							>
								<div class="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">
									{(user.displayName || user.email)?.[0]?.toUpperCase() || 'U'}
								</div>
								<span class="max-w-[120px] truncate">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
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
								<div class="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden">
									<div class="px-4 py-3 border-b border-slate-700">
										<p class="text-sm text-slate-400">Signed in as</p>
										<p class="text-sm text-white font-medium truncate">{user.email}</p>
									</div>
									<button
										on:click={handleLogout}
										class="w-full text-left px-4 py-2 text-slate-300 hover:bg-red-600 hover:text-white transition-colors duration-200 flex items-center gap-2"
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
							class="px-5 py-2 text-white hover:text-blue-400 transition-colors font-medium"
						>
							Login
						</button>
						<button
							on:click={handleGetStarted}
							class="px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 font-medium shadow-lg shadow-blue-500/30"
						>
							Get Started
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

	<!-- Mobile Menu -->
	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-slate-700/50 bg-slate-900/98 backdrop-blur-xl">
			<div class="px-4 py-4 space-y-2">
				{#each navItems as item}
					{#if item.protected}
						<button
							on:click={() => handleProtectedNav(item.href)}
							class="w-full text-left px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3
								{!user
									? 'cursor-not-allowed text-slate-500 bg-slate-800/30'
									: $page.url.pathname === item.href
										? 'bg-slate-800 text-white'
										: 'text-slate-300 hover:bg-slate-800/50'}"
							disabled={!user}
						>
							<span class="text-xl">{item.icon}</span>
							<span>{item.label}</span>
							{#if !user}
								<span class="ml-auto text-xs bg-slate-700 px-2 py-1 rounded">Login Required</span>
							{/if}
						</button>
					{:else}
						<a
							href={item.href}
							on:click={closeMobileMenu}
							class="block px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-3
								{$page.url.pathname === item.href 
									? 'bg-slate-800 text-white' 
									: 'text-slate-300 hover:bg-slate-800/50'}"
						>
							<span class="text-xl">{item.icon}</span>
							<span>{item.label}</span>
						</a>
					{/if}
				{/each}

				<!-- Mobile Auth Buttons -->
				{#if authInitialized}
					{#if user}
						<div class="pt-4 border-t border-slate-700/50 space-y-2">
							<div class="px-4 py-2">
								<p class="text-xs text-slate-400">Signed in as</p>
								<p class="text-sm text-white font-medium truncate">{user.email}</p>
							</div>
							<button
								on:click={handleLogout}
								class="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
							>
								<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								<span>Logout</span>
							</button>
						</div>
					{:else}
						<div class="pt-4 border-t border-slate-700/50 space-y-2">
							<button
								on:click={() => { handleLogin(); closeMobileMenu(); }}
								class="w-full px-4 py-3 text-white border border-slate-700 hover:bg-slate-800 rounded-lg font-medium transition-colors"
							>
								Login
							</button>
							<button
								on:click={() => { handleGetStarted(); closeMobileMenu(); }}
								class="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 font-medium transition-all"
							>
								Get Started
							</button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
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