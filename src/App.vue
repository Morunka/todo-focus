<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <h2 class="brand-title">ToDo список «Фокус»</h2>
        </div>
        <div class="nav-links">
          <router-link to="/tasks" class="nav-link" v-if="user">
            <span class="nav-icon">📋</span>
            <span class="nav-text">Задачи</span>
          </router-link>

          <router-link to="/login" class="nav-link" v-if="!user">
            <span class="nav-icon">🔐</span>
            <span class="nav-text">Войти</span>
          </router-link>
          <div v-else class="user-info-dropdown">
            <button class="user-info-button" @click="toggleDropdown">
              <span class="user-icon">👤</span>
              <span class="user-name">{{ user.displayName || user.email }}</span>
              <span class="dropdown-arrow" :class="{ 'rotated': dropdownOpen }">▼</span>
            </button>
            <div class="dropdown-menu" v-if="dropdownOpen">
              <button @click="handleLogout" class="dropdown-item">
                <span class="dropdown-icon">➡️</span>
                Выйти
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <transition name="page" mode="out-in">
        <router-view/>
      </transition>
    </main>

    <FooterElement />
  </div>
</template>

<script>
import { auth, signOut, onAuthStateChanged } from './firebase'; // Убедитесь, что путь к firebase.js правильный
import FooterElement from './components/FooterElement.vue'; // <--- ИМПОРТ ФУТЕРА

export default {
  // <--- РЕГИСТРАЦИЯ КОМПОНЕНТА ФУТЕРА
  components: {
    FooterElement
  },
  data() {
    return {
      user: null, // Здесь будет храниться объект пользователя Firebase
      dropdownOpen: false // Для управления видимостью выпадающего меню
    };
  },
  created() {
    // Отслеживаем изменение состояния аутентификации
    onAuthStateChanged(auth, (currentUser) => {
      this.user = currentUser;
      // Если пользователь не залогинен и находится на /tasks, перенаправляем на /login
      if (!currentUser && this.$route.path === '/tasks') {
        this.$router.replace('/login'); // Используем replace, чтобы не добавлять в историю
      }
      // Если пользователь залогинен и находится на /login, /register, или /reset-password, перенаправляем на /tasks
      else if (currentUser && (this.$route.path === '/login' || this.$route.path === '/register' || this.$route.path === '/reset-password')) {
        this.$router.replace('/tasks'); // Используем replace
      }
      // Дополнительное условие: если пользователь залогинен и находится на корневом '/',
      // и маршрутизатор еще не перенаправил на /tasks (что должно произойти благодаря redirect в роутере)
      else if (currentUser && this.$route.path === '/') {
        this.$router.replace('/tasks');
      }
    });
  },
  methods: {
    async handleLogout() {
      try {
        await signOut(auth);
        this.dropdownOpen = false; // Закрыть дропдаун после выхода
        // Firebase автоматически перенаправит на '/login' благодаря beforeEach в router/index.js
      } catch (error) {
        console.error("Ошибка выхода:", error);
      }
    },
    toggleDropdown() {
      this.dropdownOpen = !this.dropdownOpen;
    },
    // Закрытие дропдауна при клике вне его
    handleClickOutside(event) {
      const userInfoDropdown = this.$el.querySelector('.user-info-dropdown');
      // Если дропдаун открыт, и клик произошел вне элемента дропдауна
      if (this.dropdownOpen && userInfoDropdown && !userInfoDropdown.contains(event.target)) {
        this.dropdownOpen = false;
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleClickOutside);
  },
  beforeUnmount() {
    document.removeEventListener('click', this.handleClickOutside);
  }
};
</script>

<style>
/* Все ваши стили из предыдущего ответа остаются без изменений. */
/* Новые стили для user-info-dropdown, user-info-button и dropdown-menu,
   которые вы уже добавили, остаются здесь. */
#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 0;
  display: flex; /* <--- ДОБАВЛЕНО для Flexbox */
  flex-direction: column; /* <--- ДОБАВЛЕНО для Flexbox */
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
}

.navbar {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: sticky;
  top: 0;
  z-index: 100;
  animation: slideDown 0.8s ease-out;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
}

.nav-brand {
  animation: fadeInLeft 0.8s ease-out;
}

