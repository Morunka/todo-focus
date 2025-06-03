<template>
  <transition name="modal-fade">
    <div class="modal-overlay" v-if="isVisible" @click.self="cancel">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">{{ title }}</h3>
          <button class="close-button" @click="cancel" v-if="showCloseButton || cancelButtonText !== null">
            <span class="close-icon">✕</span>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-message" :class="{ 'has-input-error': inputErrorMessage }">{{ message }}</p>
          
          <div v-if="isLoading" class="modal-loading">
            <div class="modal-spinner"></div>
            <p class="loading-text">Удаление аккаунта...</p>
          </div>
          <div v-else>
            <slot name="content"></slot>
            <p v-if="inputErrorMessage" class="modal-error-message">{{ inputErrorMessage }}</p>
          </div>

        </div>
        <div class="modal-footer" :class="{ 'single-button-footer': confirmButtonText && cancelButtonText === null }">
          <button class="cancel-button" @click="cancel" v-if="cancelButtonText !== null" :disabled="isLoading">
            {{ cancelButtonText }}
          </button>
          <button class="confirm-button" @click="confirm" v-if="confirmButtonText !== null" :disabled="isLoading">
            {{ confirmButtonText }}
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: 'Подтверждение'
    },
    message: {
      type: String,
      default: 'Вы уверены, что хотите выполнить это действие?'
    },
    confirmButtonText: {
      type: String,
      default: 'Подтвердить'
    },
    cancelButtonText: {
      type: String,
      default: 'Отмена'
    },
    showCloseButton: {
      type: Boolean,
      default: true
    },
    // NEW PROP: To show an error related to an input within the modal body
    inputErrorMessage: {
      type: String,
      default: ''
    },
    // NEW PROP: To indicate if an action (like deletion) is in progress
    isLoading: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    confirm() {
      // Only emit if not loading
      if (!this.isLoading) {
        this.$emit('confirm');
      }
    },
    cancel() {
      // Only emit if not loading and cancel is allowed
      if (!this.isLoading && (this.cancelButtonText !== null || this.showCloseButton)) {
        this.$emit('cancel');
      }
    }
  }
};
</script>

<style scoped>
/* Modal Overlay with enhanced backdrop */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeInBackdrop 0.3s ease-out;
}

/* Enhanced Modal Dialog Box */
.modal-dialog {
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 50%, #f0f4ff 100%);
  border-radius: 20px;
  box-shadow:
    0 25px 50px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
  width: 90%;
  max-width: 480px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid rgba(102, 126, 234, 0.1);
}

/* Enhanced Modal Header */
.modal-header {
  padding: 2rem 2rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.modal-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  animation: shimmer 2s ease-in-out infinite;
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  letter-spacing: -0.025em;
}

.close-button {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

.close-button:active {
  transform: scale(0.95) rotate(90deg);
}

.close-icon {
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1;
}

/* Enhanced Modal Body */
.modal-body {
  padding: 2rem;
  color: #374151;
  font-size: 1.125rem;
  line-height: 1.7;
  text-align: center;
  flex-grow: 1;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(102, 126, 234, 0.02) 100%);
}

.modal-message {
  /* Reduced margin-bottom for tighter spacing with input error */
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #1f2937;
}

.modal-message.has-input-error {
  margin-bottom: 0.25rem; /* Even smaller margin if an input error is present */
}

/* NEW: Input error message style */
.modal-error-message {
  color: #dc3545; /* Red color for errors */
  font-size: 0.9rem;
  margin-top: 0.5rem;
  font-weight: 500;
}

/* NEW: Loading state within modal body */
.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
  min-height: 80px; /* Ensure space for spinner and text */
}

.modal-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(102, 126, 234, 0.3);
  border-top: 4px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 1.1rem;
  color: #555;
  font-weight: 600;
}

/* Enhanced Modal Footer */
.modal-footer {
  padding: 1.5rem 2rem 2rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid rgba(102, 126, 234, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

.modal-footer.single-button-footer {
  justify-content: center;
}

/* Enhanced Button Styles */
.cancel-button, .confirm-button {
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
  position: relative;
  overflow: hidden;
  min-width: 120px;
  text-transform: none;
  letter-spacing: 0.025em;
}

.cancel-button {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  color: #64748b;
  border: 1px solid #cbd5e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.cancel-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transition: left 0.5s ease;
}

.cancel-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e0 100%);
  color: #475569;
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.cancel-button:hover::before {
  left: 100%;
}

.cancel-button:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.cancel-button:disabled, .confirm-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}


.confirm-button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  position: relative;
}

.confirm-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s ease;
}

.confirm-button:hover:not(:disabled) {
  background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.5);
}

.confirm-button:hover::before {
  left: 100%;
}

.confirm-button:active {
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}


/* Enhanced Transitions */
.modal-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-dialog {
  transform: scale(0.8) translateY(-50px);
  opacity: 0;
}

.modal-fade-leave-to .modal-dialog {
  transform: scale(0.9) translateY(30px);
  opacity: 0;
}

/* Enhanced Animations */
@keyframes fadeInBackdrop {
  from {
    opacity: 0;
    backdrop-filter: blur(0px);
    -webkit-backdrop-filter: blur(0px);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
  }
}

@keyframes modalSlideIn {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-50px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02) translateY(-10px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

/* Standard spin animation for reusability */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Enhanced Responsive Design */
@media (max-width: 600px) {
  .modal-dialog {
    max-width: 95%;
    margin: 1rem;
    border-radius: 16px;
  }

  .modal-header {
    padding: 1.5rem 1.5rem 1rem;
  }

  .modal-title {
    font-size: 1.5rem;
  }

  .close-button {
    width: 32px;
    height: 32px;
  }

  .close-icon {
    font-size: 1rem;
  }

  .modal-body {
    padding: 1.5rem;
    font-size: 1rem;
  }

  .modal-footer {
    flex-direction: column;
    padding: 1rem 1.5rem 1.5rem;
    gap: 0.75rem;
  }

  .cancel-button, .confirm-button {
    width: 100%;
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }
}

@media (max-width: 400px) {
  .modal-dialog {
    margin: 0.5rem;
  }

  .modal-header {
    padding: 1.25rem 1.25rem 0.75rem;
  }

  .modal-title {
    font-size: 1.375rem;
  }

  .modal-body {
    padding: 1.25rem;
    font-size: 0.95rem;
  }

  .modal-footer {
    padding: 0.75rem 1.25rem 1.25rem;
  }
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  .modal-dialog {
    background: linear-gradient(135deg, #1f2937 0%, #111827 50%, #0f172a 100%);
    border: 1px solid rgba(102, 126, 234, 0.2);
  }

  .modal-body {
    color: #e5e7eb;
    background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(102, 126, 234, 0.05) 100%);
  }

  .modal-message {
    color: #f3f4f6;
  }

  .modal-footer {
    background: linear-gradient(180deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%);
    border-top: 1px solid rgba(102, 126, 234, 0.2);
  }

  .cancel-button {
    background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
    color: #d1d5db;
    border: 1px solid #4b5563;
  }

  .cancel-button:hover {
    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
    color: #f3f4f6;
  }
}
</style>