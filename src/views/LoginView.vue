<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">🔑</div>
        <h1 class="login-title">Добро пожаловать!</h1>
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
              :class="{ 'error': errors.email }"
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
              :class="{ 'error': errors.password }"
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
          <router-link to="/reset-password" class="forgot-password-link">Забыли пароль?</router-link>
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
        <p v-if="loginError" class="error-message text-center">{{ loginError }}</p>
        <p v-if="showResendEmailButton" class="info-message text-center">
            Пожалуйста, подтвердите свой Email.
            <button
                @click="resendVerificationEmail"
                :disabled="isResendLoading || resendCooldown > 0"
                class="resend-email-button"
            >
                <span v-if="isResendLoading" class="small-loading-spinner"></span>
                <span v-else-if="resendCooldown > 0">Повторно через {{ resendCooldown }}с</span>
                <span v-else>Отправить повторно</span>
            </button>
        </p>
        <p v-if="resendSuccessMessage" class="success-message text-center">{{ resendSuccessMessage }}</p>
      </div>
    </div>

    <div class="bg-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import {
  auth,
  signInWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  browserSessionPersistence,
  browserLocalPersistence,
  signOut,
} from '../firebase';

const router = useRouter();

// Reactive state
const email = ref('');
const password = ref('');
const showPassword = ref(false);
const rememberMe = ref(true);
const isLoading = ref(false);
const isResendLoading = ref(false);
const errors = ref({});
const loginError = ref('');
const showResendEmailButton = ref(false);
const resendCooldown = ref(0);
let resendCooldownInterval = null;
const resendSuccessMessage = ref('');

// NEW: Store the user object if verification is needed
const unverifiedUser = ref(null);

// Computed properties
const isFormValid = computed(() => {
  return email.value.trim() !== '' &&
         password.value.trim() !== '' &&
         !errors.value.email &&
         !errors.value.password;
});

// Methods
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value) {
    errors.value.email = 'Email обязателен';
  } else if (!emailRegex.test(email.value)) {
    errors.value.email = 'Неверный формат email';
  } else {
    delete errors.value.email;
  }
};

const validatePassword = () => {
  if (!password.value) {
    errors.value.password = 'Пароль обязателен';
  } else if (password.value.length < 6) {
    errors.value.password = 'Пароль должен быть не менее 6 символов';
  } else {
    delete errors.value.password;
  }
};

const clearError = (field) => {
  delete errors.value[field];
  loginError.value = '';
  showResendEmailButton.value = false;
  resendSuccessMessage.value = '';
  unverifiedUser.value = null; // Clear unverified user on new input/error clear
};

const startCoolDown = (duration) => {
  resendCooldown.value = duration;
  if (resendCooldownInterval) {
    clearInterval(resendCooldownInterval);
  }
  resendCooldownInterval = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--;
    } else {
      clearInterval(resendCooldownInterval);
      resendCooldownInterval = null;
    }
  }, 1000);
};

const handleLogin = async () => {
  validateEmail();
  validatePassword();
  loginError.value = '';
  showResendEmailButton.value = false;
  resendSuccessMessage.value = '';
  unverifiedUser.value = null; // Reset unverified user at the start of login attempt

  if (!isFormValid.value) {
    return;
  }

  isLoading.value = true;

  try {
    await setPersistence(
      auth,
      rememberMe.value ? browserLocalPersistence : browserSessionPersistence
    );

    const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;

    if (!user.emailVerified) {
      // Store the user object before signing them out
      unverifiedUser.value = user;

      await signOut(auth); // Sign out the user immediately

      loginError.value = 'Ваш Email не подтвержден. Пожалуйста, проверьте свою почту (и папку "Спам"!) и подтвердите аккаунт, прежде чем войти.';
      showResendEmailButton.value = true;
      startCoolDown(60);
    } else {
      router.push('/tasks');
    }
  } catch (error) {
    console.error('Login error:', error.code, error.message);
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        loginError.value = 'Неверный Email или пароль.';
        break;
      case 'auth/invalid-email':
        loginError.value = 'Неверный формат Email. Проверьте правильность ввода.';
        break;
      case 'auth/too-many-requests':
        loginError.value = 'Слишком много неудачных попыток входа. Попробуйте позже.';
        showResendEmailButton.value = true;
        startCoolDown(60);
        break;
      case 'auth/network-request-failed':
        loginError.value = 'Ошибка сети. Проверьте ваше интернет-соединение.';
        break;
      default:
        loginError.value = 'Произошла ошибка при входе. Пожалуйста, попробуйте снова. ' + error.message;
        break;
    }
  } finally {
    isLoading.value = false;
  }
};

const resendVerificationEmail = async () => {
  // Use the stored unverifiedUser first, as it's more reliable after a recent signOut
  const userToVerify = unverifiedUser.value || auth.currentUser;

  if (userToVerify) {
    isResendLoading.value = true;
    resendSuccessMessage.value = '';
    loginError.value = ''; // Clear previous login errors

    try {
        await sendEmailVerification(userToVerify); // Use userToVerify here
        resendSuccessMessage.value = 'Письмо для подтверждения отправлено повторно! Проверьте свой Email.';
        startCoolDown(60); // Restart cooldown after successful send
    } catch (error) {
        console.error("Ошибка при повторной отправке письма:", error);
        if (error.code === 'auth/too-many-requests') {
          loginError.value = 'Слишком много запросов на отправку письма. Пожалуйста, подождите.';
          startCoolDown(60);
        } else {
          loginError.value = 'Не удалось отправить письмо повторно. Пожалуйста, попробуйте позже.';
        }
    } finally {
        isResendLoading.value = false;
    }
  }
  // No else block. If userToVerify is null, nothing happens.
};

onBeforeUnmount(() => {
  if (resendCooldownInterval) {
    clearInterval(resendCooldownInterval);
    resendCooldownInterval = null;
  }
});
</script>

<style scoped>
/* Your existing styles remain unchanged */
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
  font-size: 0.9rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  gap: 0.5rem;
  color: #666;
}

.checkbox {
  display: none;
}

.checkmark {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
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

.forgot-password-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.forgot-password-link:hover {
  color: #5a6fd8;
  text-decoration: underline;
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
  display: flex;
  align-items: center;
  justify-content: center;
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

.small-loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  flex-shrink: 0;
  flex-grow: 0;
  min-width: 16px;
  min-height: 16px;
  margin-right: 5px;
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

.login-footer .error-message.text-center {
  text-align: center;
  margin-top: 1rem;
  color: #f44336;
}

.info-message {
  color: #3f51b5;
  font-size: 0.95rem;
  margin-top: 1.5rem;
  font-weight: 500;
  line-height: 1.5;
  background-color: rgba(63, 81, 181, 0.1);
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(63, 81, 181, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  animation: fadeIn 0.4s ease-out;
}

.success-message {
  color: #4caf50;
  font-size: 0.95rem;
  margin-top: 1.5rem;
  font-weight: 500;
  line-height: 1.5;
  background-color: rgba(76, 175, 80, 0.1);
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid rgba(76, 175, 80, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  animation: fadeIn 0.4s ease-out;
}

.resend-email-button {
  background-color: #667eea;
  color: white;
  border: none;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.resend-email-button:hover {
  background-color: #5a6fd8;
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(102, 126, 234, 0.3);
}

.resend-email-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
  transform: none;
  box-shadow: none;
}

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
    align-items: flex-start;
    gap: 1rem;
  }

  .checkbox-wrapper {
    align-items: flex-start;
  }
  .info-message, .success-message {
    font-size: 0.9rem;
    padding: 0.8rem;
  }
  .resend-email-button {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
}
</style>
