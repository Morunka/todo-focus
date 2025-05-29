<template>
  <footer class="app-footer">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-section">
          <p class="footer-text primary">
            Работает на 
            <a 
              href="https://firebase.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              class="footer-link firebase"
            >
              <span class="link-icon">🔥</span>
              Firebase
            </a>, размещено на 
            <a 
              href="https://github.com/Morunka/todo-focus" 
              target="_blank" 
              rel="noopener noreferrer"
              class="footer-link github"
            >
              <span class="link-icon">📂</span>
              Github pages
            </a>
          </p>
          <p class="footer-text secondary">
            Приложение создано с помощью 
            <a 
              href="https://vuejs.org" 
              target="_blank" 
              rel="noopener noreferrer"
              class="footer-link vue"
            >
              <span class="link-icon">⚡</span>
              Vue.js
            </a>
            от 
            <a 
              href="https://t.me/MEOW_MUR920" 
              target="_blank" 
              rel="noopener noreferrer"
              class="footer-link author"
            >
              <span class="link-icon">👨‍💻</span>
              Morunka
            </a>
          </p>
        </div>
        
        <div class="footer-stats">
          <div class="stat-badge">
            <span class="stat-icon">📱</span>
            <span class="stat-text">Адаптивный</span>
          </div>
          <div class="stat-badge">
            <span class="stat-icon">⚡</span>
            <span class="stat-text">Быстрый</span>
          </div>
          <div class="stat-badge">
            <span class="stat-icon">🔒</span>
            <span class="stat-text">Защищенный</span>
          </div>
        </div>
      </div>
      
      <div class="footer-divider"></div>
      
      <div class="footer-bottom">
        <p class="copyright">
          © {{ currentYear }} ToDo список «Фокус».
        </p>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'FooterElement',
  computed: {
    currentYear() {
      return new Date().getFullYear();
    }
  }
}
</script>

<style scoped>
.app-footer {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin-top: auto;
  position: relative;
  overflow: hidden;
}

.app-footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  pointer-events: none;
}

.footer-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
  position: relative;
  z-index: 1;
}

.footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.footer-section {
  text-align: center;
}

.footer-text {
  margin: 0.5rem 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.6;
}

.footer-text.primary {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
}

.footer-text.secondary {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.85);
  font-weight: 400;
}

.footer-link {
  color: inherit;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.2rem 0.4rem;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
  font-weight: 600;
}

.footer-link:hover {
  transform: translateY(-2px);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.footer-link.firebase {
  color: #ff9800;
}

.footer-link.firebase:hover {
  background: rgba(255, 152, 0, 0.15);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.footer-link.github {
  color: #e91e63;
}

.footer-link.github:hover {
  background: rgba(233, 30, 99, 0.15);
  box-shadow: 0 4px 12px rgba(233, 30, 99, 0.3);
}

.footer-link.vue {
  color: #4caf50;
}

.footer-link.vue:hover {
  background: rgba(76, 175, 80, 0.15);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.footer-link.author {
  color: #ffc107;
}

.footer-link.author:hover {
  background: rgba(255, 193, 7, 0.15);
  box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
}

.link-icon {
  font-size: 0.9rem;
  animation: pulse 2s infinite;
}

.footer-stats {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.stat-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.6rem 1rem;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 500;
}

.stat-badge:hover {
  transform: translateY(-3px);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.stat-icon {
  font-size: 1rem;
}

.stat-text {
  font-size: 0.8rem;
  letter-spacing: 0.5px;
}

.footer-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(
    to right,
    transparent,
    rgba(255, 255, 255, 0.3) 20%,
    rgba(255, 255, 255, 0.6) 50%,
    rgba(255, 255, 255, 0.3) 80%,
    transparent
  );
  margin: 1.5rem 0;
}

.footer-bottom {
  text-align: center;
}

.copyright {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 400;
  letter-spacing: 0.5px;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .footer-container {
    padding: 1.5rem 1rem;
  }
  
  .footer-content {
    gap: 1rem;
  }
  
  .footer-text.primary,
  .footer-text.secondary {
    font-size: 0.85rem;
  }
  
  .footer-stats {
    gap: 0.5rem;
  }
  
  .stat-badge {
    padding: 0.5rem 0.8rem;
    font-size: 0.8rem;
  }
  
  .footer-link {
    padding: 0.3rem 0.5rem;
  }
}

@media (max-width: 480px) {
  .footer-section {
    padding: 0 0.5rem;
  }
  
  .footer-text.primary,
  .footer-text.secondary {
    font-size: 0.8rem;
    line-height: 1.5;
  }
  
  .footer-stats {
    flex-direction: column;
    align-items: center;
  }
  
  .stat-badge {
    width: 100%;
    max-width: 200px;
    justify-content: center;
  }
}
</style>