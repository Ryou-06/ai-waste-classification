<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { getAuth, signOut, onAuthStateChanged } from 'firebase/auth';
	import { doc, getDoc } from 'firebase/firestore';
	import { onMount } from 'svelte';

	let { children } = $props();
	let mobileMenuOpen = $state(false);
	let userMenuOpen = $state(false);
	let user: any = $state(null);
	let userProfile: any = $state(null);
	let authInitialized = $state(false);

	import { auth, db } from '$lib/firebase';

	onMount(() => {
		const unsubscribe = onAuthStateChanged(auth!, async (currentUser) => {
			user = currentUser;
			authInitialized = true;
			console.log('Auth state changed:', currentUser ? 'Logged in' : 'Logged out');
			
			// Fetch user profile data from Firestore
			if (currentUser) {
				try {
					const userDocRef = doc(db!, 'users', currentUser.uid);
					const userDoc = await getDoc(userDocRef);
					if (userDoc.exists()) {
						userProfile = userDoc.data();
						console.log('User profile loaded:', userProfile);
					}
				} catch (error) {
					console.error('Error fetching user profile:', error);
				}
			} else {
				userProfile = null;
			}
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

	function handleProfileNav() {
		userMenuOpen = false;
		goto('/profile');
	}

	async function handleLogout() {
		try {
			await signOut(auth!);
			userMenuOpen = false;
			userProfile = null;
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
		{ href: '/dashboard', label: 'Dashboard', icon: '📊', protected: true },
		{ href: '/wasteClassifier', label: 'Classifier', icon: '🔍', protected: true },
		{ href: '/history', label: 'History', icon: '📜', protected: true },
		{ href: '/about', label: 'About', icon: 'ℹ️', protected: false }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
</svelte:head>

<!-- Modern Navbar -->
<nav class="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
	<div class="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
		<div class="flex items-center justify-between h-14 sm:h-16">
			<!-- Logo -->
			<a href="/" class="flex items-center gap-2 sm:gap-3 group min-w-0">
				<div class="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-green-500/30 flex-shrink-0">
					<span class="text-xl sm:text-2xl">♻️</span>
				</div>
				<div class="hidden xs:block min-w-0">
					<h1 class="text-base sm:text-xl font-bold text-white truncate">EcoSort AI</h1>
					<p class="text-[10px] sm:text-xs text-slate-400 truncate hidden sm:block">Waste Classification System</p>
				</div>
			</a>

			<!-- Desktop Navigation -->
			<div class="hidden lg:flex items-center gap-1 flex-1 justify-center">
				{#each navItems as item}
					{#if item.protected}
						<button
							on:click={() => handleProtectedNav(item.href)}
							class="relative px-3 xl:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm xl:text-base
								{!user
									? 'cursor-not-allowed text-slate-500'
									: $page.url.pathname === item.href
										? 'bg-slate-800 text-white'
										: 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
							disabled={!user}
							title={!user ? 'Login required' : ''}
						>
							<span class="text-base xl:text-lg">{item.icon}</span>
							<span class="hidden xl:inline">{item.label}</span>
						</button>
					{:else}
						<a
							href={item.href}
							class="relative px-3 xl:px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 text-sm xl:text-base
								{$page.url.pathname === item.href 
									? 'bg-slate-800 text-white' 
									: 'text-slate-300 hover:text-white hover:bg-slate-800/50'}"
						>
							<span class="text-base xl:text-lg">{item.icon}</span>
							<span class="hidden xl:inline">{item.label}</span>
						</a>
					{/if}
				{/each}
			</div>

			<!-- USER MENU (Avatar updated here) -->
			<div class="hidden lg:flex items-center gap-2 xl:gap-3">
				{#if authInitialized}
					{#if user}
						<div class="relative user-menu-container">
							<button
								on:click={toggleUserMenu}
								class="bg-slate-800 hover:bg-slate-700 text-white px-3 xl:px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 transition-all duration-200 text-sm xl:text-base"
							>

								<!-- UPDATED AVATAR -->
								{#if userProfile?.photoURL}
									<img
										src={userProfile.photoURL}
										alt="Profile"
										class="w-6 h-6 xl:w-7 xl:h-7 rounded-full object-cover border border-slate-600 flex-shrink-0"
									/>
								{:else}
									<div class="w-6 h-6 xl:w-7 xl:h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-xs xl:text-sm font-bold flex-shrink-0">
										{(userProfile?.displayName || user.displayName || user.email)?.[0]?.toUpperCase() || 'U'}
									</div>
								{/if}

								<span class="max-w-[80px] xl:max-w-[120px] truncate">{userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'User'}</span>

								<svg 
									class="w-3 h-3 xl:w-4 xl:h-4 transition-transform duration-200 flex-shrink-0 {userMenuOpen ? 'rotate-180' : ''}" 
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
										on:click={handleProfileNav}
										class="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors duration-200 flex items-center gap-2"
									>
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
										</svg>
										<span>Profile</span>
									</button>
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
							class="px-3 xl:px-5 py-2 text-white hover:text-blue-400 transition-colors font-medium text-sm xl:text-base"
						>
							Login
						</button>
						<button
							on:click={handleGetStarted}
							class="px-3 xl:px-5 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 font-medium shadow-lg shadow-blue-500/30 text-sm xl:text-base"
						>
							Get Started
						</button>
					{/if}
				{/if}
			</div>

			<!-- Mobile Menu Button -->
			<button
				on:click={toggleMobileMenu}
				class="lg:hidden relative w-9 h-9 sm:w-10 sm:h-10 text-slate-300 hover:text-white focus:outline-none flex-shrink-0"
				aria-label="Toggle menu"
			>
				<span class="sr-only">Open menu</span>
				<div class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
					<span class="block absolute h-0.5 w-5 sm:w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen ? 'rotate-45' : '-translate-y-2'}"></span>
					<span class="block absolute h-0.5 w-5 sm:w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen ? 'opacity-0' : 'opacity-100'}"></span>
					<span class="block absolute h-0.5 w-5 sm:w-6 bg-current transform transition duration-300 ease-in-out {mobileMenuOpen ? '-rotate-45' : 'translate-y-2'}"></span>
				</div>
			</button>
		</div>
	</div>

	<!-- MOBILE MENU (Updated profile avatar also here) -->
	{#if mobileMenuOpen}
		<div class="lg:hidden border-t border-slate-700/50 bg-slate-900/98 backdrop-blur-xl max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto">
			<div class="px-3 sm:px-4 py-3 sm:py-4 space-y-1.5 sm:space-y-2">
				
				<!-- Navigation Items -->
				{#each navItems as item}
					{#if item.protected}
						<button
							on:click={() => handleProtectedNav(item.href)}
							class="w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2.5 sm:gap-3 text-sm sm:text-base
								{!user
									? 'cursor-not-allowed text-slate-500 bg-slate-800/30'
									: $page.url.pathname === item.href
										? 'bg-slate-800 text-white'
										: 'text-slate-300 hover:bg-slate-800/50 active:bg-slate-800'}"
							disabled={!user}
						>
							<span class="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
							<span class="flex-1">{item.label}</span>
							{#if !user}
								<span class="ml-auto text-[10px] sm:text-xs bg-slate-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap flex-shrink-0">Login Required</span>
							{/if}
						</button>
					{:else}
						<a
							href={item.href}
							on:click={closeMobileMenu}
							class="block px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2.5 sm:gap-3 text-sm sm:text-base
								{$page.url.pathname === item.href 
									? 'bg-slate-800 text-white' 
									: 'text-slate-300 hover:bg-slate-800/50 active:bg-slate-800'}"
						>
							<span class="text-lg sm:text-xl flex-shrink-0">{item.icon}</span>
							<span>{item.label}</span>
						</a>
					{/if}
				{/each}

				<!-- MOBILE USER SECTION -->
				{#if authInitialized}
					{#if user}
						<div class="pt-3 sm:pt-4 border-t border-slate-700/50 space-y-1.5 sm:space-y-2">

							<div class="px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-3">

								<!-- UPDATED MOBILE AVATAR -->
								{#if userProfile?.photoURL}
									<img
										src={userProfile.photoURL}
										alt="Profile"
										class="w-8 h-8 rounded-full object-cover border border-slate-600"
									/>
								{:else}
									<div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-sm font-bold">
										{(userProfile?.displayName || user.displayName || user.email)?.[0]?.toUpperCase() || 'U'}
									</div>
								{/if}

								<div>
									<p class="text-[10px] sm:text-xs text-slate-400">Signed in as</p>
									<p class="text-xs sm:text-sm text-white font-medium truncate">{user.email}</p>
								</div>
							</div>

							<button
								on:click={() => { handleProfileNav(); closeMobileMenu(); }}
								class="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
							>
								<svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
								<span>My Profile</span>
							</button>

							<button
								on:click={handleLogout}
								class="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
							>
								<svg class="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
								</svg>
								<span>Logout</span>
							</button>

						</div>
					{:else}
						<div class="pt-3 sm:pt-4 border-t border-slate-700/50 space-y-1.5 sm:space-y-2">
							<button
								on:click={() => { handleLogin(); closeMobileMenu(); }}
								class="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-white border border-slate-700 hover:bg-slate-800 active:bg-slate-700 rounded-lg font-medium transition-colors text-sm sm:text-base"
							>
								Login
							</button>
							<button
								on:click={() => { handleGetStarted(); closeMobileMenu(); }}
								class="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 active:from-blue-700 active:to-cyan-700 font-medium transition-all text-sm sm:text-base"
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
<main class="min-h-screen">
	{@render children?.()}
</main>

<style>
	:global(body) {
		margin: 0;
		background: #0f172a;
		overflow-x: hidden;
	}

	@media (max-width: 1023px) {
		button, a {
			-webkit-tap-highlight-color: transparent;
		}
	}

	@media (min-width: 375px) {
		.xs\:block {
			display: block;
		}
	}
</style>