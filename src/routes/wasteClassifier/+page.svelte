<script lang="ts">
	import * as tmImage from '@teachablemachine/image';
	import { onMount } from 'svelte';
	import { db, auth } from '$lib/firebase';
	import { writable } from 'svelte/store';
	import { collection, addDoc, Timestamp } from 'firebase/firestore';
	import { onAuthStateChanged } from 'firebase/auth';
	import { goto } from '$app/navigation';

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

	let currentUser: any = null;
	let authChecked = false;

	// Animation state
	let showResult = false;

	// Camera selection
	let currentFacingMode: 'user' | 'environment' = 'user';
	let isMobileDevice = false;

	// Double tap detection
	let lastTapTime = 0;
	let tapTimeout: any = null;
	let showFlipAnimation = false;

	// ✨ NEW: Invalid image detection states
	let isInvalidImage = false;
	let invalidReason = '';
	let showInvalidNotification = false;

	// ✨ NEW: Confidence threshold for validation
	const CONFIDENCE_THRESHOLD = 0.85;

	onMount(() => {
		// Watch authentication state
		let unsubscribe: (() => void) | undefined;

		(async () => {
			unsubscribe = onAuthStateChanged(auth!, (user) => {
				currentUser = user;
				authChecked = true;

				if (user) {
					console.log('👤 Logged in as:', user.email);
					loadModel();
				} else {
					console.log('🚫 No user logged in - redirecting to login');
					goto('/login');
				}
			});

			// Detect device type
			isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
			currentFacingMode = isMobileDevice ? 'environment' : 'user';
		})();

		// Cleanup on component destroy
		return () => {
			if (unsubscribe) unsubscribe();
			closeCamera();
		};
	});

	async function loadModel() {
		try {
			model = await tmImage.load(modelURL, metadataURL);
			console.log('✅ AI model loaded successfully');
			modelLoading = false;
		} catch (err) {
			console.error('❌ Failed to load model:', err);
			modelLoading = false;
		}
	}

	async function openCamera() {
		try {
			imagePreview = null;
			prediction = '';
			showResult = false;
			isInvalidImage = false;
			showInvalidNotification = false;

			stream = await navigator.mediaDevices.getUserMedia({ 
				video: { facingMode: currentFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } } 
			});
			
			cameraActive = true;
			await new Promise(resolve => setTimeout(resolve, 100));
			
			if (videoElement) {
				videoElement.srcObject = stream;
				await new Promise(resolve => {
					videoElement!.onloadedmetadata = () => resolve(true);
				});
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
		showFlipAnimation = true;
		currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
		closeCamera();
		await new Promise(resolve => setTimeout(resolve, 200));
		await openCamera();
		setTimeout(() => (showFlipAnimation = false), 600);
	}

	function handleVideoTap(event: MouseEvent | TouchEvent) {
		const currentTime = new Date().getTime();
		const tapInterval = currentTime - lastTapTime;

		if (tapTimeout) clearTimeout(tapTimeout);

		if (tapInterval < 300 && tapInterval > 0) {
			switchCamera();
			lastTapTime = 0;
		} else {
			lastTapTime = currentTime;
			tapTimeout = setTimeout(() => (lastTapTime = 0), 300);
		}
	}

	async function capturePhoto() {
		if (!videoElement || !canvasElement) return;

		const context = canvasElement.getContext('2d');
		if (!context) return;

		canvasElement.width = videoElement.videoWidth;
		canvasElement.height = videoElement.videoHeight;
		context.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);

		imagePreview = canvasElement.toDataURL('image/png');
		closeCamera();
		await predictImage(imagePreview);
	}

	function closeCamera() {
		if (stream) {
			stream.getTracks().forEach(track => track.stop());
			stream = null;
		}
		cameraActive = false;
	}

	// ✨ NEW: Pre-classification validation (Option 1)
	async function validateImageContent(imageSrc: string): Promise<{ valid: boolean; reason: string }> {
		if (!model) {
			return { valid: true, reason: '' };
		}

		const img = new Image();
		img.src = imageSrc;

		return new Promise((resolve) => {
			img.onload = async () => {
				const predictions = await model.predict(img);
				type Prediction = { className: string; probability: number };

				const bestPrediction = (predictions as Prediction[]).reduce(
					(a, b) => (a.probability > b.probability ? a : b)
				);

				// Check if confidence is too low (likely not waste)
				if (bestPrediction.probability < CONFIDENCE_THRESHOLD) {
					resolve({ 
						valid: false, 
						reason: `Low confidence (${(bestPrediction.probability * 100).toFixed(1)}%). This doesn't appear to be waste material.` 
					});
					return;
				}

				// Check if it matches valid waste categories
				const validCategories = ['recyclable', 'biodegradable', 'non-biodegradable'];
				const categoryMatch = validCategories.some(cat => 
					bestPrediction.className.toLowerCase().includes(cat)
				);

				if (!categoryMatch) {
					resolve({ 
						valid: false, 
						reason: 'Image does not match any waste categories. Please capture waste items only.' 
					});
					return;
				}

				resolve({ valid: true, reason: '' });
			};
		});
	}

