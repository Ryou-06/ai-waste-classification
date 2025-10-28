<script lang="ts">
	import { onMount } from 'svelte';
	import { db } from '$lib/firebase';
	import { collection, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';

	type HistoryItem = {
		id: string;
		image: string;
		prediction: string;
		confidence: string;
		date: string;
		timestamp: any;
	};

	let history: HistoryItem[] = [];
	let filteredHistory: HistoryItem[] = [];
	let loading = true;
	let selectedFilter = 'all';
	let showDeleteModal = false;
	let itemToDelete: string | null = null;
	let viewMode: 'grid' | 'list' = 'grid';

	const filters = [
		{ value: 'all', label: 'All Items', icon: '🗂️' },
		{ value: 'recyclable', label: 'Recyclable', icon: '♻️' },
		{ value: 'biodegradable', label: 'Biodegradable', icon: '🌱' },
		{ value: 'non-biodegradable', label: 'Non-Biodegradable', icon: '🚯' }
	];

	onMount(async () => {
		await loadHistoryFromFirestore();
		loading = false;
	});

	async function loadHistoryFromFirestore() {
		try {
			const q = query(collection(db, 'classified_waste'), orderBy('timestamp', 'desc'));
			const querySnapshot = await getDocs(q);
			history = querySnapshot.docs.map((docSnap) => {
				const data = docSnap.data();
				return {
					id: docSnap.id,
					image: data.imageSrc,
					prediction: data.wasteType,
					confidence: data.confidence,
					date: data.timestamp?.toDate().toLocaleString() || 'Unknown',
					timestamp: data.timestamp
				};
			});
			filteredHistory = history;
			console.log('✅ History loaded from Firestore:', history);
		} catch (error) {
			console.error('❌ Error loading history:', error);
		}
	}

	function filterHistory(filterValue: string) {
		selectedFilter = filterValue;
		if (filterValue === 'all') {
			filteredHistory = history;
		} else {
			filteredHistory = history.filter((item) =>
				item.prediction.toLowerCase().includes(filterValue.toLowerCase())
			);
		}
	}

	function confirmDelete(id: string) {
		itemToDelete = id;
		showDeleteModal = true;
	}

	async function deleteItem() {
		if (!itemToDelete) return;
		
		try {
			await deleteDoc(doc(db, 'classified_waste', itemToDelete));
			history = history.filter((item) => item.id !== itemToDelete);
			filterHistory(selectedFilter);
			showDeleteModal = false;
			itemToDelete = null;
			console.log('✅ Item deleted successfully');
		} catch (error) {
			console.error('❌ Error deleting item:', error);
			alert('Failed to delete item. Please try again.');
		}
	}

	async function clearAllHistory() {
		if (!confirm('Are you sure you want to delete ALL classification history? This cannot be undone.')) {
			return;
		}

		try {
			const deletePromises = history.map((item) => 
				deleteDoc(doc(db, 'classified_waste', item.id))
			);
			await Promise.all(deletePromises);
			history = [];
			filteredHistory = [];
			console.log('✅ All history cleared');
		} catch (error) {
			console.error('❌ Error clearing history:', error);
			alert('Failed to clear history. Please try again.');
		}
	}

	function getWasteIcon(category: string) {
		const lower = category.toLowerCase();
		if (lower.includes('recyclable')) return '♻️';
		if (lower.includes('biodegradable')) return '🌱';
		if (lower.includes('non-biodegradable')) return '🚯';
		return '🗑️';
	}

	function getWasteColor(category: string) {
		const lower = category.toLowerCase();
		if (lower.includes('recyclable')) return 'blue';
		if (lower.includes('biodegradable')) return 'green';
		if (lower.includes('non-biodegradable')) return 'red';
		return 'gray';
	}

	function getBadgeClass(category: string) {
		const lower = category.toLowerCase();
		if (lower.includes('recyclable')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
		if (lower.includes('biodegradable')) return 'bg-green-500/20 text-green-400 border-green-500/30';
		if (lower.includes('non-biodegradable')) return 'bg-red-500/20 text-red-400 border-red-500/30';
		return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-4">
				Classification History
			</h1>
			<p class="text-slate-300 text-lg">View and manage your waste classification records</p>
		</div>

		{#if loading}
			<div class="flex flex-col items-center justify-center py-20">
				<div class="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
				<p class="text-slate-300 text-lg">Loading History...</p>
			</div>
		{:else if history.length === 0}
			<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-12 text-center">
				<div class="text-7xl mb-6">📭</div>
				<h3 class="text-2xl font-bold text-white mb-3">No Classification History</h3>
				<p class="text-slate-400 mb-6">Start classifying waste items to see them here!</p>
				<a
					href="/wasteClassifier"
					class="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-green-500/50 transform hover:scale-105 transition-all duration-300"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
					</svg>
					Start Classifying
				</a>
			</div>
		{:else}
			<!-- Controls Bar -->
			<div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-700/50 p-6 mb-8">
				<div class="flex flex-wrap items-center justify-between gap-4">
					<!-- Filters -->
					<div class="flex flex-wrap gap-2">
						{#each filters as filter}
							<button
								onclick={() => filterHistory(filter.value)}
								class="px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2
									{selectedFilter === filter.value
										? 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 border-2 border-purple-500/50'
										: 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 border-2 border-transparent'}"
							>
								<span class="text-xl">{filter.icon}</span>
								<span>{filter.label}</span>
								{#if filter.value === 'all'}
									<span class="bg-slate-600 text-white px-2 py-0.5 rounded-full text-xs">
										{history.length}
									</span>
								{:else}
									<span class="bg-slate-600 text-white px-2 py-0.5 rounded-full text-xs">
										{history.filter(item => item.prediction.toLowerCase().includes(filter.value.toLowerCase())).length}
									</span>
								{/if}
							</button>
						{/each}
					</div>

					<!-- View Toggle & Clear Button -->
					<div class="flex gap-3">
						<div class="bg-slate-700/50 rounded-xl p-1 flex gap-1">
							<button
								onclick={() => viewMode = 'grid'}
								class="px-4 py-2 rounded-lg transition-all duration-200 {viewMode === 'grid' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
								</svg>
							</button>
							<button
								onclick={() => viewMode = 'list'}
								class="px-4 py-2 rounded-lg transition-all duration-200 {viewMode === 'list' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}"
							>
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
								</svg>
							</button>
						</div>

						<button
							onclick={clearAllHistory}
							class="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 transition-all duration-300 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-red-500/50 hover:scale-105 transform flex items-center gap-2"
						>
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
							</svg>
							Clear All
						</button>
					</div>
				</div>
			</div>

			<!-- Results Count -->
			<div class="mb-6">
				<p class="text-slate-400">
					Showing <span class="text-white font-semibold">{filteredHistory.length}</span> of 
					<span class="text-white font-semibold">{history.length}</span> items
				</p>
			</div>

			<!-- Grid View -->
			{#if viewMode === 'grid'}
				<div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
					{#each filteredHistory as item (item.id)}
						<div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl hover:scale-105 transform transition-all duration-300 group">
							<div class="relative overflow-hidden">
								<img 
									src={item.image} 
									alt="Waste classification" 
									class="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500"
								/>
								<div class="absolute top-4 right-4">
									<button
										onclick={() => confirmDelete(item.id)}
										class="bg-red-500/80 hover:bg-red-500 backdrop-blur-sm text-white p-2 rounded-lg transition-all duration-200 hover:scale-110"
										title="Delete"
									>
										<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</div>
								<div class="absolute top-4 left-4">
									<div class="text-5xl drop-shadow-lg">
										{getWasteIcon(item.prediction)}
									</div>
								</div>
							</div>
							<div class="p-6">
								<div class="flex items-center justify-between mb-3">
									<span class="px-4 py-2 rounded-xl text-sm font-semibold border {getBadgeClass(item.prediction)}">
										{item.prediction}
									</span>
									<span class="text-slate-400 text-sm font-semibold">
										{item.confidence}
									</span>
								</div>
								<div class="flex items-center gap-2 text-slate-400 text-sm">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									{item.date}
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- List View -->
			{#if viewMode === 'list'}
				<div class="space-y-4">
					{#each filteredHistory as item (item.id)}
						<div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group">
							<div class="flex flex-col md:flex-row">
								<div class="relative md:w-64 h-48 md:h-auto flex-shrink-0 overflow-hidden">
									<img 
										src={item.image} 
										alt="Waste classification" 
										class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
									/>
									<div class="absolute top-4 left-4 text-4xl drop-shadow-lg">
										{getWasteIcon(item.prediction)}
									</div>
								</div>
								<div class="flex-1 p-6 flex flex-col justify-between">
									<div>
										<div class="flex items-start justify-between mb-4">
											<div>
												<span class="px-4 py-2 rounded-xl text-sm font-semibold border {getBadgeClass(item.prediction)} inline-block mb-2">
													{item.prediction}
												</span>
												<div class="flex items-center gap-4 text-slate-400 text-sm mt-2">
													<div class="flex items-center gap-2">
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														Confidence: <span class="text-white font-semibold">{item.confidence}</span>
													</div>
													<div class="flex items-center gap-2">
														<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
															<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
														</svg>
														{item.date}
													</div>
												</div>
											</div>
											<button
												onclick={() => confirmDelete(item.id)}
												class="bg-red-500/20 hover:bg-red-500 border border-red-500/30 text-red-400 hover:text-white px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
												</svg>
												Delete
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
		<div class="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full shadow-2xl transform scale-100 animate-fade-in">
			<div class="text-center mb-6">
				<div class="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
					</svg>
				</div>
				<h3 class="text-2xl font-bold text-white mb-2">Delete Classification</h3>
				<p class="text-slate-400">Are you sure you want to delete this item? This action cannot be undone.</p>
			</div>
			<div class="flex gap-4">
				<button
					onclick={() => { showDeleteModal = false; itemToDelete = null; }}
					class="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
				>
					Cancel
				</button>
				<button
					onclick={deleteItem}
					class="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
				>
					Delete
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	.animate-fade-in {
		animation: fade-in 0.2s ease-out;
	}
</style>