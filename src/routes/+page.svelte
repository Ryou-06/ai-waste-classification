<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';
  import { db } from '$lib/firebase';
  import { collection, getDocs, query, orderBy } from 'firebase/firestore';

  let user: any = null;
  let loading = true;
  let statsLoading = true;
  
  // Environmental impact stats
  let totalItems = 0;
  let co2Saved = 0;
  let waterSaved = 0;
  let energySaved = 0;
  let recyclableCount = 0;
  let biodegradableCount = 0;
  let nonBiodegradableCount = 0;

  onMount(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      user = currentUser;
      loading = false;
      
      // If user is logged in, redirect to dashboard
      if (currentUser) {
        goto('/dashboard');
      }
    });

    // Fetch global statistics from ALL users
    fetchGlobalStats();

    return () => unsubscribe();
  });

async function fetchGlobalStats() {
  try {
    statsLoading = true;
    
    // Query entire collection (ALL users, no filter or ordering)
    const wasteRef = collection(db!, 'classified_waste');
    const querySnapshot = await getDocs(wasteRef);
    
    console.log('📊 Total documents fetched:', querySnapshot.size);
    
    // Reset counts
    recyclableCount = 0;
    biodegradableCount = 0;
    nonBiodegradableCount = 0;

    // Count each waste type from ALL users
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const wasteType = (data.wasteType || '').toLowerCase().trim();
      
      console.log('🔍 Document:', doc.id, 'wasteType:', data.wasteType);
      
      // More flexible matching
      if (wasteType.includes('recyclable') && !wasteType.includes('non')) {
        recyclableCount++;
      } else if (wasteType.includes('non-biodegradable') || wasteType.includes('nonbiodegradable')) {
        nonBiodegradableCount++;
      } else if (wasteType.includes('biodegradable')) {
        biodegradableCount++;
      }
    });

    totalItems = querySnapshot.size;

    // Calculate environmental impact based on waste counts
    co2Saved = (recyclableCount * 0.5) + (biodegradableCount * 0.3) + (nonBiodegradableCount * 0.1);
    waterSaved = (recyclableCount * 15) + (biodegradableCount * 5) + (nonBiodegradableCount * 2);
    energySaved = (recyclableCount * 2.3) + (biodegradableCount * 1.5) + (nonBiodegradableCount * 0.5);
    
    statsLoading = false;
    console.log('✅ Global stats loaded from ALL users:', { 
      totalItems, 
      recyclableCount, 
      biodegradableCount, 
      nonBiodegradableCount,
      co2Saved: co2Saved.toFixed(1),
      waterSaved: waterSaved.toFixed(0),
      energySaved: energySaved.toFixed(1)
    });
  } catch (error) {
    console.error('❌ Error fetching global stats:', error);
    statsLoading = false;
  }
}

  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toFixed(1);
  }

  function handleGetStarted() {
    goto('/register');
  }

  function handleLogin() {
    goto('/login');
  }
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
</svelte:head>