async function predictImage(imageSrc: string) {
	if (!model) {
		alert('Model not loaded yet!');
		return;
	}

	loading = true;
	showResult = false;
	isInvalidImage = false;
	showInvalidNotification = false;

	const img = new Image();
	img.src = imageSrc;
	img.onload = async () => {
		const predictions = await model.predict(img);
		type Prediction = { className: string; probability: number };

		// Get all predictions sorted by probability
		const sortedPredictions = (predictions as Prediction[]).sort(
			(a, b) => b.probability - a.probability
		);

		const bestPrediction = sortedPredictions[0];
		const secondBestPrediction = sortedPredictions[1];

		prediction = bestPrediction.className;
		confidence = (bestPrediction.probability * 100).toFixed(2) + '%';
		loading = false;

		// ✨ ENHANCED VALIDATION #1: Check confidence threshold
		if (bestPrediction.probability < CONFIDENCE_THRESHOLD) {
			isInvalidImage = true;
			invalidReason = 'Unable to Classify - Low Confidence';
			showInvalidNotification = true;
			console.warn('⚠️ Low confidence detection:', bestPrediction.probability);
			return;
		}

		// ✨ ENHANCED VALIDATION #2: Check confidence gap (ambiguity detection)
		// If the top 2 predictions are too close, the model is uncertain
		const confidenceGap = bestPrediction.probability - secondBestPrediction.probability;
		if (confidenceGap < 0.25) { // Less than 25% difference
			isInvalidImage = true;
			invalidReason = 'Unable to Classify - Ambiguous Image';
			showInvalidNotification = true;
			console.warn('⚠️ Ambiguous prediction. Top 2:', {
				first: `${bestPrediction.className} (${(bestPrediction.probability * 100).toFixed(1)}%)`,
				second: `${secondBestPrediction.className} (${(secondBestPrediction.probability * 100).toFixed(1)}%)`,
				gap: `${(confidenceGap * 100).toFixed(1)}%`
			});
			return;
		}

		// ✨ ENHANCED VALIDATION #3: Check valid waste categories
		const validCategories = ['recyclable', 'biodegradable', 'non-biodegradable'];
		const categoryMatch = validCategories.some(cat => 
			prediction.toLowerCase().includes(cat)
		);

		if (!categoryMatch) {
			isInvalidImage = true;
			invalidReason = 'Invalid Image - Not a Waste Item';
			showInvalidNotification = true;
			console.warn('⚠️ Category mismatch:', prediction);
			return;
		}

		// ✨ ENHANCED VALIDATION #4: Additional suspicious pattern detection
		// Check if the prediction seems unusual (e.g., body parts misclassified as biodegradable)
		const suspiciousPatterns = [
			{ keyword: 'biodegradable', minConfidence: 0.90 }, // Require 90% for biodegradable
			{ keyword: 'recyclable', minConfidence: 0.85 },
			{ keyword: 'non-biodegradable', minConfidence: 0.85 }
		];

		for (const pattern of suspiciousPatterns) {
			if (prediction.toLowerCase().includes(pattern.keyword)) {
				if (bestPrediction.probability < pattern.minConfidence) {
					isInvalidImage = true;
					invalidReason = `Unable to Classify - Insufficient Confidence for ${pattern.keyword}`;
					showInvalidNotification = true;
					console.warn(`⚠️ ${pattern.keyword} requires ${pattern.minConfidence * 100}% confidence, got ${(bestPrediction.probability * 100).toFixed(1)}%`);
					return;
				}
			}
		}

		// ✅ All validations passed - show result and save
		console.log('✅ Valid classification:', {
			prediction: bestPrediction.className,
			confidence: (bestPrediction.probability * 100).toFixed(2) + '%',
			confidenceGap: (confidenceGap * 100).toFixed(2) + '%'
		});
		
		setTimeout(() => (showResult = true), 100);
		await saveToFirestore(imageSrc, prediction, confidence);
	};
}
	async function saveToFirestore(imageSrc: string, wasteType: string, confidence: string) {
		try {
			if (!currentUser) {
				alert('You must be logged in to save data.');
				console.warn('❌ Attempted to save without user');
				return;
			}

			const compressedImage = await compressImage(imageSrc, 400, 0.7);

			await addDoc(collection(db!, 'classified_waste'), {
				userId: currentUser.uid,
				email: currentUser.email,
				imageSrc: compressedImage,
				wasteType,
				confidence,
				timestamp: Timestamp.now()
			});

			console.log('✅ Classification saved for user:', currentUser.email);
		} catch (error) {
			console.error('❌ Error saving classification:', error);
			alert('Failed to save classification.');
		}
	}

	async function compressImage(base64: string, maxWidth: number, quality: number): Promise<string> {
		return new Promise((resolve) => {
			const img = new Image();
			img.src = base64;
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let width = img.width;
				let height = img.height;

				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (ctx) {
					ctx.drawImage(img, 0, 0, width, height);
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
			isInvalidImage = false;
			showInvalidNotification = false;
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
		isInvalidImage = false;
		showInvalidNotification = false;
		closeCamera();
	}

	// ✨ NEW: Retry after invalid detection
	function retryCapture() {
		resetClassifier();
		openCamera();
	}
</script>

{#if !authChecked}
	<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
		<div class="text-center">
			<div class="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
			<p class="text-slate-300 text-lg">Checking authentication...</p>
		</div>
	</div>
{:else if currentUser}
	<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
		<div class="max-w-4xl mx-auto">
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
				<div class="bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
					<div class="p-8">
						{#if !cameraActive}
							<div class="flex flex-wrap gap-3 justify-center mb-8 px-2">
								<label class="group relative cursor-pointer">
									<div class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-green-500/50 hover:scale-105 transform flex items-center gap-2 text-sm md:text-base md:px-8 md:py-4">
										<svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
										<span class="hidden sm:inline">Upload Image</span>
										<span class="sm:hidden">Upload</span>
									</div>
									<input type="file" accept="image/*" class="hidden" on:change={handleFileUpload} />
								</label>

								<button
									class="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform flex items-center gap-2 text-sm md:text-base md:px-8 md:py-4"
									on:click={openCamera}
								>
									<svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									<span class="hidden sm:inline">Open Camera</span>
									<span class="sm:hidden">Camera</span>
								</button>

								{#if imagePreview && !loading}
									<button
										class="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-500 hover:to-slate-600 transition-all duration-300 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:shadow-slate-500/50 hover:scale-105 transform flex items-center gap-2 text-sm md:text-base md:px-8 md:py-4"
										on:click={resetClassifier}
									>
										<svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
										</svg>
										<span>Reset</span>
									</button>
								{/if}
							</div>
						{/if}

						<!-- ✨ NEW: Invalid Image Notification (Toast) -->
						{#if showInvalidNotification && isInvalidImage}
							<div class="mb-6 bg-gradient-to-r from-red-500/20 to-orange-500/20 border-2 border-red-500 rounded-2xl p-6 backdrop-blur-sm animate-shake">
								<div class="flex items-start gap-4">
									<div class="text-5xl">⚠️</div>
									<div class="flex-1">
										<h3 class="text-2xl font-bold text-red-400 mb-2">{invalidReason}</h3>
										<p class="text-slate-300 mb-3">
											{#if invalidReason.includes('Low confidence')}
												This doesn't appear to be waste material. The AI couldn't confidently identify it.
											{:else}
												Please capture an image of waste items only.
											{/if}
										</p>
										<ul class="text-sm text-slate-400 mb-4 space-y-1">
											<li>• Avoid capturing: people, body parts, or unrelated objects</li>
											<li>• Ensure good lighting and clear view of the waste item</li>
											<li>• Focus on one waste item at a time</li>
										</ul>
										<div class="flex flex-wrap gap-3">
											<button
												on:click={retryCapture}
												class="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:scale-105 transform flex items-center gap-2"
											>
												<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
												</svg>
												Try Again (Camera)
											</button>
											<label class="group relative cursor-pointer">
												<div class="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 px-6 py-3 rounded-xl font-semibold text-white shadow-lg hover:scale-105 transform flex items-center gap-2">
													<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
													</svg>
													Upload Different Image
												</div>
												<input type="file" accept="image/*" class="hidden" on:change={handleFileUpload} />
											</label>
										</div>
									</div>
								</div>
							</div>
						{/if}

						<div class="flex justify-center">
							{#if cameraActive && !imagePreview}
								<div class="relative">
									<video
										bind:this={videoElement}
										on:click={handleVideoTap}
										on:touchend={handleVideoTap}
										class="rounded-2xl border-4 border-blue-500/50 shadow-2xl shadow-blue-500/20 max-w-md w-full transition-transform duration-300"
										class:flip-animation={showFlipAnimation}
										autoplay
										playsinline
										muted
										style="min-height: 300px; background: #1e293b;"
									></video>
									<div class="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 animate-pulse">
										<span class="w-2 h-2 bg-white rounded-full"></span>
										LIVE
									</div>
									<div class="absolute top-4 right-4 bg-black/50 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
										{currentFacingMode === 'user' ? '🤳 Front' : '📷 Back'}
									</div>
									
									<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 rounded-b-2xl">
										<div class="flex items-center justify-center gap-8">
											<button
												on:click={resetClassifier}
												class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 flex items-center justify-center group"
												aria-label="Close camera"
											>
												<svg class="w-6 h-6 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>

											<button
												on:click={capturePhoto}
												class="capture-button group"
												aria-label="Capture photo"
											>
												<div class="capture-outer">
													<div class="capture-inner group-hover:scale-95 transition-transform duration-150"></div>
												</div>
											</button>

											<button
												on:click={switchCamera}
												class="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 transition-all duration-300 flex items-center justify-center group"
												aria-label="Flip camera"
											>
												<svg class="w-6 h-6 text-white group-hover:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
												</svg>
											</button>
										</div>
									</div>
									
									{#if showFlipAnimation}
										<div class="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center backdrop-blur-sm">
											<div class="text-white text-6xl animate-spin-slow">
												🔄
											</div>
										</div>
									{/if}
								</div>
							{/if}

							{#if imagePreview}
								<div class="relative group">
									<img
										src={imagePreview}
										alt="Preview"
										class={"rounded-2xl border-4 shadow-2xl max-w-md w-full transform transition-transform duration-300 group-hover:scale-105 " + (isInvalidImage ? 'border-red-500/80 shadow-red-500/40' : 'border-green-500/50 shadow-green-500/20')}
									/>
									{#if isInvalidImage}
										<div class="absolute inset-0 bg-red-500/20 rounded-2xl flex items-center justify-center backdrop-blur-[2px]">
											<div class="text-8xl animate-pulse">❌</div>
										</div>
									{/if}
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

					{#if showResult && prediction && !isInvalidImage}
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
{/if}

<style>
	video {
		object-fit: cover;
		-webkit-user-select: none;
		user-select: none;
	}

	.flip-animation {
		animation: flipCamera 0.6s ease-in-out;
	}

@keyframes flipCamera {
	0% { transform: scaleX(1); }
	50% { transform: scaleX(0); }
	100% { transform: scaleX(1); }
}

:global(.animate-spin-slow) {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

/* ✨ NEW: Shake animation for invalid notification */
.animate-shake {
	animation: shake 0.5s ease-in-out;
}

@keyframes shake {
	0%, 100% { transform: translateX(0); }
	25% { transform: translateX(-10px); }
	75% { transform: translateX(10px); }
}

.capture-button {
	position: relative;
	width: 80px;
	height: 80px;
	background: transparent;
	border: none;
	cursor: pointer;
	padding: 0;
	-webkit-tap-highlight-color: transparent;
}

.capture-outer {
	width: 80px;
	height: 80px;
	border-radius: 50%;
	border: 5px solid rgba(255, 255, 255, 0.9);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.15s ease;
	background: transparent;
	box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.capture-inner {
	width: 60px;
	height: 60px;
	border-radius: 50%;
	background: white;
	transition: all 0.15s ease;
}

.capture-button:hover .capture-outer {
	border-color: rgba(255, 255, 255, 1);
	transform: scale(1.05);
}

.capture-button:active .capture-outer {
	transform: scale(0.95);
}

.capture-button:active .capture-inner {
	transform: scale(0.85);
	background: rgba(255, 255, 255, 0.9);
}

</style>