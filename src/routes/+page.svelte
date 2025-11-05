<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { Chart, registerables } from 'chart.js';
	import { db } from '$lib/firebase';
	import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
	import { getAuth, onAuthStateChanged } from 'firebase/auth';

	Chart.register(...registerables);

	type ClassificationData = {
		wasteType: string;	
		confidence: string;
		timestamp: any;
		imageSrc: string;
	};

	let totalDetections = 0;
	let recyclableCount = 0;
	let biodegradableCount = 0;
	let nonBiodegradableCount = 0;
	let recentActivity: any[] = [];
	let loading = true;
	let userUid: string | null = null;
	let chartInitialized = false;
	let chartElement: HTMLCanvasElement;
	let lineChartElement: HTMLCanvasElement;
	let pieChart: Chart | null = null;
	let lineChart: Chart | null = null;
	let user: any = null;



onMount(() => {
	const auth = getAuth();
onAuthStateChanged(auth, async (user) => {
	if (user) {
		userUid = user.uid;
		await loadDashboardData();
		loading = false;
	} else {
		console.warn('No user logged in.');
		loading = false;
	}
});

});



	async function loadDashboardData() {
		try {
			if (!userUid) return;

			const q = query(
				collection(db, 'classified_waste'),
				where('userId', '==', userUid),
				orderBy('timestamp', 'asc')
			);

			const querySnapshot = await getDocs(q);

			const allData: ClassificationData[] = [];
			recyclableCount = 0;
			biodegradableCount = 0;
			nonBiodegradableCount = 0;

			querySnapshot.forEach((doc) => {
				const data = doc.data() as ClassificationData;
				allData.push(data);

				const wasteType = data.wasteType.toLowerCase();
				if (wasteType.includes('recyclable')) recyclableCount++;
				else if (wasteType.includes('non-biodegradable')) nonBiodegradableCount++;
				else if (wasteType.includes('biodegradable')) biodegradableCount++;
			});

			totalDetections = allData.length;

			recentActivity = allData.slice(0, 5).map((item) => ({
				type: item.wasteType,
				time: getTimeAgo(item.timestamp?.toDate()),
				icon: getWasteIcon(item.wasteType),
				color: getWasteColor(item.wasteType)
			}));

			console.log(`✅ Dashboard data loaded for user: ${userUid}`);
		} catch (error) {
			console.error('❌ Error loading dashboard data:', error);
		}
	}


	function getTimeAgo(date: Date): string {
		if (!date) return 'Unknown';
		const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
		
		let interval = seconds / 31536000;
		if (interval > 1) return Math.floor(interval) + ' years ago';
		
		interval = seconds / 2592000;
		if (interval > 1) return Math.floor(interval) + ' months ago';
		
		interval = seconds / 86400;
		if (interval > 1) return Math.floor(interval) + ' days ago';
		
		interval = seconds / 3600;
		if (interval > 1) return Math.floor(interval) + ' hours ago';
		
		interval = seconds / 60;
		if (interval > 1) return Math.floor(interval) + ' minutes ago';
		
		return Math.floor(seconds) + ' seconds ago';
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



	async function createCharts() {
		// ✅ Double-check elements exist before drawing
		if (!chartElement || !lineChartElement) {
			console.warn('⏳ Waiting for chart elements...');
			await tick();
		}

		if (!chartElement || !lineChartElement) {
			console.error('❌ Chart elements not found even after tick()');
			return;
		}

		// Pie Chart
		const pieCtx = chartElement.getContext('2d');
		if (!pieCtx) {
			console.error('❌ Could not get context for pie chart');
			return;
		}

		// Destroy existing chart to prevent duplication
		if (pieChart) pieChart.destroy();

		pieChart = new Chart(pieCtx, {
			type: 'doughnut',
			data: {
				labels: ['Recyclable', 'Biodegradable', 'Non-Biodegradable'],
				datasets: [
					{
						data: [recyclableCount, biodegradableCount, nonBiodegradableCount],
						backgroundColor: [
							'rgba(59, 130, 246, 0.8)',
							'rgba(34, 197, 94, 0.8)',
							'rgba(239, 68, 68, 0.8)'
						],
						borderWidth: 2
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					legend: { position: 'bottom' },
					title: { display: true, text: 'Waste Distribution' }
				}
			}
		});

		// Line Chart
		const groupedData = await getGroupedByDate();
		const lineCtx = lineChartElement.getContext('2d');
		if (!lineCtx) {
			console.error('❌ Could not get context for line chart');
			return;
		}

		if (lineChart) lineChart.destroy();

		lineChart = new Chart(lineCtx, {
			type: 'line',
			data: {
				labels: groupedData.dates,
				datasets: [
					{
						label: 'Recyclable',
						data: groupedData.recyclable,
						borderColor: 'rgba(59, 130, 246, 1)',
						backgroundColor: 'rgba(59, 130, 246, 0.1)',
						tension: 0.4,
						fill: true
					},
					{
						label: 'Biodegradable',
						data: groupedData.biodegradable,
						borderColor: 'rgba(34, 197, 94, 1)',
						backgroundColor: 'rgba(34, 197, 94, 0.1)',
						tension: 0.4,
						fill: true
					},
					{
						label: 'Non-Biodegradable',
						data: groupedData.nonBiodegradable,
						borderColor: 'rgba(239, 68, 68, 1)',
						backgroundColor: 'rgba(239, 68, 68, 0.1)',
						tension: 0.4,
						fill: true
					}
				]
			},
			options: { responsive: true, maintainAspectRatio: false }
		});
	}

async function getGroupedByDate() {
	try {
		if (!userUid) return { dates: [], recyclable: [], biodegradable: [], nonBiodegradable: [] };
		
		const q = query(
			collection(db, 'classified_waste'),
			where('userId', '==', userUid),
			orderBy('timestamp', 'asc')
		);

		const querySnapshot = await getDocs(q);
		
		const dataByDate: Record<string, { recyclable: number; biodegradable: number; nonBiodegradable: number }> = {};
		
		querySnapshot.forEach((doc) => {
			const data = doc.data();
			const date = data.timestamp?.toDate().toLocaleDateString() || 'Unknown';
			
			if (!dataByDate[date]) {
				dataByDate[date] = { recyclable: 0, biodegradable: 0, nonBiodegradable: 0 };
			}
			
const wasteType = data.wasteType.toLowerCase();
if (wasteType.includes('recyclable')) dataByDate[date].recyclable++;
else if (wasteType.includes('non-biodegradable')) dataByDate[date].nonBiodegradable++; // ✅ Check this FIRST
else if (wasteType.includes('biodegradable')) dataByDate[date].biodegradable++;
		});
		
		const dates = Object.keys(dataByDate).slice(-7); // Last 7 dates
		return {
			dates,
			recyclable: dates.map(d => dataByDate[d].recyclable),
			biodegradable: dates.map(d => dataByDate[d].biodegradable),
			nonBiodegradable: dates.map(d => dataByDate[d].nonBiodegradable)
		};
	} catch (error) {
		console.error('Error grouping data:', error);
		return { dates: [], recyclable: [], biodegradable: [], nonBiodegradable: [] };
	}
}

	function getPercentage(count: number): string {
		return totalDetections > 0 ? ((count / totalDetections) * 100).toFixed(1) : '0';
	}

		// ✅ Wait until loading finishes and DOM (charts) are rendered
	$: if (!loading && userUid && !chartInitialized) {
		console.log("✅ DOM ready — initializing charts");
		chartInitialized = true;
		tick().then(() => createCharts());
	}


	// NEW: fetch aggregate counts for all users (global totals)
async function fetchGlobalCounts() {
	try {
		// query whole collection (no user filter) and aggregate
		const q = query(collection(db, 'classified_waste'), orderBy('timestamp', 'asc'));
		const snap = await getDocs(q);

		// reset
		let globalRecyclable = 0;
		let globalBiodegradable = 0;
		let globalNonBiodegradable = 0;
		let total = 0;

		snap.forEach(doc => {
			const data = doc.data();
			const t = (data.wasteType || '').toLowerCase();
			if (t.includes('recyclable')) globalRecyclable++;
			else if (t.includes('non-biodegradable')) globalNonBiodegradable++;
			else if (t.includes('biodegradable')) globalBiodegradable++;
			total++;
		});

		// replace the dashboard counts with global numbers when logged out
		// We'll keep local variables but overwrite them when not logged in
		totalDetections = total;
		recyclableCount = globalRecyclable;
		biodegradableCount = globalBiodegradable;
		nonBiodegradableCount = globalNonBiodegradable;
	} catch (err) {
		console.error('Error fetching global counts', err);
	}
}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 mb-4">
				Analytics Dashboard
			</h1>
			<p class="text-slate-300 text-lg">Track your waste classification insights</p>
		</div>

		{#if loading}
			<div class="flex flex-col items-center justify-center py-20">
				<div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
				<p class="text-slate-300 text-lg">Loading Analytics...</p>
			</div>
		{:else}
			<!-- Stats Cards -->
			<div class="grid md:grid-cols-4 gap-6 mb-12">
				<div class="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
					<div class="flex items-center justify-between mb-4">
						<div class="text-4xl">📊</div>
						<div class="bg-purple-500/30 rounded-full px-3 py-1 text-xs font-semibold text-purple-300">
							TOTAL
						</div>
					</div>
					<p class="text-slate-400 text-sm mb-1">Total Detections</p>
					<p class="text-4xl font-bold text-white">{totalDetections}</p>
				</div>

				<div class="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
					<div class="flex items-center justify-between mb-4">
						<div class="text-4xl">♻️</div>
						<div class="bg-blue-500/30 rounded-full px-3 py-1 text-xs font-semibold text-blue-300">
							{getPercentage(recyclableCount)}%
						</div>
					</div>
					<p class="text-slate-400 text-sm mb-1">Recyclable</p>
					<p class="text-4xl font-bold text-white">{recyclableCount}</p>
				</div>

				<div class="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
					<div class="flex items-center justify-between mb-4">
						<div class="text-4xl">🌱</div>
						<div class="bg-green-500/30 rounded-full px-3 py-1 text-xs font-semibold text-green-300">
							{getPercentage(biodegradableCount)}%
						</div>
					</div>
					<p class="text-slate-400 text-sm mb-1">Biodegradable</p>
					<p class="text-4xl font-bold text-white">{biodegradableCount}</p>
				</div>

				<div class="bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm transform hover:scale-105 transition-transform duration-300">
					<div class="flex items-center justify-between mb-4">
						<div class="text-4xl">🚯</div>
						<div class="bg-red-500/30 rounded-full px-3 py-1 text-xs font-semibold text-red-300">
							{getPercentage(nonBiodegradableCount)}%
						</div>
					</div>
					<p class="text-slate-400 text-sm mb-1">Non-Biodegradable</p>
					<p class="text-4xl font-bold text-white">{nonBiodegradableCount}</p>
				</div>
			</div>

			<!-- Charts Section -->
			<div class="grid md:grid-cols-2 gap-8 mb-12">
				<!-- Pie Chart -->
				<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8">
					<div style="height: 400px;">
						<canvas bind:this={chartElement}></canvas>
					</div>
				</div>

				<!-- Line Chart -->
				<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8">
					<div style="height: 400px;">
						<canvas bind:this={lineChartElement}></canvas>
					</div>
				</div>
			</div>

			<!-- Recent Activity -->
			<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 mb-12">
				<h2 class="text-2xl font-bold text-white mb-6 flex items-center gap-3">
					<svg class="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					Recent Activity
				</h2>
				
				{#if recentActivity.length > 0}
					<div class="space-y-4">
{#each recentActivity as activity}
    <div class="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors duration-200">
        <div class="text-3xl">
            {#if activity.type === 'Biodegradable'}
                🌱
            {:else if activity.type === 'Non-biodegradable'}
                🚯
            {:else if activity.type === 'Recyclable'}
                ♻️
            {/if}
        </div>
        <div class="flex-1">
            <p class="text-white font-semibold">{activity.type}</p>
            <p class="text-slate-400 text-sm">{activity.time}</p>
        </div>
        <div class="bg-{activity.color}-500/20 text-{activity.color}-400 px-4 py-2 rounded-lg text-sm font-semibold">
            Classified
        </div>
    </div>
{/each}

					</div>
				{:else}
					<p class="text-slate-400 text-center py-8">No recent activity</p>
				{/if}
			</div>

<!-- Environmental Impact Section -->
<div class="grid md:grid-cols-3 gap-6">
    <div class="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-sm">
        <div class="text-5xl mb-4">🌍</div>
        <h3 class="text-xl font-bold text-cyan-400 mb-2">CO₂ Saved</h3>
        <p class="text-3xl font-bold text-white mb-2">
            {((recyclableCount * 0.5) + (biodegradableCount * 0.3)).toFixed(1)} kg
        </p>
        <p class="text-slate-400 text-sm">Estimated carbon footprint reduction</p>
    </div>

    <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6 backdrop-blur-sm">
        <div class="text-5xl mb-4">💧</div>
        <h3 class="text-xl font-bold text-green-400 mb-2">Water Saved</h3>
        <p class="text-3xl font-bold text-white mb-2">
            {((recyclableCount * 15) + (biodegradableCount * 5)).toFixed(0)} L
        </p>
        <p class="text-slate-400 text-sm">Through proper recycling practices</p>
    </div>

    <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
        <div class="text-5xl mb-4">⚡</div>
        <h3 class="text-xl font-bold text-purple-400 mb-2">Energy Saved</h3>
        <p class="text-3xl font-bold text-white mb-2">
            {((recyclableCount * 2.3) + (biodegradableCount * 1.5)).toFixed(1)} kWh
        </p>
        <p class="text-slate-400 text-sm">Renewable energy equivalent</p>
    </div>
</div>
		{/if}
	</div>
</div>

<style>
	:global(body) {
		background: #0f172a;
	}
</style>