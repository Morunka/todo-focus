// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'; // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
// НЕ ИМПОРТИРУЕМ HomeView, так как его нет
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import ResetPasswordView from '@/views/ResetPasswordView.vue';
import MainPage from '@/components/MainPage.vue'; // <-- Убедитесь, что этот путь правильный

import { auth } from '../firebase'; // Убедитесь, что путь к firebase.js правильный
import { onAuthStateChanged } from 'firebase/auth';

const routes = [
  {
    path: '/',
    name: 'root', // Дадим этому маршруту имя 'root'
    redirect: { name: 'tasks' }, // По умолчанию перенаправляем на задачи
    meta: {
      requiresAuth: true // Этот маршрут требует аутентификации (будет обработан в beforeEach)
    }
  },
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordView,
    meta: {
      requiresAuth: false
    }
  },
  {
    path: '/tasks',
    name: 'tasks',
    component: MainPage,
    meta: {
      requiresAuth: true
    },
    beforeEnter: (to, from, next) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          next();
        } else {
          next('/login');
        }
      });
    }
  },
  // Добавьте catch-all маршрут для 404 ошибок в режиме Hash Mode
  {
    path: '/:catchAll(.*)', // <--- Этот маршрут перехватывает все неизвестные пути
    redirect: '/' // Перенаправляем на корень, который затем обработается роутером
  }
];

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL), // <--- ИЗМЕНЕНИЕ ЗДЕСЬ
  routes
});

let authInitialized = false;

router.beforeEach(async (to, from, next) => {
  if (!authInitialized) {
    await new Promise(resolve => {
      onAuthStateChanged(auth, user => {
        authInitialized = true;
        resolve(user);
      });
    });
  }

  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const currentUser = auth.currentUser;

  if (requiresAuth && !currentUser) {
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register' || to.path === '/reset-password' || to.path === '/') && currentUser) {
    next('/tasks');
  } else {
    next();
  }
});

export default router;