.brand-title {
  color: white;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.nav-links {
  display: flex;
  gap: 1rem;
  align-items: center; /* Выравнивание элементов по центру */
  animation: fadeInRight 0.8s ease-out;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  font-weight: 600;
  border-radius: 25px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.nav-link::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.nav-link:hover {
  color: white;
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.nav-link:hover::before {
  left: 100%;
}

.nav-link.router-link-exact-active {
  color: white;
  background: linear-gradient(45deg, #42b983, #369870);
  box-shadow: 0 2px 8px rgba(66, 185, 131, 0.3);
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-text {
  font-size: 1rem;
}

/* Новые стили для отображения информации о пользователе и выпадающего меню */
.user-info-dropdown {
  position: relative;
  display: inline-block;
  margin-left: 1rem; /* Отступ от других ссылок */
}

.user-info-button {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.5rem;
  color: white;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.user-info-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
}

.user-icon {
  font-size: 1.2rem;
}

.user-name {
  max-width: 150px; /* Ограничиваем ширину имени, чтобы оно не было слишком длинным */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-arrow {
  font-size: 0.8rem;
  transition: transform 0.3s ease;
}

.dropdown-arrow.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px); /* Отступ от кнопки */
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  min-width: 160px;
  z-index: 1;
  overflow: hidden;
  animation: slideInFromTop 0.3s ease-out;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 10px 15px;
  border: none;
  background: none;
  text-align: left;
  cursor: pointer;
  font-size: 1rem;
  color: #333;
  transition: background-color 0.2s ease, color 0.2s ease;
}

.dropdown-item:hover {
  background-color: #f0f0f0;
  color: #667eea;
}

.dropdown-icon {
  font-size: 1.1rem;
  margin-right: 5px;
}


.main-content {
  flex-grow: 1; /* <--- ДОБАВЛЕНО для Flexbox */
  animation: fadeInUp 0.8s ease-out 0.2s both;
}

/* Page transitions */
.page-enter-active {
  transition: all 0.4s ease-out;
}

.page-leave-active {
  transition: all 0.3s ease-in;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Animations */
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromTop {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .nav-container {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
  }

  .nav-links {
    width: 100%;
    justify-content: center;
  }

  .nav-link, .user-info-button {
    flex: 1;
    justify-content: center;
    min-width: 100px;
    padding: 0.75rem 1rem;
  }

  .brand-title {
    font-size: 1.5rem;
  }

  .user-name {
    max-width: 80px; /* Уменьшаем для мобильных */
  }

  .user-info-dropdown {
    margin-left: 0; /* Убираем отступ на маленьких экранах */
    width: 100%;
  }

  .dropdown-menu {
    left: 0; /* Выравниваем по левому краю кнопки */
    width: 100%;
    min-width: unset;
  }
}

@media (max-width: 480px) {
  .nav-link, .user-info-button {
    padding: 0.5rem 0.8rem;
    font-size: 0.9rem;
  }

  .nav-icon, .user-icon {
    font-size: 1rem;
  }

  .brand-title {
    font-size: 1.3rem;
  }
}

/* Стили футера (добавлены из FooterElement.vue и при необходимости адаптированы) */
.bg-gray-800 {
  background-color: #2d3748; /* Пример цвета */
}

.text-white {
  color: #ffffff;
}

.py-6 {
  padding-top: 1.5rem; /* 24px */
  padding-bottom: 1.5rem; /* 24px */
}

.mt-auto {
  margin-top: auto; /* Прикрепляет футер к низу */
}

.container {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.px-4 {
  padding-left: 1rem; /* 16px */
  padding-right: 1rem; /* 16px */
}

.text-center {
  text-align: center;
}

.text-sm {
  font-size: 0.875rem; /* 14px */
}

.mb-2 {
  margin-bottom: 0.5rem; /* 8px */
}

.text-blue-400 {
  color: #63b3ed;
}
.hover\:text-blue-300:hover {
  color: #90cdf4;
}

.text-purple-400 {
  color: #a78bfa;
}
.hover\:text-purple-300:hover {
  color: #c4b5fd;
}

.text-green-400 {
  color: #68d391;
}
.hover\:text-green-300:hover {
  color: #9ae6b4;
}

.text-yellow-400 {
  color: #f6e05e;
}
.hover\:text-yellow-300:hover {
  color: #faf089;
}

.underline {
  text-decoration: underline;
}

.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.duration-200 {
  transition-duration: 200ms;
}
</style>
