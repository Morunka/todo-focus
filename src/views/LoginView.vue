<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">🔐</div>
        <h1 class="login-title">Добро пожаловать</h1>
        <p class="login-subtitle">Войдите в свою учетную запись</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <div class="input-wrapper">
            <input 
              v-model="email" 
              type="email" 
              class="form-input"
              :class="{ 'error': errors.email, 'success': validFields.email }"
              placeholder="example@email.com"
              @blur="validateEmail"
              @input="clearError('email')"
              required
            />
            <span class="input-icon">📧</span>
          </div>
          <transition name="error">
            <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
          </transition>
        </div>
        
        <div class="form-group">
          <label class="form-label">Пароль</label>
          <div class="input-wrapper">
            <input 
              v-model="password" 
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ 'error': errors.password, 'success': validFields.password }"
              placeholder="Введите пароль"
              @blur="validatePassword"
              @input="clearError('password')"
              required
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <transition name="error">
            <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
          </transition>
        </div>
        
        <div class="form-options">
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="rememberMe" class="checkbox">
            <span class="checkmark"></span>
            <span class="checkbox-text">Запомнить меня</span>
          </label>
          <router-link to="/reset-password" class="forgot-link">Забыли пароль?</router-link> 
        </div>
        
        <button 
          type="submit" 
          class="login-button"
          :class="{ 'loading': isLoading }"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="!isLoading" class="button-content">
            <span class="button-text">Войти</span>
            <span class="button-icon">→</span>
          </span>
          <span v-else class="loading-spinner"></span>
        </button>
      </form>
      
      <div class="login-footer">
        <p class="footer-text">
          Нет аккаунта? 
          <router-link to="/register" class="register-link">Зарегистрироваться</router-link>
        </p>
        <p v-if="loginError" class="error-message text-center">{{ loginError }}</p> </div>
    </div>
    
    <div class="bg-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
  </div>
</template>

<script>
// Импортируем auth и signInWithEmailAndPassword из вашего firebase.js
import { auth, signInWithEmailAndPassword } from "../firebase"; // <-- ОБНОВЛЕНО

export default {
  name: 'LoginView',
  data() {
    return {
      email: '',
      password: '',
      showPassword: false,
      rememberMe: false,
      isLoading: false,
      errors: {},
      validFields: {},
      loginError: '' // <-- Добавлено для отображения ошибок входа
    };
  },
  computed: {
    isFormValid() {
      // Форма считается валидной, если все поля заполнены и нет ошибок валидации
      // Убедитесь, что email и password не пустые, и что нет ошибок в объекте errors
      return this.email.trim() !== '' && 
             this.password.trim() !== '' && 
             !this.errors.email && 
             !this.errors.password;
    }
  },
  methods: {
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.email) {
        this.errors.email = 'Email обязателен';
        this.validFields.email = false;
      } else if (!emailRegex.test(this.email)) {
        this.errors.email = 'Неверный формат email';
        this.validFields.email = false;
      } else {
        // Очищаем ошибку, если email валиден
        if (this.errors.email) {
            delete this.errors.email;
        }
        this.validFields.email = true;
      }
    },
    validatePassword() {
      if (!this.password) {
        this.errors.password = 'Пароль обязателен';
        this.validFields.password = false;
      } else if (this.password.length < 6) {
        this.errors.password = 'Пароль должен быть не менее 6 символов';
        this.validFields.password = false;
      } else {
        // Очищаем ошибку, если пароль валиден
        if (this.errors.password) {
            delete this.errors.password;
        }
        this.validFields.password = true;
      }
    },
    clearError(field) {
      if (this.errors[field]) {
        delete this.errors[field];
      }
      this.loginError = ''; // Также очищаем общую ошибку входа
    },
    async handleLogin() {
      this.validateEmail();
      this.validatePassword();
      this.loginError = ''; // Очищаем предыдущую ошибку входа

      // Если форма невалидна после валидации, прекращаем выполнение
      if (!this.isFormValid) {
        return;
      }
      
      this.isLoading = true; // Начинаем загрузку
      
      try {
        // Убираем simulate API call, теперь используем Firebase Auth
        // await new Promise(resolve => setTimeout(resolve, 2000)); // УДАЛИТЬ ЭТУ СТРОКУ

        await signInWithEmailAndPassword(auth, this.email, this.password);
        
        // Вход успешен, перенаправляем на страницу задач
        // Vue Router автоматически обновит состояние аутентификации
        this.$router.push('/');
        
      } catch (error) {
        console.error('Login error:', error.code, error.message);
        // Обработка ошибок Firebase аутентификации
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            this.loginError = 'Неверный email или пароль.';
            break;
          case 'auth/invalid-email':
            this.loginError = 'Неверный формат email.';
            break;
          case 'auth/user-disabled':
            this.loginError = 'Ваша учетная запись заблокирована.';
            break;
          default:
            this.loginError = 'Ошибка входа. Попробуйте снова.';
            break;
        }
      } finally {
        this.isLoading = false; // Завершаем загрузку независимо от результата
      }
    }
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
  position: relative;
  z-index: 2;
  animation: slideInUp 0.8s ease-out;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease-out 0.2s both;
}

.login-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.login-title {
  color: #333;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.login-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.login-form {
  animation: fadeInUp 0.8s ease-out 0.4s both;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  color: #333;
  font-weight: 600;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.form-input {
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  transform: translateY(-2px);
}

.form-input.error {
  border-color: #f44336;
  box-shadow: 0 0 0 3px rgba(244, 67, 54, 0.1);
}

.form-input.success {
  border-color: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.input-icon {
  position: absolute;
  right: 1rem;
  font-size: 1.2rem;
  pointer-events: none;
}

.password-toggle {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.password-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.error-message {
  color: #f44336;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.checkbox {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  margin-right: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.checkbox:checked + .checkmark {
  background-color: #667eea;
  border-color: #667eea;
}

.checkbox:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-weight: bold;
  font-size: 0.8rem;
}

.checkbox-text {
  color: #666;
  font-size: 0.9rem;
}

.forgot-link {
  color: #667eea;
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.3s ease;
}

.forgot-link:hover {
  color: #5a6fd8;
}

.login-button {
  width: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.button-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.button-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.login-button:hover .button-icon {
  transform: translateX(4px);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.login-footer {
  text-align: center;
  margin-top: 2rem;
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

.footer-text {
  color: #666;
  margin: 0;
}

.register-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.register-link:hover {
  color: #5a6fd8;
}

/* Background decoration */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.floating-shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 6s ease-in-out infinite;
}

.shape-1 {
  width: 100px;
  height: 100px;
  top: 20%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 10%;
  animation-delay: 2s;
}

.shape-3 {
  width: 80px;
  height: 80px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

/* Animations */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -10px, 0);
  }
  70% {
    transform: translate3d(0, -5px, 0);
  }
  90% {
    transform: translate3d(0,-2px,0);
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* Transition animations */
.error-enter-active {
  transition: all 0.3s ease-out;
}

.error-leave-active {
  transition: all 0.3s ease-in;
}

.error-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.error-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Добавьте стиль для централизации текста ошибки в футере, если необходимо */
.login-footer .error-message.text-center {
    text-align: center;
    margin-top: 1rem;
    color: #f44336; /* Убедитесь, что цвет заметен на вашем фоне */
}

/* Responsive design */
@media (max-width: 768px) {
  .login-container {
    padding: 1rem;
  }
  
  .login-card {
    padding: 2rem;
  }
  
  .login-title {
    font-size: 1.5rem;
  }
  
  .form-options {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
