<script lang="ts">
	import * as tmImage from '@teachablemachine/image';
	import { onMount } from 'svelte';
	import { writable } from 'svelte/store';
	import { db } from '$lib/firebase';
	import { collection, addDoc, Timestamp } from 'firebase/firestore';

	let model: any;
	let prediction = '';
	let confidence = '';
	let imagePreview: string | null = null;
	let loading = false;
	let modelLoading = true;
	let cameraActive = false;

	let videoElement: HTMLVideoElement | null = null;
	let canvasElement: HTMLCanvasElement | null = null;
	let stream: MediaStream | null = null;

	const modelURL = '/waste-model/model.json';
	const metadataURL = '/waste-model/metadata.json';

	// Animation state
	let showResult = false;

	// Camera selection state
	let currentFacingMode: 'user' | 'environment' = 'user'; // 'user' = front, 'environment' = back
	let isMobileDevice = false;

	onMount(async () => {
		// Detect if device is mobile
		isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
		
		// Set default camera based on device type
		currentFacingMode = isMobileDevice ? 'environment' : 'user';
		
		try {
			model = await tmImage.load(modelURL, metadataURL);
			console.log('✅ AI model loaded successfully');
			modelLoading = false;
		} catch (err) {
			console.error('❌ Failed to load model:', err);
			modelLoading = false;
		}
	});

	async function openCamera() {
		try {
			// Clear any previous state first
			imagePreview = null;
			prediction = '';
			showResult = false;
			
			// Request camera with facing mode
			stream = await navigator.mediaDevices.getUserMedia({ 
				video: { 
					facingMode: currentFacingMode,
					width: { ideal: 1280 },
					height: { ideal: 720 }
				} 
			});
			
			// Set active state before setting up video
			cameraActive = true;
			
			// Wait for next tick to ensure DOM is updated
			await new Promise(resolve => setTimeout(resolve, 100));
			
			if (videoElement) {
				videoElement.srcObject = stream;
				
				// Wait for video metadata to load
				await new Promise((resolve) => {
					videoElement!.onloadedmetadata = () => {
						resolve(true);
					};
				});
				
				// Now play the video
				await videoElement.play();
				console.log('🎥 Camera opened successfully');
			}
		} catch (error) {
			cameraActive = false;
			alert('Unable to access camera. Please allow permission.');
			console.error(error);
		}
	}

	async function switchCamera() {
		// Toggle between front and back camera
		currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
		
		// Close current camera
		closeCamera();
		
		// Reopen with new facing mode
		await openCamera();
	}

	async function capturePhoto() {
		if (!videoElement || !canvasElement) return;

		const context = canvasElement.getContext('2d');
		if (!context) return;

		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;
		context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

		imagePreview = canvasElement.toDataURL('image/png');

		// Stop the camera
		closeCamera();

		await predictImage(imagePreview);
	}

	function closeCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		cameraActive = false;
	}

	async function predictImage(imageSrc: string) {
		if (!model) {
			alert('Model not loaded yet!');
			return;
		}

		loading = true;
		showResult = false;
		const img = new Image();
		img.src = imageSrc;
		img.onload = async () => {
			const predictions = await model.predict(img);
			type Prediction = { className: string; probability: number };

			const bestPrediction = (predictions as Prediction[]).reduce(
				(a: Prediction, b: Prediction) => (a.probability > b.probability ? a : b)
			);

			prediction = bestPrediction.className;
			confidence = (bestPrediction.probability * 100).toFixed(2) + '%';
			loading = false;
			
			// Trigger result animation
			setTimeout(() => {
				showResult = true;
			}, 100);

			// Save to Firebase
			await saveToFirestore(imageSrc, prediction, confidence);
		};
	}

	async function saveToFirestore(imageSrc: string, wasteType: string, confidence: string) {
		try {
			// Compress the image to a smaller size
			const compressedImage = await compressImage(imageSrc, 400, 0.7);
			
			// Save to Firestore with compressed image
			await addDoc(collection(db, 'classified_waste'), {
				imageSrc: compressedImage,
				wasteType,
				confidence,
				timestamp: Timestamp.now()
			});
			
			console.log('✅ Classification saved to Firestore');
		} catch (error) {
			console.error('❌ Error saving classification:', error);
			alert('Failed to save classification. The image might be too large.');
		}
	}

	// Function to compress image
	async function compressImage(base64: string, maxWidth: number, quality: number): Promise<string> {
		return new Promise((resolve) => {
			const img = new Image();
			img.src = base64;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let width = img.width;
				let height = img.height;

				// Calculate new dimensions while maintaining aspect ratio
				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(img, 0, 0, width, height);
					// Compress as JPEG with specified quality
					const compressed = canvas.toDataURL('image/jpeg', quality);
					resolve(compressed);
				}
			};
		});
	}

	function handleFileUpload(e: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = async (event) => {
			imagePreview = event.target?.result as string;
			closeCamera();
			prediction = '';
			showResult = false;
			await predictImage(imagePreview);
		};
		reader.readAsDataURL(file);
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
		if (lower.includes('recyclable')) return 'from-blue-500 to-cyan-500';
		if (lower.includes('biodegradable')) return 'from-green-500 to-emerald-500';
		if (lower.includes('non-biodegradable')) return 'from-red-500 to-orange-500';
		return 'from-gray-500 to-slate-500';
	}

	function resetClassifier() {
		imagePreview = null;
		prediction = '';
		confidence = '';
		showResult = false;
		closeCamera();
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
	<div class="max-w-4xl mx-auto">
		<!-- Header -->
		<div class="text-center mb-12">
			<h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500 mb-4">
				AI Waste Classification
			</h1>
			<p class="text-slate-300 text-lg">
				Upload or capture an image to identify waste type instantly
			</p>
		</div>

		{#if modelLoading}
			<div class="flex flex-col items-center justify-center py-20">
				<div class="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mb-4"></div>
				<p class="text-slate-300 text-lg">Loading AI Model...</p>
			</div>
		{:else}
			<!-- Main Card -->
			<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
				<!-- Upload Section -->
				<div class="p-8">
					<div class="flex flex-wrap gap-4 justify-center mb-8">
						<label class="group relative cursor-pointer">
							<div class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-green-500/50 hover:scale-105 transform flex items-center gap-3">
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								Upload Image
							</div>
							<input type="file" accept="image/*" class="hidden" on:change={handleFileUpload} />
						</label>

						<button
							class="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform flex items-center gap-3"
							on:click={openCamera}
							disabled={cameraActive}
						>
							<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							{cameraActive ? 'Camera Active' : 'Open Camera'}
						</button>

						{#if cameraActive}
							<button
								class="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-purple-500/50 hover:scale-105 transform flex items-center gap-3"
								on:click={capturePhoto}
							>
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
								</svg>
								Capture Photo
							</button>

							<button
								class="bg-gradient-to-r from-orange-600 to-yellow-600 hover:from-orange-500 hover:to-yellow-500 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-orange-500/50 hover:scale-105 transform flex items-center gap-3"
								on:click={switchCamera}
							>
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								{currentFacingMode === 'user' ? 'Switch to Back' : 'Switch to Front'}
							</button>
						{/if}

						{#if (imagePreview || cameraActive) && !loading}
							<button
								class="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 transition-all duration-300 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-slate-500/50 hover:scale-105 transform flex items-center gap-3"
								on:click={resetClassifier}
							>
								<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
								</svg>
								Reset
							</button>
						{/if}
					</div>

					<!-- Camera/Image Display -->
					<div class="flex justify-center">
						{#if cameraActive && !imagePreview}
							<div class="relative">
								<video
									bind:this={videoElement}
									class="rounded-2xl border-4 border-blue-500/50 shadow-2xl shadow-blue-500/20 max-w-md w-full"
									autoplay
									playsinline
									muted
									style="min-height: 300px; background: #1e293b;"
								></video>
								<div class="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 animate-pulse">
									<span class="w-2 h-2 bg-white rounded-full"></span>
									LIVE
								</div>
								<div class="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-semibold">
									{currentFacingMode === 'user' ? '🤳 Front' : '📷 Back'}
								</div>
							</div>
						{/if}

						{#if imagePreview}
							<div class="relative group">
								<img
									src={imagePreview}
									alt="Preview"
									class="rounded-2xl border-4 border-green-500/50 shadow-2xl shadow-green-500/20 max-w-md w-full transform transition-transform duration-300 group-hover:scale-105"
								/>
								{#if loading}
									<div class="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center">
										<div class="text-center">
											<div class="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
											<p class="text-white text-lg font-semibold">Analyzing...</p>
										</div>
									</div>
								{/if}
							</div>
						{/if}
					</div>

					<canvas bind:this={canvasElement} class="hidden"></canvas>
				</div>

				<!-- Results Section -->
				{#if showResult && prediction}
					<div class="bg-gradient-to-r {getWasteColor(prediction)} p-8 transform transition-all duration-500 ease-out">
						<div class="text-center text-white">
							<div class="text-7xl mb-4 animate-bounce">
								{getWasteIcon(prediction)}
							</div>
							<h3 class="text-3xl font-bold mb-2">Classification Result</h3>
							<div class="bg-white/20 backdrop-blur-md rounded-2xl p-6 mt-6 inline-block">
								<p class="text-4xl font-bold mb-2">{prediction}</p>
								<div class="flex items-center justify-center gap-2 text-lg">
									<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
									</svg>
									<span class="font-semibold">Confidence: {confidence}</span>
								</div>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Info Cards -->
			<div class="grid md:grid-cols-3 gap-6 mt-12">
				<div class="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6 backdrop-blur-sm">
					<div class="text-4xl mb-3">♻️</div>
					<h3 class="text-xl font-bold text-blue-400 mb-2">Recyclable</h3>
					<p class="text-slate-300 text-sm">Plastics, metals, glass, and paper that can be reprocessed</p>
				</div>
				<div class="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 backdrop-blur-sm">
					<div class="text-4xl mb-3">🌱</div>
					<h3 class="text-xl font-bold text-green-400 mb-2">Biodegradable</h3>
					<p class="text-slate-300 text-sm">Organic materials that decompose naturally</p>
				</div>
				<div class="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
					<div class="text-4xl mb-3">🚯</div>
					<h3 class="text-xl font-bold text-red-400 mb-2">Non-Biodegradable</h3>
					<p class="text-slate-300 text-sm">Materials that don't decompose and require special disposal</p>
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	video {
		object-fit: cover;
	}
</style>