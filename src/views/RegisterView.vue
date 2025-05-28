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
            <label class="form-label">Имя</label>
            <div class="input-wrapper">
              <input 
                v-model="name" 
                type="text" 
                class="form-input"
                :class="{ 'error': errors.name, 'success': validFields.name }"
                placeholder="Введите ваше имя"
                @blur="validateName"
                @input="clearError('name')"
                required
              />
              <span class="input-icon">👤</span>
            </div>
            <transition name="error">
              <p v-if="errors.name" class="error-message">{{ errors.name }}</p>
            </transition>
          </div>
  
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
          <p v-if="registerError" class="error-message text-center">{{ registerError }}</p>
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
  import { auth, createUserWithEmailAndPassword, updateProfile } from "../firebase";
  
  export default {
    name: 'RegisterView',
    data() {
      return {
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        showPassword: false,
        showConfirmPassword: false,
        agreeToTerms: false,
        isLoading: false,
        errors: {},
        validFields: {},
        registerError: ''
      };
    },
    computed: {
      isFormValid() {
        return this.name.trim() !== '' && 
               this.email.trim() !== '' && 
               this.password.trim() !== '' &&
               this.confirmPassword.trim() !== '' &&
               this.agreeToTerms &&
               !this.errors.name &&
               !this.errors.email && 
               !this.errors.password &&
               !this.errors.confirmPassword;
      },
      passwordStrength() {
        const password = this.password;
        let strength = 0;
        
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password)) strength++;
        if (/[A-Z]/.test(password)) strength++;
        if (/[0-9]/.test(password)) strength++;
        if (/[^A-Za-z0-9]/.test(password)) strength++;
        
        return strength;
      },
      passwordStrengthClass() {
        if (this.passwordStrength <= 2) return 'weak';
        if (this.passwordStrength <= 3) return 'medium';
        return 'strong';
      },
      passwordStrengthText() {
        if (this.password === '') return '';
        if (this.passwordStrength <= 2) return 'Слабый пароль';
        if (this.passwordStrength <= 3) return 'Средний пароль';
        return 'Сильный пароль';
      }
    },
    methods: {
      validateName() {
        if (!this.name.trim()) {
          this.errors.name = 'Имя обязательно';
          this.validFields.name = false;
        } else if (this.name.trim().length < 2) {
          this.errors.name = 'Имя должно содержать минимум 2 символа';
          this.validFields.name = false;
        } else {
          if (this.errors.name) {
            delete this.errors.name;
          }
          this.validFields.name = true;
        }
      },
      validateEmail() {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!this.email) {
          this.errors.email = 'Email обязателен';
          this.validFields.email = false;
        } else if (!emailRegex.test(this.email)) {
          this.errors.email = 'Неверный формат email';
          this.validFields.email = false;
        } else {
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
          if (this.errors.password) {
            delete this.errors.password;
          }
          this.validFields.password = true;
        }
        
        // Revalidate confirm password if it exists
        if (this.confirmPassword) {
          this.validateConfirmPassword();
        }
      },
      validateConfirmPassword() {
        if (!this.confirmPassword) {
          this.errors.confirmPassword = 'Подтверждение пароля обязательно';
          this.validFields.confirmPassword = false;
        } else if (this.password !== this.confirmPassword) {
          this.errors.confirmPassword = 'Пароли не совпадают';
          this.validFields.confirmPassword = false;
        } else {
          if (this.errors.confirmPassword) {
            delete this.errors.confirmPassword;
          }
          this.validFields.confirmPassword = true;
        }
      },
      clearError(field) {
        if (this.errors[field]) {
          delete this.errors[field];
        }
        this.registerError = '';
      },
      async handleRegister() {
        this.validateName();
        this.validateEmail();
        this.validatePassword();
        this.validateConfirmPassword();
        this.registerError = '';
  
        if (!this.isFormValid) {
          return;
        }
        
        this.isLoading = true;
        
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, this.email, this.password);
          
          // Update user profile with name
          await updateProfile(userCredential.user, {
            displayName: this.name
          });
          
          // Registration successful, redirect to main page
          this.$router.push('/');
          
        } catch (error) {
          console.error('Registration error:', error.code, error.message);
          switch (error.code) {
            case 'auth/email-already-in-use':
              this.registerError = 'Этот email уже используется.';
              break;
            case 'auth/invalid-email':
              this.registerError = 'Неверный формат email.';
              break;
            case 'auth/weak-password':
              this.registerError = 'Пароль слишком слабый.';
              break;
            default:
              this.registerError = 'Ошибка регистрации. Попробуйте снова.';
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
  
  .register-footer .error-message.text-center {
    text-align: center;
    margin-top: 1rem;
    color: #f44336;
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
  }
  </style>