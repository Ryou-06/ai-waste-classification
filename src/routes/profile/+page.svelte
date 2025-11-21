<script lang="ts">
	import { onMount } from 'svelte';
	import { auth, db } from '$lib/firebase';
	import { updateProfile } from 'firebase/auth';
	import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';

	let user: any = $state(null);
	let editMode = $state(false);
	let loading = $state(false);
	let uploading = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let fileInput: HTMLInputElement;
	
	// Profile data
	let displayName = $state('');
	let email = $state('');
	let location = $state('');
	let bio = $state('');
	let photoURL = $state('');
	let joinedDate = $state('');
	
	// Original values for cancel
	let originalProfile = {
		displayName: '',
		location: '',
		bio: '',
		photoURL: ''
	};
	
	// Statistics
	let stats = $state({
		totalClassifications: 0,
		recyclable: 0,
		organic: 0,
		hazardous: 0,
		general: 0,
		accuracy: 0,
		co2Saved: 0,
		treesSaved: 0,
		waterSaved: 0
	});

	onMount(() => {
		const unsubscribe = auth!.onAuthStateChanged(async (currentUser) => {
			if (currentUser) {
				user = currentUser;
				email = currentUser.email || '';
				
				// Calculate days since joined
				if (currentUser.metadata.creationTime) {
					const joined = new Date(currentUser.metadata.creationTime);
					joinedDate = joined.toLocaleDateString('en-US', { 
						year: 'numeric', 
						month: 'long', 
						day: 'numeric' 
					});
				}
				
				// Load user profile from Firestore
				await loadUserProfile(currentUser.uid);
				
				// Load classification statistics
				await loadStatistics(currentUser.uid);
			}
		});

		return unsubscribe;
	});

	async function loadUserProfile(userId: string) {
		try {
			const userDocRef = doc(db!, 'users', userId);
			const userDoc = await getDoc(userDocRef);
			
			if (userDoc.exists()) {
				const data = userDoc.data();
				displayName = data.displayName || user?.displayName || '';
				location = data.location || '';
				bio = data.bio || '';
				photoURL = data.photoURL || ''; // This will now be base64 or empty
				
				// Store original values
				originalProfile = {
					displayName,
					location,
					bio,
					photoURL
				};
			} else {
				// Create user document if it doesn't exist
				displayName = user?.displayName || '';
				await setDoc(userDocRef, {
					email: user?.email,
					displayName: displayName,
					location: '',
					bio: '',
					photoURL: '',
					createdAt: new Date().toISOString()
				});
				
				originalProfile = {
					displayName,
					location: '',
					bio: '',
					photoURL: ''
				};
			}
		} catch (error) {
			console.error('Error loading user profile:', error);
		}
	}

	async function loadStatistics(userId: string) {
		try {
			const wasteQuery = query(
				collection(db!, 'classified_waste'),
				where('userId', '==', userId)
			);
			
			const querySnapshot = await getDocs(wasteQuery);
			const classifications = querySnapshot.docs.map(doc => doc.data());
			
			// Calculate statistics
			stats.totalClassifications = classifications.length;
			
			// Count by waste type
			const wasteCounts: any = {
				recyclable: 0,
				organic: 0,
				hazardous: 0,
				general: 0
			};
			
			classifications.forEach(item => {
				const wasteType = item.wasteType?.toLowerCase() || '';
				
				if (wasteType.includes('recycl')) {
					wasteCounts.recyclable++;
				} else if (wasteType.includes('organic') || wasteType.includes('biodegradable') || wasteType.includes('compost')) {
					wasteCounts.organic++;
				} else if (wasteType.includes('hazard') || wasteType.includes('toxic')) {
					wasteCounts.hazardous++;
				} else {
					wasteCounts.general++;
				}
			});
			
			stats.recyclable = wasteCounts.recyclable;
			stats.organic = wasteCounts.organic;
			stats.hazardous = wasteCounts.hazardous;
			stats.general = wasteCounts.general;
			
			// Calculate accuracy (based on confidence scores)
			if (classifications.length > 0) {
				const totalConfidence = classifications.reduce((sum, item) => {
					const confidence = parseFloat(item.confidence || '0');
					return sum + confidence;
				}, 0);
				stats.accuracy = Math.round(totalConfidence / classifications.length);
			}
			
			// Calculate environmental impact
			stats.co2Saved = parseFloat((stats.recyclable * 0.17 + stats.organic * 0.15).toFixed(1));
			stats.treesSaved = Math.floor(stats.totalClassifications / 50);
			stats.waterSaved = Math.floor(stats.recyclable * 7.5 + stats.organic * 5);
			
		} catch (error) {
			console.error('Error loading statistics:', error);
		}
	}

	function toggleEditMode() {
		if (!editMode) {
			// Entering edit mode - save current values
			originalProfile = {
				displayName,
				location,
				bio,
				photoURL
			};
		}
		editMode = !editMode;
		successMessage = '';
		errorMessage = '';
	}

	async function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		// Validate file
		if (!file.type.startsWith('image/')) {
			errorMessage = 'Please select an image file';
			return;
		}
		
		// Limit to 1MB for base64 storage
		if (file.size > 1 * 1024 * 1024) {
			errorMessage = 'Image size must be less than 1MB';
			return;
		}
		
		await convertToBase64(file);
	}

	async function convertToBase64(file: File) {
		uploading = true;
		errorMessage = '';
		
		try {
			const reader = new FileReader();
			
			reader.onload = (e) => {
				const base64String = e.target?.result as string;
				photoURL = base64String;
				successMessage = 'Profile picture uploaded successfully!';
				setTimeout(() => {
					successMessage = '';
				}, 3000);
				uploading = false;
			};
			
			reader.onerror = () => {
				errorMessage = 'Failed to read image file';
				uploading = false;
			};
			
			reader.readAsDataURL(file);
			
		} catch (error: any) {
			errorMessage = error.message || 'Failed to upload profile picture';
			uploading = false;
		}
	}

	async function saveProfile() {
		if (!user) return;
		
		loading = true;
		errorMessage = '';
		successMessage = '';

		try {
			// Update Firestore user document (store base64 image here)
			const userDocRef = doc(db!, 'users', user.uid);
			await updateDoc(userDocRef, {
				displayName: displayName,
				location: location,
				bio: bio,
				photoURL: photoURL, // This is now base64 string
				updatedAt: new Date().toISOString()
			});

			// Update Firebase Auth profile (without photo since it needs a URL)
			await updateProfile(user, {
				displayName: displayName
			});

			// Update original values
			originalProfile = {
				displayName,
				location,
				bio,
				photoURL
			};

			successMessage = 'Profile updated successfully!';
			editMode = false;
			
			// Reload auth state
			await user.reload();
			
			// Clear success message after 3 seconds
			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (error: any) {
			errorMessage = error.message || 'Failed to update profile';
		} finally {
			loading = false;
		}
	}

	function cancelEdit() {
		// Reset to original values
		displayName = originalProfile.displayName;
		location = originalProfile.location;
		bio = originalProfile.bio;
		photoURL = originalProfile.photoURL;
		editMode = false;
		errorMessage = '';
		successMessage = '';
	}

	function getInitials(name: string): string {
		if (!name) return 'U';
		return name
			.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-6 sm:mb-8">
			<h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Profile</h1>
			<p class="text-slate-400 text-sm sm:text-base">Manage your account and view your environmental impact</p>
		</div>

		<!-- Success/Error Messages -->
		{#if successMessage}
			<div class="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-3">
				<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
				<span>{successMessage}</span>
			</div>
		{/if}

		{#if errorMessage}
			<div class="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-3">
				<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>{errorMessage}</span>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
			<!-- Left Column - Profile Info -->
			<div class="lg:col-span-1 space-y-6">
				<!-- Profile Card -->
				<div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
					<div class="flex flex-col items-center text-center">
						<!-- Avatar -->
						<div class="relative mb-4">
							{#if photoURL}
								<img 
									src={photoURL} 
									alt={displayName || 'Profile'}
									class="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover shadow-lg ring-4 ring-blue-500/30"
								/>
							{:else}
								<div class="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-lg shadow-blue-500/30">
									{getInitials(displayName || email)}
								</div>
							{/if}
							
							{#if editMode}
								<button 
									on:click={triggerFileInput}
									disabled={uploading}
									class="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center text-white transition-colors border-2 border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{#if uploading}
										<svg class="animate-spin w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
									{:else}
										<svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
									{/if}
								</button>
								<input
									type="file"
									bind:this={fileInput}
									on:change={handleFileSelect}
									accept="image/*"
									class="hidden"
								/>
							{/if}
						</div>

						<!-- Edit Mode -->
						{#if editMode}
							<div class="w-full space-y-4">
								<div>
									<label class="block text-sm font-medium text-slate-300 mb-2 text-left">Display Name</label>
									<input
										type="text"
										bind:value={displayName}
										placeholder="Enter your name"
										class="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-slate-300 mb-2 text-left">Email</label>
									<input
										type="email"
										value={email}
										disabled
										class="w-full px-4 py-2 bg-slate-900/30 border border-slate-600 rounded-lg text-slate-500 cursor-not-allowed"
									/>
									<p class="text-xs text-slate-500 mt-1 text-left">Email cannot be changed</p>
								</div>
								<div>
									<label class="block text-sm font-medium text-slate-300 mb-2 text-left">Location</label>
									<input
										type="text"
										bind:value={location}
										placeholder="City, Country"
										class="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
									/>
								</div>
								<div>
									<label class="block text-sm font-medium text-slate-300 mb-2 text-left">Bio</label>
									<textarea
										bind:value={bio}
										placeholder="Tell us about yourself..."
										rows="3"
										class="w-full px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
									></textarea>
								</div>

								<!-- Save/Cancel Buttons -->
								<div class="flex gap-2 pt-2">
									<button
										on:click={saveProfile}
										disabled={loading || uploading}
										class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
									>
										{loading ? 'Saving...' : 'Save'}
									</button>
									<button
										on:click={cancelEdit}
										disabled={loading || uploading}
										class="flex-1 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
									>
										Cancel
									</button>
								</div>
							</div>
						{:else}
							<!-- View Mode -->
							<div class="w-full">
								<h2 class="text-xl sm:text-2xl font-bold text-white mb-1">{displayName || 'User'}</h2>
								<p class="text-slate-400 text-sm mb-2">{email}</p>
								{#if location}
									<p class="text-slate-500 text-sm flex items-center justify-center gap-1">
										<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
										</svg>
										{location}
									</p>
								{/if}
								{#if bio}
									<p class="text-slate-300 text-sm mt-4 leading-relaxed">{bio}</p>
								{/if}

								<button
									on:click={toggleEditMode}
									class="mt-6 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
									</svg>
									Edit Profile
								</button>
							</div>
						{/if}
					</div>

					<!-- Member Since -->
					<div class="mt-6 pt-6 border-t border-slate-700">
						<div class="flex items-center justify-between text-sm">
							<span class="text-slate-400">Member since</span>
							<span class="text-white font-medium">{joinedDate}</span>
						</div>
					</div>
				</div>

				<!-- Quick Actions -->
				<div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
					<h3 class="text-lg font-bold text-white mb-4">Quick Actions</h3>
					<div class="space-y-2">
						<a href="/history" class="flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group">
							<span class="text-2xl">📜</span>
							<div class="flex-1">
								<p class="text-white font-medium group-hover:text-blue-400 transition-colors">View History</p>
								<p class="text-xs text-slate-400">See all classifications</p>
							</div>
							<svg class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</a>
						<a href="/dashboard" class="flex items-center gap-3 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors group">
							<span class="text-2xl">📊</span>
							<div class="flex-1">
								<p class="text-white font-medium group-hover:text-blue-400 transition-colors">Dashboard</p>
								<p class="text-xs text-slate-400">View analytics</p>
							</div>
							<svg class="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
							</svg>
						</a>
					</div>
				</div>
			</div>

			<!-- Right Column - Statistics & Impact -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Classification Statistics -->
				<div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
					<h3 class="text-xl font-bold text-white mb-6">Classification Statistics</h3>
					
					<!-- Total Classifications -->
					<div class="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-6 mb-6">
						<div class="flex items-center justify-between">
							<div>
								<p class="text-slate-300 text-sm mb-1">Total Classifications</p>
								<p class="text-4xl font-bold text-white">{stats.totalClassifications}</p>
							</div>
							<div class="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
								<span class="text-3xl">🔍</span>
							</div>
						</div>
					</div>

					<!-- Category Breakdown -->
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<div class="bg-slate-700/50 rounded-xl p-4 text-center">
							<div class="text-3xl mb-2">♻️</div>
							<p class="text-2xl font-bold text-white">{stats.recyclable}</p>
							<p class="text-xs text-slate-400 mt-1">Recyclable</p>
						</div>
						<div class="bg-slate-700/50 rounded-xl p-4 text-center">
							<div class="text-3xl mb-2">🌿</div>
							<p class="text-2xl font-bold text-white">{stats.organic}</p>
							<p class="text-xs text-slate-400 mt-1">Organic</p>
						</div>
						<div class="bg-slate-700/50 rounded-xl p-4 text-center">
							<div class="text-3xl mb-2">⚠️</div>
							<p class="text-2xl font-bold text-white">{stats.hazardous}</p>
							<p class="text-xs text-slate-400 mt-1">Hazardous</p>
						</div>
						<div class="bg-slate-700/50 rounded-xl p-4 text-center">
							<div class="text-3xl mb-2">🗑️</div>
							<p class="text-2xl font-bold text-white">{stats.general}</p>
							<p class="text-xs text-slate-400 mt-1">General</p>
						</div>
					</div>

					<!-- Accuracy -->
					<div class="mt-6 pt-6 border-t border-slate-700">
						<div class="flex items-center justify-between mb-3">
							<span class="text-slate-300 font-medium">Classification Accuracy</span>
							<span class="text-2xl font-bold text-green-400">{stats.accuracy}%</span>
						</div>
						<div class="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
							<div class="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-500" style="width: {stats.accuracy}%"></div>
						</div>
					</div>
				</div>

				<!-- Environmental Impact -->
				<div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
					<div class="flex items-center gap-3 mb-6">
						<span class="text-3xl">🌍</span>
						<h3 class="text-xl font-bold text-white">Environmental Impact</h3>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						<!-- CO2 Saved -->
						<div class="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-5">
							<div class="flex items-center gap-3 mb-3">
								<div class="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
									<span class="text-2xl">💨</span>
								</div>
								<div>
									<p class="text-2xl font-bold text-white">{stats.co2Saved}</p>
									<p class="text-xs text-slate-400">kg CO₂</p>
								</div>
							</div>
							<p class="text-sm text-slate-300">Carbon emissions prevented</p>
						</div>

						<!-- Trees Saved -->
						<div class="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-xl p-5">
							<div class="flex items-center gap-3 mb-3">
								<div class="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
									<span class="text-2xl">🌳</span>
								</div>
								<div>
									<p class="text-2xl font-bold text-white">{stats.treesSaved}</p>
									<p class="text-xs text-slate-400">trees</p>
								</div>
							</div>
							<p class="text-sm text-slate-300">Equivalent trees saved</p>
						</div>

						<!-- Water Saved -->
						<div class="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-xl p-5">
							<div class="flex items-center gap-3 mb-3">
								<div class="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
									<span class="text-2xl">💧</span>
								</div>
								<div>
									<p class="text-2xl font-bold text-white">{stats.waterSaved}</p>
									<p class="text-xs text-slate-400">liters</p>
								</div>
							</div>
							<p class="text-sm text-slate-300">Water conserved</p>
						</div>
					</div>

					<!-- Impact Message -->
					<div class="mt-6 p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg">
						<p class="text-sm text-slate-300 text-center">
							<span class="font-semibold text-green-400">Amazing work!</span> Your proper waste sorting is making a real difference for our planet. 🌱
						</p>
					</div>
				</div>
                
                <!-- Achievements -->
				<div class="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl">
					<h3 class="text-xl font-bold text-white mb-6">Achievements</h3>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
						<div class="bg-slate-700/50 rounded-xl p-4 text-center" class:opacity-100={stats.totalClassifications >= 1} class:opacity-30={stats.totalClassifications < 1}>
							<div class="text-4xl mb-2">🎯</div>
							<p class="text-xs text-slate-300 font-medium">First Classification</p>
						</div>
						<div class="bg-slate-700/50 rounded-xl p-4 text-center" class:opacity-100={stats.totalClassifications >= 7} class:opacity-30={stats.totalClassifications < 7}>
							<div class="text-4xl mb-2">🔥</div>
							<p class="text-xs text-slate-300 font-medium">7-Day Streak</p>
						</div>
						<div class="bg-slate-700/50 rounded-xl p-4 text-center" class:opacity-100={stats.totalClassifications >= 100} class:opacity-30={stats.totalClassifications < 100}>
							<div class="text-4xl mb-2">💯</div>
							<p class="text-xs text-slate-300 font-medium">100 Items Sorted</p>
						</div>
						<div class="bg-slate-700/50 rounded-xl p-4 text-center" class:opacity-100={stats.totalClassifications >= 500} class:opacity-30={stats.totalClassifications < 500}>
							<div class="text-4xl mb-2">🏆</div>
							<p class="text-xs text-slate-400 font-medium">Eco Champion</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Smooth transitions for all interactive elements */
	button, a, input, textarea {
		transition: all 0.2s ease;
	}

	/* Custom scrollbar for textarea */
	textarea::-webkit-scrollbar {
		width: 8px;
	}

	textarea::-webkit-scrollbar-track {
		background: rgba(51, 65, 85, 0.3);
		border-radius: 4px;
	}

	textarea::-webkit-scrollbar-thumb {
		background: rgba(71, 85, 105, 0.8);
		border-radius: 4px;
	}

	textarea::-webkit-scrollbar-thumb:hover {
		background: rgba(71, 85, 105, 1);
	}
</style>