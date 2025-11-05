<script lang="ts">
	// No special logic needed for now, just a static page
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
	<div class="max-w-6xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-16">
			<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl mb-6 shadow-lg shadow-green-500/50">
				<svg class="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
				</svg>
			</div>
			<h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-4">
				About EcoSort AI
			</h1>
			<p class="text-slate-300 text-xl max-w-3xl mx-auto">
				Empowering sustainable waste management through artificial intelligence
			</p>
		</div>

		<!-- Mission Section -->
		<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 mb-8">
			<div class="flex items-center gap-4 mb-6">
				<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
					<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
					</svg>
				</div>
				<h2 class="text-3xl font-bold text-white">Our Mission</h2>
			</div>
			<p class="text-slate-300 text-lg leading-relaxed mb-4">
				EcoSort AI is dedicated to revolutionizing waste management through cutting-edge artificial intelligence technology. 
				Our mission is to make proper waste classification accessible to everyone, contributing to a cleaner, more sustainable planet.
			</p>
			<p class="text-slate-300 text-lg leading-relaxed">
				We believe that with the right tools and education, every individual can make a significant impact on environmental 
				conservation. By simplifying waste sorting and providing real-time insights, we empower users to make informed 
				decisions about their waste disposal.
			</p>
		</div>

		<!-- How It Works Section -->
		<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 mb-8">
			<div class="flex items-center gap-4 mb-6">
				<div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
					<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
					</svg>
				</div>
				<h2 class="text-3xl font-bold text-white">How It Works</h2>
			</div>
			<div class="grid md:grid-cols-3 gap-6">
				<div class="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300">
					<div class="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
						<span class="text-4xl">📸</span>
					</div>
					<h3 class="text-xl font-bold text-white mb-3">1. Capture</h3>
					<p class="text-slate-300">
						Take a photo of your waste item using your device camera or upload an existing image.
					</p>
				</div>
				<div class="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300">
					<div class="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4">
						<span class="text-4xl">🤖</span>
					</div>
					<h3 class="text-xl font-bold text-white mb-3">2. Analyze</h3>
					<p class="text-slate-300">
						Our AI-powered system instantly analyzes the image and classifies the waste type.
					</p>
				</div>
				<div class="bg-slate-700/30 rounded-2xl p-6 hover:bg-slate-700/50 transition-all duration-300">
					<div class="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
						<span class="text-4xl">♻️</span>
					</div>
					<h3 class="text-xl font-bold text-white mb-3">3. Sort</h3>
					<p class="text-slate-300">
						Get instant classification results with disposal recommendations and environmental impact data.
					</p>
				</div>
			</div>
		</div>

		<!-- Features Section -->
		<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 mb-8">
			<div class="flex items-center gap-4 mb-6">
				<div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center">
					<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
					</svg>
				</div>
				<h2 class="text-3xl font-bold text-white">Key Features</h2>
			</div>
			<div class="grid md:grid-cols-2 gap-6">
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
						<svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-bold text-white mb-2">AI-Powered Classification</h3>
						<p class="text-slate-300">Advanced machine learning algorithms for accurate waste identification</p>
					</div>
				</div>
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
						<svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-bold text-white mb-2">Real-Time Analytics</h3>
						<p class="text-slate-300">Track your waste sorting patterns and environmental impact</p>
					</div>
				</div>
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
						<svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-bold text-white mb-2">Personal Dashboard</h3>
						<p class="text-slate-300">Comprehensive insights into your waste management journey</p>
					</div>
				</div>
				<div class="flex items-start gap-4">
					<div class="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
						<svg class="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<div>
						<h3 class="text-lg font-bold text-white mb-2">Classification History</h3>
						<p class="text-slate-300">Keep track of all your classifications with detailed records</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Impact Section -->
		<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 mb-8">
			<div class="flex items-center gap-4 mb-6">
				<div class="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
					<span class="text-2xl">🌍</span>
				</div>
				<h2 class="text-3xl font-bold text-white">Environmental Impact</h2>
			</div>
			<p class="text-slate-300 text-lg leading-relaxed mb-6">
				Every piece of waste correctly sorted contributes to a healthier planet. Here's how EcoSort AI helps:
			</p>
			<div class="grid md:grid-cols-3 gap-6">
				<div class="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-6">
					<div class="text-5xl mb-4">💧</div>
					<h3 class="text-xl font-bold text-cyan-400 mb-2">Water Conservation</h3>
					<p class="text-slate-300">Proper recycling saves thousands of liters of water in manufacturing processes</p>
				</div>
				<div class="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-6">
					<div class="text-5xl mb-4">🌱</div>
					<h3 class="text-xl font-bold text-green-400 mb-2">Reduced Emissions</h3>
					<p class="text-slate-300">Composting biodegradable waste reduces methane emissions from landfills</p>
				</div>
				<div class="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-6">
					<div class="text-5xl mb-4">⚡</div>
					<h3 class="text-xl font-bold text-purple-400 mb-2">Energy Savings</h3>
					<p class="text-slate-300">Recycling uses significantly less energy than producing from raw materials</p>
				</div>
			</div>
		</div>

		<!-- Technology Section -->
		<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 p-8 mb-8">
			<div class="flex items-center gap-4 mb-6">
				<div class="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
					<svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
					</svg>
				</div>
				<h2 class="text-3xl font-bold text-white">Technology Stack</h2>
			</div>
			<div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div class="bg-slate-700/30 rounded-xl p-4 text-center hover:bg-slate-700/50 transition-all duration-300">
					<p class="text-3xl mb-2">🎨</p>
					<p class="text-white font-semibold">SvelteKit</p>
					<p class="text-slate-400 text-sm">Frontend Framework</p>
				</div>
				<div class="bg-slate-700/30 rounded-xl p-4 text-center hover:bg-slate-700/50 transition-all duration-300">
					<p class="text-3xl mb-2">🔥</p>
					<p class="text-white font-semibold">Firebase</p>
					<p class="text-slate-400 text-sm">Backend & Database</p>
				</div>
				<div class="bg-slate-700/30 rounded-xl p-4 text-center hover:bg-slate-700/50 transition-all duration-300">
					<p class="text-3xl mb-2">🤖</p>
					<p class="text-white font-semibold">AI Model</p>
					<p class="text-slate-400 text-sm">Waste Classification</p>
				</div>
				<div class="bg-slate-700/30 rounded-xl p-4 text-center hover:bg-slate-700/50 transition-all duration-300">
					<p class="text-3xl mb-2">📊</p>
					<p class="text-white font-semibold">Chart.js</p>
					<p class="text-slate-400 text-sm">Data Visualization</p>
				</div>
			</div>
		</div>


	</div>
</div>

<style>
	:global(body) {
		background: #0f172a;
	}
</style>