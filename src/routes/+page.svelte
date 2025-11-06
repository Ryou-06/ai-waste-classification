<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { getAuth, onAuthStateChanged } from 'firebase/auth';

  let user: any = null;
  let loading = true;

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

    return () => unsubscribe();
  });

  function handleGetStarted() {
    goto('/register');
  }

  function handleLogin() {
    goto('/login');
  }
</script>

{#if loading}
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
    <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">


    <!-- Hero Section -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div class="text-center mb-16">
        <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-2 mb-6">
          <span class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          <span class="text-blue-400 text-sm font-semibold">AI-Powered Classification</span>
        </div>
        
        <h1 class="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 mb-6 leading-tight">
          Smart Waste<br />Classification
        </h1>
        
        <p class="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
          Harness the power of artificial intelligence to classify waste accurately. 
          Make recycling easier, faster, and more effective for a sustainable future.
        </p>

        <div class="flex justify-center gap-4">
          <button
            on:click={handleGetStarted}
            class="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50"
          >
            Start Classifying Now →
          </button>
          <button
            on:click={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            class="px-8 py-4 bg-slate-800/50 backdrop-blur-sm border border-slate-700 text-white rounded-xl text-lg font-semibold hover:bg-slate-700/50 transition-all"
          >
            Learn More
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid md:grid-cols-4 gap-6 mb-20">
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
          <div class="text-4xl mb-2">🎯</div>
          <p class="text-3xl font-bold text-white mb-1">98%</p>
          <p class="text-slate-400 text-sm">Accuracy Rate</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
          <div class="text-4xl mb-2">⚡</div>
          <p class="text-3xl font-bold text-white mb-1">&lt;2s</p>
          <p class="text-slate-400 text-sm">Classification Time</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
          <div class="text-4xl mb-2">🌍</div>
          <p class="text-3xl font-bold text-white mb-1">50k+</p>
          <p class="text-slate-400 text-sm">Waste Items Sorted</p>
        </div>
        <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50 text-center">
          <div class="text-4xl mb-2">♻️</div>
          <p class="text-3xl font-bold text-white mb-1">3</p>
          <p class="text-slate-400 text-sm">Waste Categories</p>
        </div>
      </div>

      <!-- Features Section -->
      <div id="features" class="mb-20">
        <h2 class="text-4xl font-bold text-center text-white mb-12">How It Works</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-8">
            <div class="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6">
              <span class="text-4xl">📸</span>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">1. Upload Image</h3>
            <p class="text-slate-300 leading-relaxed">
              Take a photo or upload an image of your waste item. Our system supports various image formats.
            </p>
          </div>

          <div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-8">
            <div class="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mb-6">
              <span class="text-4xl">🤖</span>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">2. AI Analysis</h3>
            <p class="text-slate-300 leading-relaxed">
              Advanced machine learning algorithms analyze and classify your waste in real-time with high accuracy.
            </p>
          </div>

          <div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8">
            <div class="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6">
              <span class="text-4xl">✅</span>
            </div>
            <h3 class="text-2xl font-bold text-white mb-4">3. Get Results</h3>
            <p class="text-slate-300 leading-relaxed">
              Receive instant classification results: Recyclable, Biodegradable, or Non-biodegradable.
            </p>
          </div>
        </div>
      </div>

      <!-- Waste Categories -->
      <div class="mb-20">
        <h2 class="text-4xl font-bold text-center text-white mb-12">Waste Categories</h2>
        <div class="grid md:grid-cols-3 gap-6">
          <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-blue-500/30 hover:border-blue-500/50 transition-all">
            <div class="text-6xl mb-4 text-center">♻️</div>
            <h3 class="text-2xl font-bold text-blue-400 mb-4 text-center">Recyclable</h3>
            <p class="text-slate-300 text-center mb-4">Materials that can be reprocessed</p>
            <ul class="text-slate-400 text-sm space-y-2">
              <li>• Plastic bottles & containers</li>
              <li>• Paper & cardboard</li>
              <li>• Glass bottles</li>
              <li>• Metal cans</li>
            </ul>
          </div>

          <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-green-500/30 hover:border-green-500/50 transition-all">
            <div class="text-6xl mb-4 text-center">🌱</div>
            <h3 class="text-2xl font-bold text-green-400 mb-4 text-center">Biodegradable</h3>
            <p class="text-slate-300 text-center mb-4">Organic matter that decomposes naturally</p>
            <ul class="text-slate-400 text-sm space-y-2">
              <li>• Food scraps & leftovers</li>
              <li>• Fruit & vegetable peels</li>
              <li>• Garden waste</li>
              <li>• Paper products</li>
            </ul>
          </div>

          <div class="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 hover:border-red-500/50 transition-all">
            <div class="text-6xl mb-4 text-center">🚯</div>
            <h3 class="text-2xl font-bold text-red-400 mb-4 text-center">Non-Biodegradable</h3>
            <p class="text-slate-300 text-center mb-4">Materials that don't decompose easily</p>
            <ul class="text-slate-400 text-sm space-y-2">
              <li>• Styrofoam & foam packaging</li>
              <li>• Plastic bags & wrappers</li>
              <li>• Rubber & synthetic materials</li>
              <li>• Composite materials</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- CTA Section -->
      <div class="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-3xl p-12 text-center">
        <h2 class="text-4xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
        <p class="text-xl text-slate-300 mb-8">
          Join thousands of users making waste management smarter and more sustainable.
        </p>
        <button
          on:click={handleGetStarted}
          class="px-12 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/50"
        >
          Get Started Free →
        </button>
      </div>
    </div>

    <!-- Footer -->
    <footer class="bg-slate-900/50 border-t border-slate-700/50 py-8 mt-20">
      <div class="max-w-7xl mx-auto px-4 text-center text-slate-400">
        <p>&copy; 2025 EcoSort AI. Making the world cleaner, one classification at a time.</p>
      </div>
    </footer>
  </div>
{/if}

<style>
  :global(body) {
    background: #0f172a;
  }
</style>