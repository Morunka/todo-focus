<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="register-icon">📝</div>
        <h1 class="register-title">Регистрация</h1>
        <p class="register-subtitle">Создайте новую учетную запись</p>
      </div>

      <form @submit.prevent="handleRegister" class="register-form">
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
          <div class="password-strength">
            <div class="strength-bar">
              <div class="strength-fill" :class="passwordStrengthClass"></div>
            </div>
            <span class="strength-text">{{ passwordStrengthText }}</span>
          </div>
          <transition name="error">
            <p v-if="errors.password" class="error-message">{{ errors.password }}</p>
          </transition>
        </div>

        <div class="form-group">
          <label class="form-label">Подтвердите пароль</label>
          <div class="input-wrapper">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="form-input"
              :class="{ 'error': errors.confirmPassword, 'success': validFields.confirmPassword }"
              placeholder="Повторите пароль"
              @blur="validateConfirmPassword"
              @input="clearError('confirmPassword')"
              required
            />
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? '🙈' : '👁️' }}
            </button>
          </div>
          <transition name="error">
            <p v-if="errors.confirmPassword" class="error-message">{{ errors.confirmPassword }}</p>
          </transition>
        </div>

        <div class="form-options">
          <label class="checkbox-wrapper">
            <input type="checkbox" v-model="agreeToTerms" class="checkbox">
            <span class="checkmark"></span>
            <span class="checkbox-text">
              Я согласен с <a href="#" class="terms-link">условиями использования</a> и
              <a href="#" class="terms-link">политикой конфиденциальности</a>
            </span>
          </label>
        </div>

        <button
          type="submit"
          class="register-button"
          :class="{ 'loading': isLoading }"
          :disabled="isLoading || !isFormValid"
        >
          <span v-if="!isLoading" class="button-content">
            <span class="button-text">Зарегистрироваться</span>
            <span class="button-icon">✨</span>
          </span>
          <span v-else class="loading-spinner"></span>
        </button>
      </form>

      <div class="register-footer">
        <p class="footer-text">
          Уже есть аккаунт?
          <router-link to="/login" class="login-link">Войти</router-link>
        </p>
      </div>
    </div>

    <div class="bg-decoration">
      <div class="floating-shape shape-1"></div>
      <div class="floating-shape shape-2"></div>
      <div class="floating-shape shape-3"></div>
    </div>

    <ConfirmationModal
      :isVisible="showSuccessModal"
      title="Регистрация успешна!"
      message="Ваш аккаунт был успешно создан. Пожалуйста, проверьте свой Email (и папку 'Спам'!) для подтверждения. Нажмите 'Далее', чтобы перейти к входу."
      confirmButtonText="Далее"
      :cancelButtonText="null"
      :showCloseButton="false"
      @confirm="handleSuccessConfirm"
      @cancel="handleSuccessCancel"
    />

    <ConfirmationModal
      :isVisible="showErrorModal"
      title="Ошибка регистрации"
      :message="registerErrorMessage"
      confirmButtonText="ОК"
      :cancelButtonText="null"
      :showCloseButton="true"
      @confirm="closeErrorModal"
      @cancel="closeErrorModal"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, defineEmits } from 'vue'; // Added reactive and defineEmits
import { useRouter } from 'vue-router';
import {
  auth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  updateProfile // Added updateProfile
} from '../firebase'; // Removed `functions` and `httpsCallable`
import ConfirmationModal from '../components/ConfirmationModal.vue';

const router = useRouter();
const emit = defineEmits(['show-notification']); // For global notifications

// Reactive state
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const agreeToTerms = ref(false);
const isLoading = ref(false);

// Use reactive for errors and validFields for better consistency
const errors = reactive({
  email: '',
  password: '',
  confirmPassword: ''
});
const validFields = reactive({
  email: false,
  password: false,
  confirmPassword: false
});

// Modal specific state
const showSuccessModal = ref(false);
// const successModalMessage = ref(''); // No longer directly used as message is hardcoded
const showErrorModal = ref(false);
const registerErrorMessage = ref('');

// Computed properties
const isFormValid = computed(() => {
  return validFields.email &&
         validFields.password &&
         validFields.confirmPassword &&
         agreeToTerms.value; // Ensure all fields are valid AND terms agreed
});

