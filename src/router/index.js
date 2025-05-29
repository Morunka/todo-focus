// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import ResetPasswordView from '@/views/ResetPasswordView.vue';
import MainPage from '@/components/MainPage.vue';

import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const routes = [
  {
    path: '/',
    name: 'root',
    redirect: { name: 'tasks' }, // Default redirect to tasks if authenticated
    meta: {
      requiresAuth: true // This route implicitly requires authentication via redirect
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      requiresAuth: false // Public page
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      requiresAuth: false // Public page
    }
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordView,
    meta: {
      requiresAuth: false // Public page
    }
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: MainPage,
    meta: {
      requiresAuth: true // Protected page
    }
  },
  // Catch-all route for 404 errors, redirects to root which then redirects to tasks/login
  {
    path: '/:catchAll(.*)',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes
});

// A Promise to ensure Firebase Auth state is resolved before any routing decision.
// This prevents race conditions where the router tries to redirect before Firebase confirms user status.
const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        unsubscribe(); // Unsubscribe immediately after the first state change
        resolve(user);
      },
      reject
    );
  });
};

router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const currentUser = await getCurrentUser(); // Wait for the current user to be determined

  // Scenario 1: Route requires authentication AND user is NOT logged in OR email is not verified.
  if (requiresAuth && (!currentUser || !currentUser.emailVerified)) {
    // If the user is trying to access a protected route (like /tasks) while logged out
    // or with an unverified email, redirect to the login page.
    if (to.path !== '/login' && to.path !== '/register' && to.path !== '/reset-password') {
      console.log(`Redirecting to /login from ${to.path} (requires auth and/or email verification, but condition not met).`);
      next('/login');
    } else {
      // If the destination is already a public auth page (login, register, reset), allow access.
      console.log(`Allowing navigation to ${to.path} (public auth page).`);
      next();
    }
  }
  // Scenario 2: User IS logged in AND email IS verified AND trying to access a public authentication page
  // (login, register, reset-password, or the root path which redirects to tasks).
  else if ((to.path === '/login' || to.path === '/register' || to.path === '/reset-password' || to.path === '/') && currentUser && currentUser.emailVerified) {
    console.log(`Redirecting to /tasks from ${to.path} (user logged in and email verified, but on public auth page).`);
    next('/tasks');
  }
  // Scenario 3: All other cases (user is logged in and verified accessing a protected route,
  // or user is not logged in and accessing a non-protected public route).
  else {
    console.log(`Allowing navigation to ${to.path} (no special auth redirect needed).`);
    next();
  }
});

export default router;