<template>
    <div class="reset-password-container">
      <div class="reset-password-card">
        <h2 class="title">Сброс пароля</h2>
        <p class="subtitle">Введите ваш email, и мы отправим вам ссылку для сброса пароля.</p>
        
        <form @submit.prevent="handleResetPassword">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input 
              v-model="email" 
              type="email" 
              id="email" 
              class="form-input" 
              placeholder="Ваш email" 
              required
              :disabled="isLoading"
            />
          </div>
          
          <button 
            type="submit" 
            class="reset-button" 
            :disabled="isLoading || !email.trim()"
          >
            <span v-if="!isLoading">Отправить ссылку</span>
            <span v-else class="spinner"></span>
          </button>
        </form>
  
        <p v-if="message" :class="{ 'success-message': isSuccess, 'error-message': !isSuccess }">
          {{ message }}
        </p>
  
        <div class="back-to-login">
          <router-link to="/login">Вернуться ко входу</router-link>
        </div>
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
        isSuccess: false
      };
    },
    methods: {
      async handleResetPassword() {
        this.isLoading = true;
        this.message = '';
        this.isSuccess = false;
  
        try {
          await sendPasswordResetEmail(auth, this.email);
          this.message = 'Ссылка для сброса пароля отправлена на ваш email. Проверьте папку "Спам", если не видите письма.';
          this.isSuccess = true;
          this.email = ''; // Очищаем поле email
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
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); /* Тот же фон, что и на LoginView */
  }
  
  .reset-password-card {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    padding: 3rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 400px;
    text-align: center;
  }
  
  .title {
    color: #333;
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #666;
    margin-bottom: 2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
    text-align: left;
  }
  
  .form-label {
    display: block;
    color: #333;
    font-weight: 600;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  
  .form-input {
    width: 100%;
    padding: 1rem;
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
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block; /* Для выравнивания текста */
    vertical-align: middle;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .success-message {
    color: #4CAF50;
    margin-top: 1rem;
  }
  
  .error-message {
    color: #f44336;
    margin-top: 1rem;
  }
  
  .back-to-login {
    margin-top: 1.5rem;
  }
  
  .back-to-login a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;
  }
  
  .back-to-login a:hover {
    color: #5a6fd8;
  }
  </style>