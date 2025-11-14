<script lang="ts">
  import { onMount } from 'svelte';
  import { doc, setDoc, getDoc } from 'firebase/firestore';
  import {
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    type User
  } from 'firebase/auth';
  import { auth, googleProvider, db } from '$lib/firebase';
  import { goto } from '$app/navigation';

  let user: User | null = null;
  let email = '';
  let password = '';
  let error = '';
  let loading = false;
  let firebaseReady = false;

onMount(() => {
  console.log('=== Firebase Debug Info ===');
  console.log('Environment:', import.meta.env.MODE);
  console.log('Auth exists:', !!auth);
  console.log('GoogleProvider exists:', !!googleProvider);
  console.log('DB exists:', !!db);
  console.log('API Key loaded:', !!import.meta.env.VITE_FIREBASE_API_KEY);
  console.log('API Key (first 10):', import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10));
  console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  console.log('Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log('All VITE_ vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')));
  console.log('=========================');

  if (!auth || !googleProvider || !db) {
    error = 'Firebase is not initialized. Please check your configuration.';
    console.error('Firebase initialization failed:', { auth, googleProvider, db });
    return;
  }

  firebaseReady = true;

  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    user = currentUser;
    if (currentUser) {
      console.log('User logged in:', currentUser.email);
    }
  });

  return () => unsubscribe();
});

  async function handleEmailSignIn() {
    if (!firebaseReady || !auth) {
      error = 'Firebase is not ready. Please refresh the page.';
      return;
    }

    error = '';
    loading = true;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = '/dashboard';
      
      email = '';
      password = '';
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      if (err.code === 'auth/invalid-credential') {
        error = 'Invalid email or password';
      } else if (err.code === 'auth/user-not-found') {
        error = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        error = 'Incorrect password';
      } else if (err.code === 'auth/too-many-requests') {
        error = 'Too many failed attempts. Please try again later';
      } else {
        error = err.message || 'Failed to sign in';
      }
    } finally {
      loading = false;
    }
  }

  async function handleGoogleSignIn() {
    if (!firebaseReady || !auth || !googleProvider || !db) {
      error = 'Firebase is not ready. Please refresh the page.';
      return;
    }

    error = '';
    loading = true;

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          provider: 'google'
        });
      }

      await goto('/dashboard');
    } catch (err: any) {
      console.error('Google sign in error:', err);
      
      if (err.code === 'auth/popup-closed-by-user') {
        error = 'Sign in cancelled';
      } else if (err.code === 'auth/popup-blocked') {
        error = 'Popup blocked. Please allow popups for this site';
      } else {
        error = err.message || 'Failed to sign in with Google';
      }
    } finally {
      loading = false;
    }
  }

  async function handleSignOut() {
    if (!auth) return;

    try {
      await signOut(auth);
    } catch (err: any) {
      error = err.message || 'Failed to sign out';
    }
  }

  function goToRegister() {
    goto('/register');
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
  <!-- Animated background elements -->
  <div class="absolute inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-20 left-10 w-72 h-72 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s;"></div>
  </div>

  <!-- Decorative grid -->
  <div class="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] pointer-events-none"></div>

  <div class="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl w-full max-w-md p-8">
    {#if !firebaseReady}
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
        <p class="text-slate-300">Initializing...</p>
      </div>
    {:else if user}
      <div class="text-center">
        <div class="mb-6">
          {#if user.photoURL}
            <img src={user.photoURL} alt="Profile" class="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-green-500/30" />
          {:else}
            <div class="w-20 h-20 rounded-full mx-auto mb-4 bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-green-500/30">
              {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : 'U')}
            </div>
          {/if}
          <h2 class="text-2xl font-bold text-white mb-2">
            Welcome{user.displayName ? `, ${user.displayName}` : ''}!
          </h2>
          <p class="text-slate-400">{user.email ?? 'No email available'}</p>
        </div>
        
        <button 
          on:click={handleSignOut}
          class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg shadow-red-500/20"
        >
          Sign Out
        </button>
      </div>
    {:else}
      <div>
        <!-- Logo/Icon -->
        <div class="text-center mb-6">
          <!-- <div class="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
            <span class="text-3xl">♻️</span>
          </div> -->
          <h2 class="text-3xl font-bold text-white mb-2">
            Welcome Back
          </h2>
          <p class="text-slate-400">
            Sign in to your EcoSort account
          </p>
        </div>

        {#if error}
          <div class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 backdrop-blur-sm">
            {error}
          </div>
        {/if}

        <form on:submit|preventDefault={handleEmailSignIn} class="space-y-4 mb-6">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              bind:value={email}
              required
              class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-white placeholder-slate-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              bind:value={password}
              required
              minlength="6"
              class="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-white placeholder-slate-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-green-700 disabled:to-emerald-800 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 shadow-lg shadow-green-500/30 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-slate-700"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-slate-800/50 text-slate-400">Or continue with</span>
          </div>
        </div>

        <button
          on:click={handleGoogleSignIn}
          disabled={loading}
          class="w-full bg-slate-900/50 hover:bg-slate-900/80 border-2 border-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-3 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg class="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>

        <div class="text-center mt-6">
          <button
            on:click={goToRegister}
            class="text-green-400 hover:text-green-300 font-medium text-sm transition-colors"
          >
            Don't have an account? Sign up
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  @keyframes pulse {
    0%, 100% {
      opacity: 0.3;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.05);
    }
  }

  .animate-pulse {
    animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
</style>