const passwordStrength = computed(() => {
  const pwd = password.value;
  let strength = 0;

  if (pwd.length >= 8) strength++;
  if (/[a-z]/.test(pwd)) strength++;
  if (/[A-Z]/.test(pwd)) strength++;
  if (/[0-9]/.test(pwd)) strength++;
  if (/[^A-Za-z0-9]/.test(pwd)) strength++;

  return strength;
});
const passwordStrengthClass = computed(() => {
  if (password.value === '') return ''; // No class if password is empty
  if (passwordStrength.value <= 2) return 'weak';
  if (passwordStrength.value <= 3) return 'medium';
  return 'strong';
});
const passwordStrengthText = computed(() => {
  if (password.value === '') return '';
  if (passwordStrength.value <= 2) return 'Слабый пароль';
  if (passwordStrength.value <= 3) return 'Средний пароль';
  return 'Сильный пароль';
});

// Methods
const validateEmail = () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.value.trim()) { // Use .trim()
    errors.email = 'Email обязателен';
    validFields.email = false;
  } else if (!emailRegex.test(email.value)) {
    errors.email = 'Неверный формат email';
    validFields.email = false;
  } else {
    errors.email = '';
    validFields.email = true;
  }
};
const validatePassword = () => {
  if (!password.value) { // Don't trim password
    errors.password = 'Пароль обязателен';
    validFields.password = false;
  } else if (password.value.length < 6) {
    errors.password = 'Пароль должен быть не менее 6 символов';
    validFields.password = false;
  } else {
    errors.password = '';
    validFields.password = true;
  }

  // Re-validate confirm password if password changes
  if (confirmPassword.value) {
    validateConfirmPassword();
  }
};
const validateConfirmPassword = () => {
  if (!confirmPassword.value) {
    errors.confirmPassword = 'Подтверждение пароля обязательно';
    validFields.confirmPassword = false;
  } else if (password.value !== confirmPassword.value) {
    errors.confirmPassword = 'Пароли не совпадают';
    validFields.confirmPassword = false;
  } else {
    errors.confirmPassword = '';
    validFields.confirmPassword = true;
  }
};

const clearError = (field) => {
  errors[field] = '';
  // No need to set validFields to false here, validation logic will handle it on blur/submit
};

// Modals control methods (for success/error popups)
const handleSuccessConfirm = () => {
  showSuccessModal.value = false;
  router.push('/login'); // Redirect to login after successful registration
};
const handleSuccessCancel = () => {
  showSuccessModal.value = false; // Allows user to close without redirect if desired
};

const openErrorModal = (message) => {
  registerErrorMessage.value = message;
  showErrorModal.value = true;
};
const closeErrorModal = () => {
  showErrorModal.value = false;
  registerErrorMessage.value = '';
};

const handleRegister = async () => {
  // Clear any previous error messages
  registerErrorMessage.value = '';
  errors.email = '';
  errors.password = '';
  errors.confirmPassword = '';

  // Client-side validation before attempting Firebase registration
  validateEmail();
  validatePassword();
  validateConfirmPassword();

  if (!agreeToTerms.value) {
    openErrorModal('Вы должны согласиться с условиями использования и политикой конфиденциальности.');
    return;
  }

  // Check if any errors exist in the reactive `errors` object
  const hasFormErrors = Object.values(errors).some(error => error !== '');
  if (hasFormErrors || !isFormValid.value) {
    emit('show-notification', 'Пожалуйста, исправьте ошибки в форме.', 'error', 3000);
    return; // Stop if there are validation errors
  }

  isLoading.value = true; // Set loading state to true
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email.value, password.value);
    const user = userCredential.user;

    // IMPORTANT: Null check the user object
    if (!user) {
      throw new Error("User object is undefined after successful registration (unexpected).");
    }

    // Update user profile (e.g., set display name) - Optional but good practice
    await updateProfile(user, {
      displayName: email.value.split('@')[0] // Sets display name to the part before @ in email
    });
    console.log("User profile updated.");

    // Send email verification
    await sendEmailVerification(user);
    console.log("Email verification sent to:", user.email);

    // Sign out the user immediately after registration and email sent
    await signOut(auth);
    console.log("User signed out.");

    // Clear form fields
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
    agreeToTerms.value = false;
    // Reset validation states
    validFields.email = false;
    validFields.password = false;
    validFields.confirmPassword = false;

    // Show success modal
    showSuccessModal.value = true; // Use the existing modal
    // No dynamic message needed, it's hardcoded in the modal template

  } catch (error) {
    console.error('Registration error:', error.code, error.message);
    let message = '';
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Этот Email уже зарегистрирован. Пожалуйста, войдите или используйте другой Email.';
        errors.email = message; // Display specific error below input
        break;
      case 'auth/invalid-email':
        message = 'Неверный формат Email. Проверьте правильность ввода.';
        errors.email = message;
        break;
      case 'auth/weak-password':
        message = 'Пароль слишком слабый. Используйте не менее 6 символов, включая буквы, цифры и спецсимволы.';
        errors.password = message;
        break;
      case 'auth/network-request-failed':
        message = 'Ошибка сети. Проверьте ваше интернет-соединение.';
        break;
      case 'auth/operation-not-allowed':
        message = 'Регистрация по Email/паролю отключена. Свяжитесь с администратором.';
        break;
      default:
        // Generic error, use error.message directly
        message = `Произошла ошибка при регистрации: ${error.message}. Пожалуйста, попробуйте снова.`;
        break;
    }
    // Show error modal (or global notification)
    openErrorModal(message); // Using existing error modal
    // Alternatively, if App.vue has a global notification system:
    // emit('show-notification', message, 'error', 5000);
  } finally {
    isLoading.value = false; // Always reset loading state
  }
};
</script>