{#if loading}
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div class="w-12 h-12 sm:w-16 sm:h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">

    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20">
      <div class="text-center mb-12 sm:mb-16">
        <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 mb-4 sm:mb-6">
          <span class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span class="text-blue-400 text-xs sm:text-sm font-semibold">AI-Powered Classification</span>
        </div>
        
        <h1 class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 mb-4 sm:mb-6 leading-tight px-2">
          Smart Waste<br />Classification
        </h1>
        
        <p class="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 max-w-3xl mx-auto leading-relaxed px-4">
          Harness the power of artificial intelligence to classify waste accurately. 
          Make recycling easier, faster, and more effective for a sustainable future.
        </p>

        <div class="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4">
          <button
            on:click={handleGetStarted}
            class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-base sm:text-lg font-semibold hover:from-blue-600 hover:to-cyan-600 active:from-blue-700 active:to-cyan-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/50"
          >
            Start Classifying Now →
          </button>
          <button
            on:click={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            class="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 text-white rounded-xl text-base sm:text-lg font-semibold hover:bg-slate-700/50 active:bg-slate-700 transition-all"
          >
            Learn More
          </button>
        </div>
      </div>

      <!-- Global Environmental Impact Stats from ALL Users -->
      <div class="mb-12 sm:mb-16 md:mb-20 px-2">
        <div class="text-center mb-6 sm:mb-8">
          <h2 class="text-2xl sm:text-3xl font-bold text-white mb-2">🌍 Collective Environmental Impact</h2>
          <p class="text-sm sm:text-base text-slate-400">Real-time impact from our entire community</p>
        </div>
        
        {#if statsLoading}
          <div class="flex justify-center py-8">
            <div class="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        {:else}
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
            <!-- CO2 Saved -->
            <div class="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center backdrop-blur-xl">
              <div class="w-16 h-16 sm:w-20 sm:h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-4xl sm:text-5xl">🌍</span>
              </div>
              <h3 class="text-lg sm:text-xl font-semibold text-blue-400 mb-2">CO₂ Saved</h3>
              <p class="text-3xl sm:text-4xl font-bold text-white mb-1">{formatNumber(co2Saved)} kg</p>
              <p class="text-xs sm:text-sm text-slate-400">Estimated carbon footprint reduction</p>
            </div>

            <!-- Water Saved -->
            <div class="bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center backdrop-blur-xl">
              <div class="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-4xl sm:text-5xl">💧</span>
              </div>
              <h3 class="text-lg sm:text-xl font-semibold text-green-400 mb-2">Water Saved</h3>
              <p class="text-3xl sm:text-4xl font-bold text-white mb-1">{formatNumber(waterSaved)} L</p>
              <p class="text-xs sm:text-sm text-slate-400">Through proper recycling practices</p>
            </div>

            <!-- Energy Saved -->
            <div class="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center backdrop-blur-xl sm:col-span-2 lg:col-span-1">
              <div class="w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-4xl sm:text-5xl">⚡</span>
              </div>
              <h3 class="text-lg sm:text-xl font-semibold text-purple-400 mb-2">Energy Saved</h3>
              <p class="text-3xl sm:text-4xl font-bold text-white mb-1">{formatNumber(energySaved)} kWh</p>
              <p class="text-xs sm:text-sm text-slate-400">Renewable energy equivalent</p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-12 sm:mb-16 md:mb-20 px-2">
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50 text-center">
          <div class="text-3xl sm:text-4xl mb-1 sm:mb-2">🎯</div>
          <p class="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">98%</p>
          <p class="text-slate-400 text-xs sm:text-sm">Accuracy Rate</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50 text-center">
          <div class="text-3xl sm:text-4xl mb-1 sm:mb-2">⚡</div>
          <p class="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">&lt;2s</p>
          <p class="text-slate-400 text-xs sm:text-sm">Classification Time</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50 text-center">
          <div class="text-3xl sm:text-4xl mb-1 sm:mb-2">🌍</div>
          <p class="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{statsLoading ? '...' : formatNumber(totalItems)}+</p>
          <p class="text-slate-400 text-xs sm:text-sm">Waste Items Sorted</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-700/50 text-center">
          <div class="text-3xl sm:text-4xl mb-1 sm:mb-2">♻️</div>
          <p class="text-2xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">3</p>
          <p class="text-slate-400 text-xs sm:text-sm">Waste Categories</p>
        </div>
      </div>

      <!-- Features Section -->
      <div id="features" class="mb-12 sm:mb-16 md:mb-20 px-2">
        <h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-8 sm:mb-12 px-4">How It Works</h2>
        <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div class="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-blue-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <span class="text-3xl sm:text-4xl">📸</span>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">1. Upload Image</h3>
            <p class="text-sm sm:text-base text-slate-300 leading-relaxed">
              Take a photo or upload an image of your waste item. Our system supports various image formats.
            </p>
          </div>

          <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <span class="text-3xl sm:text-4xl">🤖</span>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">2. AI Analysis</h3>
            <p class="text-sm sm:text-base text-slate-300 leading-relaxed">
              Advanced machine learning algorithms analyze and classify your waste in real-time with high accuracy.
            </p>
          </div>

          <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl sm:rounded-2xl p-6 sm:p-8 sm:col-span-2 md:col-span-1">
            <div class="w-12 h-12 sm:w-16 sm:h-16 bg-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-4 sm:mb-6">
              <span class="text-3xl sm:text-4xl">✅</span>
            </div>
            <h3 class="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">3. Get Results</h3>
            <p class="text-sm sm:text-base text-slate-300 leading-relaxed">
              Receive instant classification results: Recyclable, Biodegradable, or Non-biodegradable.
            </p>
          </div>
        </div>
      </div>

      <!-- Waste Categories -->
      <div class="mb-12 sm:mb-16 md:mb-20 px-2">
        <h2 class="text-3xl sm:text-4xl font-bold text-center text-white mb-8 sm:mb-12 px-4">Waste Categories</h2>
        <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-blue-500/30 hover:border-blue-500/50 active:border-blue-500/60 transition-all">
            <div class="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">♻️</div>
            <h3 class="text-xl sm:text-2xl font-bold text-blue-400 mb-3 sm:mb-4 text-center">Recyclable</h3>
            <p class="text-sm sm:text-base text-slate-300 text-center mb-3 sm:mb-4">Materials that can be reprocessed</p>
            <ul class="text-slate-400 text-xs sm:text-sm space-y-1.5 sm:space-y-2">
              <li>• Plastic bottles & containers</li>
              <li>• Paper & cardboard</li>
              <li>• Glass bottles</li>
              <li>• Metal cans</li>
            </ul>
          </div>

          <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-green-500/30 hover:border-green-500/50 active:border-green-500/60 transition-all">
            <div class="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🌱</div>
            <h3 class="text-xl sm:text-2xl font-bold text-green-400 mb-3 sm:mb-4 text-center">Biodegradable</h3>
            <p class="text-sm sm:text-base text-slate-300 text-center mb-3 sm:mb-4">Organic matter that decomposes naturally</p>
            <ul class="text-slate-400 text-xs sm:text-sm space-y-1.5 sm:space-y-2">
              <li>• Food scraps & leftovers</li>
              <li>• Fruit & vegetable peels</li>
              <li>• Garden waste</li>
              <li>• Paper products</li>
            </ul>
          </div>

          <div class="bg-slate-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl p-6 sm:p-8 border border-red-500/30 hover:border-red-500/50 active:border-red-500/60 transition-all sm:col-span-2 md:col-span-1">
            <div class="text-5xl sm:text-6xl mb-3 sm:mb-4 text-center">🚯</div>
            <h3 class="text-xl sm:text-2xl font-bold text-red-400 mb-3 sm:mb-4 text-center">Non-Biodegradable</h3>
            <p class="text-sm sm:text-base text-slate-300 text-center mb-3 sm:mb-4">Materials that don't decompose easily</p>
            <ul class="text-slate-400 text-xs sm:text-sm space-y-1.5 sm:space-y-2">
              <li>• Styrofoam & foam packaging</li>
              <li>• Plastic bags & wrappers</li>
              <li>• Rubber & synthetic materials</li>
              <li>• Composite materials</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center mx-2">
        <h2 class="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4 px-2">Ready to Make a Difference?</h2>
        <p class="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 px-2">
          Join thousands of users making waste management smarter and more sustainable.
        </p>
        <button
          on:click={handleGetStarted}
          class="w-full sm:w-auto px-8 sm:px-12 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-base sm:text-lg font-semibold hover:from-blue-600 hover:to-cyan-600 active:from-blue-700 active:to-cyan-700 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/50"
        >
          Get Started Free →
        </button>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-slate-900/50 border-t border-slate-700/50 py-6 sm:py-8 mt-12 sm:mt-16 md:mt-20">
      <div class="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm sm:text-base">
        <p>&copy; 2025 EcoSort AI. Making the world cleaner, one classification at a time.</p>
      </div>
    </footer>
  </div>
{/if}

<style>
  :global(body) {
    background: #0f172a;
    overflow-x: hidden;
  }

  /* Ensure proper touch targets on mobile */
  @media (max-width: 1023px) {
    button, a {
      -webkit-tap-highlight-color: transparent;
      touch-action: manipulation;
    }
  }

  /* Smooth scrolling */
  :global(html) {
    scroll-behavior: smooth;
  }

  /* Prevent text selection on buttons for better mobile UX */
  button {
    -webkit-user-select: none;
    user-select: none;
  }
</style>