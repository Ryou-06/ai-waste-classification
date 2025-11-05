<script lang="ts">
  import { onMount } from 'svelte';
  import { doc, setDoc, getDoc } from 'firebase/firestore';
  import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    type User
  } from 'firebase/auth';
  import { auth, googleProvider, db } from '$lib/firebase'; // ✅ use shared instance
  import { goto } from '$app/navigation';

  const firebaseConfig = {
    apiKey: "AIzaSyBXmGMVzWmatGLTFOskyngyOi1fRVnyDrg",
    authDomain: "ai-classification-system.firebaseapp.com",
    projectId: "ai-classification-system",
    storageBucket: "ai-classification-system.appspot.com",
    messagingSenderId: "711983308595",
    appId: "1:711983308595:web:f9d834a983121f90a5e846"
  };

  let user: User | null = null;
  let email = '';
  let password = '';
  let isSignUp = false;
  let error = '';
  let loading = false;

  onMount(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      user = currentUser;
    });
    return () => unsubscribe();
  });

async function handleEmailAuth() {
  error = '';
  loading = true;

  try {
    if (isSignUp) {
      // 🟢 Create new user with email and password
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = cred.user;

      // 🗃️ Save user to Firestore
      await setDoc(doc(db, 'users', newUser.uid), {
        uid: newUser.uid,
        email: newUser.email,
        displayName: newUser.displayName ?? '',
        photoURL: newUser.photoURL ?? '',
        createdAt: new Date().toISOString(),
        provider: 'email'
      });
    } else {
      // 🔵 Sign in existing user
      await signInWithEmailAndPassword(auth, email, password);
    }

    // ✅ Redirect to dashboard
    window.location.href = '/';

    // 🧹 Reset form fields
    email = '';
    password = '';
  } catch (err: unknown) {
    if (err instanceof Error) error = err.message;
    else error = String(err);
  } finally {
    loading = false;
  }
}


async function handleGoogleSignIn() {
  error = '';
  loading = true;

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Reference to Firestore user document
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    // If user doesn't exist yet, create it
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

    // ✅ Redirect to dashboard
    window.location.href = '/';
  } catch (err: unknown) {
    if (err instanceof Error) error = err.message;
    else error = String(err);
  } finally {
    loading = false;
  }
}


  async function handleSignOut() {
    try {
      await signOut(auth);
    } catch (err: unknown) {
      if (err instanceof Error) error = err.message;
      else error = String(err);
    }
  }
</script>


<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
  <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
{#if user}
  <div class="text-center">
    <div class="mb-6">
      {#if user.photoURL}
        <img src={user.photoURL} alt="Profile" class="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-indigo-100" />
      {:else}
        <div class="w-20 h-20 rounded-full mx-auto mb-4 bg-indigo-500 flex items-center justify-center text-white text-2xl font-bold">
          {user.email ? user.email[0].toUpperCase() : 'U'}
        </div>
      {/if}
      <h2 class="text-2xl font-bold text-gray-800 mb-2">Welcome!</h2>
      <p class="text-gray-600">{user.email ?? 'No email available'}</p>
    </div>
        
    <button 
      on:click={handleSignOut}
      class="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
    >
      Sign Out
    </button>
  </div>
    {:else}
      <!-- Login/Signup View -->
      <div>
        <h2 class="text-3xl font-bold text-center text-gray-800 mb-2">
          {isSignUp ? 'Create Account' : 'Welcome Back'}
        </h2>
        <p class="text-center text-gray-600 mb-8">
          {isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
        </p>

        {#if error}
          <div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        {/if}

        <form on:submit|preventDefault={handleEmailAuth} class="space-y-4 mb-6">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              bind:value={email}
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              bind:value={password}
              required
              minlength="6"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div class="relative mb-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <button
          on:click={handleGoogleSignIn}
          disabled={loading}
          class="w-full bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-3"
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
            on:click={() => { isSignUp = !isSignUp; error = ''; }}
            class="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>