<template>
  <div id="app">
    <title>ToDo список «Фокус»</title> <nav class="navbar">
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
              <span class="user-name">{{ user?.displayName || user?.email || 'Пользователь' }}</span>
              <span class="dropdown-arrow" :class="{ 'rotated': dropdownOpen }">▼</span>
            </button>
            <div class="dropdown-menu" v-if="dropdownOpen">
              <button @click="handleLogout" class="dropdown-item">
                <span class="dropdown-icon">➡️</span>
                Выйти
              </button>
              <button @click="openDeleteConfirmation" class="dropdown-item delete-account-item">
                <span class="dropdown-icon">🗑️</span>
                Удалить аккаунт
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="page" mode="out-in">
          <component :is="Component" :user="user" ref="mainPageRef" @show-reauth-modal="openReauthModal" />
        </transition>
      </router-view>
    </main>

    <FooterElement />

    <ConfirmationModal
      :isVisible="showReauthModal"
      title="Требуется повторная аутентификация"
      message="Для выполнения этого действия необходимо недавнее подтверждение вашей учетной записи. Пожалуйста, выйдите из системы и войдите снова, затем повторите попытку."
      confirmButtonText="Понятно"
      @confirm="closeReauthModalAndLogout"
      @cancel="closeReauthModal" />
  </div>
</template>

<script>
import { auth, signOut, onAuthStateChanged } from './firebase'; // Import only what's needed
import FooterElement from './components/FooterElement.vue';
import ConfirmationModal from './components/ConfirmationModal.vue';
import { ref, onMounted, onUnmounted } from 'vue'; // Import Composition API functions
import { useRouter, useRoute } from 'vue-router'; // Import useRouter and useRoute

export default {
  components: {
    FooterElement,
    ConfirmationModal
  },
  setup() { // Use setup for Composition API
    const mainPageRef = ref(null); // Ref for the MainPage component instance
    const user = ref(null); // Central user state
    const dropdownOpen = ref(false);
    const showReauthModal = ref(false);

    const router = useRouter(); // Initialize router
    const route = useRoute();   // Initialize route

    // Listen for Firebase Auth state changes
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
    });

    // Handle user logout
    const handleLogout = async () => {
      try {
        await signOut(auth);
        dropdownOpen.value = false;
        console.log("User successfully logged out. Redirecting to /login.");
        if (route.path !== '/login') { // Use useRoute() from vue-router
          router.replace('/login'); // Use useRouter() from vue-router
        }
      } catch (error) {
        console.error("Error logging out:", error);
        alert(`Ошибка при выходе: ${error.message}`);
      }
    };

    // Toggle the user dropdown menu
    const toggleDropdown = () => {
      dropdownOpen.value = !dropdownOpen.value;
    };

    // Close dropdown if click outside
    const handleClickOutside = (event) => {
      const userInfoDropdown = document.querySelector('.user-info-dropdown');
      if (dropdownOpen.value && userInfoDropdown && !userInfoDropdown.contains(event.target)) {
        dropdownOpen.value = false;
      }
    };

    // Trigger account deletion process in MainPage.vue
    const openDeleteConfirmation = () => {
      dropdownOpen.value = false; // Close the user dropdown
      // Call the method on the MainPage component instance via its ref
      if (mainPageRef.value && typeof mainPageRef.value.promptDeleteAccount === 'function') {
        mainPageRef.value.promptDeleteAccount();
      } else {
        console.warn("MainPage component or promptDeleteAccount method not found via ref.");
        alert("Ошибка: Функция удаления аккаунта недоступна. Пожалуйста, попробуйте позже.");
      }
    };

    // Methods for the re-authentication modal (triggered by MainPage.vue if needed)
    const openReauthModal = () => {
      showReauthModal.value = true;
    };
    const closeReauthModal = () => {
      showReauthModal.value = false;
    };
    const closeReauthModalAndLogout = () => {
      closeReauthModal();
      handleLogout(); // Automatically log out after they acknowledge the message
    };

    // Lifecycle hooks for global click listener
    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
    });
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
    });

    // Return reactive state and methods to the template
    return {
      user,
      dropdownOpen,
      showReauthModal,
      mainPageRef, // Make the ref accessible in the template
      handleLogout,
      toggleDropdown,
      openDeleteConfirmation,
      openReauthModal,
      closeReauthModal,
      closeReauthModalAndLogout
    };
  }
};
</script>

<style>
/* All your existing styles remain unchanged. */
/* I'm including the full style block here as requested. */

#app {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-smoothing: grayscale;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
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
  align-items: center;
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

/* New styles for user info and dropdown menu */
.user-info-dropdown {
  position: relative;
  display: inline-block;
  margin-left: 1rem;
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
  max-width: 150px;
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
  top: calc(100% + 10px);
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

/* NEW: Style for the delete account button */
.dropdown-item.delete-account-item {
  color: #dc3545; /* Red color to indicate a destructive action */
  font-weight: 600;
}

.dropdown-item.delete-account-item:hover {
  background-color: #f8d7da; /* Light red background on hover */
  color: #a71d2a; /* Darker red on hover */
}


.main-content {
  flex-grow: 1;
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
    max-width: 80px;
  }

  .user-info-dropdown {
    margin-left: 0;
    width: 100%;
  }

  .dropdown-menu {
    left: 0;
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

/* Footer styles (copied from FooterElement.vue and adapted as needed) */
.bg-gray-800 {
  background-color: #2d3748;
}

.text-white {
  color: #ffffff;
}

.py-6 {
  padding-top: 1.5rem;
  padding-bottom: 1.5rem;
}

.mt-auto {
  margin-top: auto;
}

.container {
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}

.text-center {
  text-align: center;
}

.text-sm {
  font-size: 0.875rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
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

/* Custom Scrollbar Styles */
/* Webkit browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 12px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(5px);
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
}

::-webkit-scrollbar-thumb:active {
  background: linear-gradient(135deg, #4c5bc7 0%, #5e3a7e 100%);
}

/* Firefox scrollbar */
html {
  scrollbar-width: thin;
  scrollbar-color: #667eea rgba(255, 255, 255, 0.1);
}

/* Custom scrollbar for dropdown menu */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
}

/* Footer styles (copied from FooterElement.vue and adapted as needed) */
.bg-gray-800 {
  background-color: #2d3748;
}
</style>
