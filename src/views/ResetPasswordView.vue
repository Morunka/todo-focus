<template>
  <div class="reset-password-container">
    <div class="reset-password-card">
      <div class="reset-password-header">
        <div class="reset-password-icon">🔐</div>
        <h1 class="reset-password-title">Сброс пароля</h1>
        <p class="reset-password-subtitle">Введите ваш email, и мы отправим вам ссылку для сброса пароля.</p>
      </div>

      <form @submit.prevent="handleResetPassword" class="reset-password-form">
        <div class="form-group">
          <label class="form-label">Email</label>
          <div class="input-wrapper">
            <input
              v-model="email"
              type="email"
              class="form-input"
              :class="{ 'error': errors.email }"
              placeholder="example@email.com"
              @blur="validateEmail"
              @input="clearError('email')"
              :disabled="isLoading"
              required
            />
            <span class="input-icon">📧</span>
          </div>
          <transition name="error">
            <p v-if="errors.email" class="error-message">{{ errors.email }}</p>
          </transition>
        </div>

        <button
          type="submit"
          class="reset-button"
          :class="{ 'loading': isLoading }"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="!isLoading" class="button-content">
            <span class="button-text">Отправить ссылку</span>
            <span class="button-icon">📤</span>
          </span>
          <span v-else class="loading-spinner"></span>
        </button>
      </form>

      <div class="reset-password-footer">
        <transition name="message">
          <div v-if="message" :class="{ 'success-message': isSuccess, 'error-message': !isSuccess }">
            {{ message }}
          </div>
        </transition>
        
        <div class="back-to-login">
          <router-link to="/login" class="back-link">
            <span class="back-icon">←</span>
            Вернуться ко входу
          </router-link>
        </div>
      </div>
    </div>

    <div class="bg-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
  </div>
</template>

<script>
import { auth, sendPasswordResetEmail } from "../firebase";

export default {
  name: 'ResetPasswordView',
  data() {
    return {
      email: '',
      isLoading: false,
      message: '',
      isSuccess: false,
      errors: {}
    };
  },
  computed: {
    isFormValid() {
      return this.email.trim() !== '' && !this.errors.email;
    }
  },
  methods: {
    validateEmail() {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!this.email) {
        this.errors.email = 'Email обязателен';
      } else if (!emailRegex.test(this.email)) {
        this.errors.email = 'Неверный формат email';
      } else {
        delete this.errors.email;
      }
    },
    
    clearError(field) {
      delete this.errors[field];
      this.message = '';
      this.isSuccess = false;
    },

    async handleResetPassword() {
      this.validateEmail();
      
      if (!this.isFormValid) {
        return;
      }

      this.isLoading = true;
      this.message = '';
      this.isSuccess = false;

      try {
        await sendPasswordResetEmail(auth, this.email);
        this.message = 'Ссылка для сброса пароля отправлена на ваш email. Проверьте папку "Спам", если не видите письма. Убедитесь что ваш аккаунт зарегестрирован.';
        this.isSuccess = true;
        this.email = '';
      } catch (error) {
        console.error("Ошибка сброса пароля:", error.code, error.message);
        this.isSuccess = false;
        switch (error.code) {
          case 'auth/invalid-email':
            this.message = 'Неверный формат email.';
            break;
          case 'auth/user-not-found':
            this.message = 'Пользователь с таким email не найден.';
            break;
          case 'auth/too-many-requests':
            this.message = 'Слишком много запросов. Попробуйте позже.';
            break;
          case 'auth/network-request-failed':
            this.message = 'Ошибка сети. Проверьте ваше интернет-соединение.';
            break;
          default:
            this.message = 'Произошла ошибка при отправке ссылки. Попробуйте снова.';
            break;
        }
      } finally {
        this.isLoading = false;
      }
    }
  }
};
</script>

<style scoped>
.reset-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.reset-password-card {
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

.reset-password-header {
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease-out 0.2s both;
}

.reset-password-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.reset-password-title {
  color: #333;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.reset-password-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
  line-height: 1.5;
}

.reset-password-form {
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
  box-sizing: border-box;
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

.form-input:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.input-icon {
  position: absolute;
  right: 1rem;
  font-size: 1.2rem;
  pointer-events: none;
}

.error-message {
  color: #f44336;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

.reset-button {
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
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
}

.reset-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
}

.reset-button:disabled {
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

.reset-button:hover .button-icon {
  transform: scale(1.2);
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
  flex-grow: 0;
  min-width: 20px;
  min-height: 20px;
}

.reset-password-footer {
  text-align: center;
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

.success-message {
  color: #4caf50;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
  line-height: 1.5;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  animation: fadeIn 0.4s ease-out;
}

.error-message:not(.form-group .error-message) {
  color: #f44336;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  font-weight: 500;
  line-height: 1.5;
  background-color: rgba(244, 67, 54, 0.1);
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(244, 67, 54, 0.2);
  animation: fadeIn 0.4s ease-out;
}

.back-to-login {
  margin-top: 1.5rem;
}

.back-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.back-link:hover {
  color: #5a6fd8;
  transform: translateX(-2px);
}

.back-icon {
  font-size: 1.2rem;
  transition: transform 0.3s ease;
}

.back-link:hover .back-icon {
  transform: translateX(-2px);
}

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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Transitions */
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

.message-enter-active {
  transition: all 0.4s ease-out;
}

.message-leave-active {
  transition: all 0.4s ease-in;
}

.message-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.message-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .reset-password-container {
    padding: 1rem;
  }

  .reset-password-card {
    padding: 2rem;
  }

  .reset-password-title {
    font-size: 1.5rem;
  }

  .reset-password-subtitle {
    font-size: 0.9rem;
  }

  .success-message,
  .error-message:not(.form-group .error-message) {
    font-size: 0.9rem;
    padding: 0.8rem;
  }
}
</style>