<style scoped>
/* All your existing styles here. No changes needed to the CSS unless specified below. */
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.register-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  position: relative;
  z-index: 2;
  animation: slideInUp 0.8s ease-out;
}

.register-header {
  text-align: center;
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease-out 0.2s both;
}

.register-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  animation: bounce 2s infinite;
}

.register-title {
  color: #333;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.register-subtitle {
  color: #666;
  font-size: 1rem;
  margin: 0;
}

.register-form {
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
  pointer-events: none; /* Make sure icons don't block input clicks unless they are buttons */
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
  pointer-events: all; /* Make password toggle clickable */
}

.password-toggle:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.password-strength {
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.strength-bar {
  flex: 1;
  height: 4px;
  background-color: #e1e5e9;
  border-radius: 2px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
  border-radius: 2px;
}

.strength-fill.weak {
  width: 33%;
  background-color: #f44336;
}

.strength-fill.medium {
  width: 66%;
  background-color: #ff9800;
}

.strength-fill.strong {
  width: 100%;
  background-color: #4caf50;
}

.strength-text {
  font-size: 0.8rem;
  font-weight: 500;
  min-width: 100px;
}

.error-message {
  color: #f44336;
  font-size: 0.85rem;
  margin: 0.5rem 0 0 0;
  font-weight: 500;
}

.form-options {
  margin-bottom: 2rem;
}

.checkbox-wrapper {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  user-select: none;
  gap: 0.5rem;
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
  margin-top: 2px;
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
  line-height: 1.4;
}

.terms-link {
  color: #667eea;
  text-decoration: none;
  transition: color 0.3s ease;
}

.terms-link:hover {
  color: #5a6fd8;
  text-decoration: underline;
}

.register-button {
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

.register-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
}

.register-button:disabled {
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

.register-button:hover .button-icon {
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

.register-footer {
  text-align: center;
  margin-top: 2rem;
  animation: fadeInUp 0.8s ease-out 0.6s both;
}

.footer-text {
  color: #666;
  margin: 0;
}

.login-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.login-link:hover {
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
  100% { transform: rotate(360deg);
  }
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

.register-footer .error-message.text-center {
  text-align: center;
  margin-top: 1rem;
  color: #f44336;
}

/* Стили для сообщения об успехе и кнопки повторной отправки (these are no longer used for direct display) */
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

/* Responsive design */
@media (max-width: 768px) {
  .register-container {
    padding: 1rem;
  }

  .register-card {
    padding: 2rem;
  }

  .register-title {
    font-size: 1.5rem;
  }

  .checkbox-wrapper {
    align-items: flex-start;
  }
  .success-message {
    font-size: 0.9rem;
    padding: 0.8rem;
  }
  .resend-email-button {
    font-size: 0.85rem;
    padding: 0.6rem 1rem;
  }
}
</style>