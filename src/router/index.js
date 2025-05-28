// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
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
    // Дополнительная логика защиты маршрута, которая срабатывает ДО загрузки компонента
    beforeEnter: (to, from, next) => {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          next(); // Разрешаем доступ, если пользователь залогинен
        } else {
          next('/login'); // Перенаправляем на страницу входа, если не залогинен
        }
      });
    }
  }
];

const router = createRouter({
  history: createWebHistory('/todo-focus/'),
  routes,
})

let authInitialized = false;

// Глобальный навигационный хук для всех маршрутов
router.beforeEach(async (to, from, next) => {
  // Ждем инициализации Firebase Auth, чтобы получить текущего пользователя
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

  // Если маршрут требует аутентификации, а пользователь не залогинен, перенаправляем на логин
  if (requiresAuth && !currentUser) {
    next('/login');
  }

  else if ((to.path === '/login' || to.path === '/register' || to.path === '/reset-password' || to.path === '/') && currentUser) {
    next('/tasks');
  }
  // В остальных случаях разрешаем переход
  else {
    next();
  }
});

export default router;