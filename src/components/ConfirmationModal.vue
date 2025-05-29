<template>
    <transition name="modal-fade">
      <div class="modal-overlay" v-if="isVisible" @click.self="cancel">
        <div class="modal-dialog">
          <div class="modal-header">
            <h3 class="modal-title">{{ title }}</h3>
            <button class="close-button" @click="cancel" v-if="showCloseButton || cancelButtonText !== null">
              <span class="material-icons">❌</span>
            </button>
          </div>
          <div class="modal-body">
            <p class="modal-message">{{ message }}</p>
          </div>
          <div class="modal-footer" :class="{ 'single-button-footer': confirmButtonText && cancelButtonText === null }">
            <button class="cancel-button" @click="cancel" v-if="cancelButtonText !== null">
              {{ cancelButtonText }}
            </button>
            <button class="confirm-button" @click="confirm" v-if="confirmButtonText !== null">
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
    // New prop: controls whether the 'X' close button in the header is shown
    showCloseButton: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    confirm() {
      this.$emit('confirm');
    },
    cancel() {
      // Emit 'cancel' only if the cancel button is meant to be visible or 'X' is active
      if (this.cancelButtonText !== null || this.showCloseButton) {
        this.$emit('cancel');
      }
    }
  }
};
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* Ensure it's above other content */
}

/* Modal Dialog Box */
.modal-dialog {
  background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 450px;
  animation: slide-in 0.3s ease-out;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* Ensures rounded corners */
}

/* Modal Header */
.modal-header {
  padding: 1.5rem 1.5rem 1rem;
  background: linear-gradient(45deg, #667eea, #764ba2);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.6rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.close-button {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.8rem;
  cursor: pointer;
  transition: color 0.2s ease, transform 0.2s ease;
  padding: 0.2rem;
  display: flex; /* For material-icons centering */
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  color: white;
  transform: rotate(90deg);
}

/* Modal Body */
.modal-body {
  padding: 1.5rem;
  color: #333;
  font-size: 1.1rem;
  line-height: 1.6;
  text-align: center;
  flex-grow: 1; /* Allow content to push footer down */
}

.modal-message {
  margin: 0;
  font-weight: 500;
}

/* Modal Footer */
.modal-footer {
  padding: 1rem 1.5rem 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  border-top: 1px solid #e0e0e0;
  background: #fdfdfd;
}

/* New style for single button footer */
.modal-footer.single-button-footer {
  justify-content: center; /* Center the single button */
}

.cancel-button, .confirm-button {
  padding: 0.8rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.cancel-button {
  background-color: #e0e0e0;
  color: #555;
  border: 1px solid #ccc;
}

.cancel-button:hover {
  background-color: #d0d0d0;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.confirm-button {
  background: linear-gradient(45deg, #42b983, #369870); /* Green for success/primary action */
  color: white;
  border: none;
}

.confirm-button:hover {
  background: linear-gradient(45deg, #369870, #42b983);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.3);
}

/* Transitions for Modal */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .modal-dialog, .modal-fade-leave-active .modal-dialog {
  transition: transform 0.3s ease-out;
}

.modal-fade-enter-from .modal-dialog {
  transform: translateY(-50px);
}

.modal-fade-leave-to .modal-dialog {
  transform: translateY(50px);
}

/* Animation for the modal dialog itself */
@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive adjustments */
@media (max-width: 600px) {
  .modal-dialog {
    max-width: 95%;
    margin: 1rem;
  }

  .modal-header {
    padding: 1rem;
  }

  .modal-title {
    font-size: 1.4rem;
  }

  .close-button {
    font-size: 1.5rem;
  }

  .modal-body {
    padding: 1rem;
    font-size: 1rem;
  }

  .modal-footer {
    flex-direction: column;
    padding: 1rem;
    gap: 0.8rem;
  }

  .cancel-button, .confirm-button {
    width: 100%;
    padding: 0.7rem 1rem;
    font-size: 0.95rem;
  }
}
</style>