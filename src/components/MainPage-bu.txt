<template>
    <div class="task-container">
      <div class="header">
        <h1 class="title">{{ msg }}</h1>
        <div class="stats">
          <div class="stat-item">
            <span class="stat-number">{{ completedTasks.length }}</span>
            <span class="stat-label">Выполнено</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">{{ pendingTasks.length }}</span>
            <span class="stat-label">Осталось</span>
          </div>
        </div>
      </div>
  
      <div class="input-section">
        <div class="input-group">
          <input
            v-model="newTask"
            placeholder="Новая задача"
            class="task-input"
            @keyup.enter="addTask"
            :class="{ 'shake': inputError }"
            :disabled="isAddingTask"
          />
          <select
            v-model="newTaskDifficulty"
            class="difficulty-select"
            :disabled="isAddingTask"
          >
            <option value="easy">Легко</option>
            <option value="normal">Нормально</option>
            <option value="hard">Сложно</option>
          </select>
          <button
            @click="addTask"
            class="add-button"
            :disabled="!newTask.trim() || isAddingTask"
          >
            <span v-if="!isAddingTask" class="button-content">
              <span class="button-text">Добавить</span>
              <span class="button-icon">+</span>
            </span>
            <span v-else class="loading-content">
              <span class="spinner"></span>
              <span class="button-text">Добавление...</span>
            </span>
          </button>
        </div>
      </div>
  
      <div class="filter-section">
        <div class="filter-buttons">
          <button
            @click="currentFilter = 'all'"
            :class="{ active: currentFilter === 'all' }"
            class="filter-btn"
          >
            Все ({{ tasks.length }})
          </button>
          <button
            @click="currentFilter = 'pending'"
            :class="{ active: currentFilter === 'pending' }"
            class="filter-btn"
          >
            Активные ({{ pendingTasks.length }})
          </button>
          <button
            @click="currentFilter = 'completed'"
            :class="{ active: currentFilter === 'completed' }"
            class="filter-btn"
          >
            Выполненные ({{ completedTasks.length }})
          </button>
        </div>
      </div>
  
      <div class="tasks-section">
        <transition-group name="task-list" tag="ul" class="task-list">
          <li
            v-for="task in filteredTasks"
            :key="task.id"
            class="task-item"
            :class="{
              'deleting': task.deleting,
              'completed': task.completed,
              'updating': task.updating
            }"
          >
            <div class="task-content">
              <div class="task-left">
                <button
                  @click="toggleTask(task.id)"
                  class="checkbox-button"
                  :disabled="task.updating"
                >
                  <span class="checkbox" :class="{ checked: task.completed }">
                    <span v-if="task.completed" class="checkmark">✓</span>
                  </span>
                </button>
                <div class="task-info">
                  <span class="task-text" :class="{ completed: task.completed }">
                    {{ task.text }}
                  </span>
                  <div class="task-meta">
                    <span class="difficulty-badge" :class="task.difficulty">
                      {{ getDifficultyLabel(task.difficulty) }}
                    </span>
                    <span class="task-date">
                      {{ formatDate(task.createdAt) }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="task-actions">
                <span v-if="task.updating" class="updating-spinner"></span>
                <button
                  @click="deleteTask(task.id)"
                  class="delete-button"
                  :disabled="task.deleting || task.updating"
                >
                  <span class="delete-icon">×</span>
                </button>
              </div>
            </div>
          </li>
        </transition-group>
  
        <div v-if="filteredTasks.length === 0" class="empty-state">
          <div class="empty-icon">
            {{ currentFilter === 'completed' ? '🎉' : currentFilter === 'pending' ? '📝' : '📋' }}
          </div>
          <p class="empty-text">
            {{ getEmptyStateText() }}
          </p>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { db, auth } from "../firebase"; // Импортируем auth
  import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from "firebase/firestore"; // Импортируем query, where
  import { onAuthStateChanged } from "firebase/auth"; // <-- Импортируем onAuthStateChanged
  
  export default {
    props: {
      msg: {
        type: String,
        default: "Менеджер задач"
      }
    },
    data() {
      return {
        newTask: "",
        newTaskDifficulty: "normal",
        tasks: [],
        inputError: false,
        isAddingTask: false,
        currentFilter: "all",
        user: null // Для хранения текущего пользователя
      };
    },
    computed: {
      completedTasks() {
        return this.tasks.filter(task => task.completed);
      },
      pendingTasks() {
        return this.tasks.filter(task => !task.completed);
      },
      filteredTasks() {
        switch (this.currentFilter) {
          case 'completed':
            return this.completedTasks;
          case 'pending':
            return this.pendingTasks;
          default:
            return this.tasks;
        }
      }
    },
    created() {
      // Подписываемся на изменение состояния аутентификации
      onAuthStateChanged(auth, (currentUser) => {
        this.user = currentUser;
        if (currentUser) {
          // Если пользователь залогинен, загружаем его задачи
          this.loadTasks(currentUser.uid); // Передаем UID пользователя
        } else {
          // Если пользователь вышел, очищаем список задач
          this.tasks = [];
        }
      });
    },
    methods: {
      async loadTasks(uid) {
        if (!uid) return; // Не загружаем задачи, если нет UID пользователя
  
        try {
          // Создаем запрос для получения задач только текущего пользователя
          const q = query(collection(db, "tasks"), where("userId", "==", uid));
          const querySnapshot = await getDocs(q);
  
          this.tasks = querySnapshot.docs.map(doc => ({
            id: doc.id,
            deleting: false,
            updating: false,
            // Убедитесь, что эти поля всегда присутствуют, даже если их нет в Firestore
            completed: doc.data().completed ?? false,
            difficulty: doc.data().difficulty ?? "normal",
            createdAt: doc.data().createdAt, // Firebase Timestamp
            ...doc.data()
          }));
        } catch (e) {
          console.error("Ошибка загрузки задач:", e);
        }
      },
      async addTask() {
        if (!this.newTask.trim()) {
          this.inputError = true;
          setTimeout(() => {
            this.inputError = false;
          }, 500);
          return;
        }
        if (!this.user) {
          console.error("Пользователь не авторизован для добавления задачи.");
          // Можно показать сообщение пользователю
          return;
        }
  
        this.isAddingTask = true;
  
        try {
          // Simulate network delay for demo purposes
          await new Promise(resolve => setTimeout(resolve, 500)); // Уменьшил задержку
  
          const newTaskData = {
            text: this.newTask.trim(),
            completed: false,
            difficulty: this.newTaskDifficulty,
            createdAt: new Date(), // Сохраняем как JS Date, Firebase преобразует в Timestamp
            userId: this.user.uid // <-- Добавляем ID пользователя к задаче
          };
  
          const docRef = await addDoc(collection(db, "tasks"), newTaskData);
  
          this.tasks.push({
            id: docRef.id,
            deleting: false,
            updating: false,
            ...newTaskData
          });
  
          this.newTask = "";
          this.newTaskDifficulty = "normal";
        } catch (e) {
          console.error("Ошибка добавления задачи:", e);
        } finally {
          this.isAddingTask = false;
        }
      },
      async toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task || !this.user) return; // Проверка на пользователя
  
        task.updating = true;
  
        try {
          // Simulate network delay
          await new Promise(resolve => setTimeout(resolve, 300)); // Уменьшил задержку
  
          const newCompletedStatus = !task.completed;
          await updateDoc(doc(db, "tasks", id), {
            completed: newCompletedStatus
          });
  
          task.completed = newCompletedStatus;
        } catch (e) {
          console.error("Ошибка обновления задачи:", e);
        } finally {
          task.updating = false;
        }
      },
      async deleteTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task || !this.user) return; // Проверка на пользователя
  
        if (task) {
          task.deleting = true;
        }
  
        try {
          await deleteDoc(doc(db, "tasks", id));
          setTimeout(() => {
            this.tasks = this.tasks.filter(t => t.id !== id);
          }, 300);
        } catch (e) {
          console.error("Ошибка удаления задачи:", e);
          if (task) {
            task.deleting = false;
          }
        }
      },
      getDifficultyLabel(difficulty) {
        const labels = {
          easy: "Легко",
          normal: "Нормально",
          hard: "Сложно"
        };
        return labels[difficulty] || labels.normal;
      },
      formatDate(timestamp) {
        if (!timestamp) return "";
        let date;
        // Firebase Timestamp имеет метод .toDate()
        if (timestamp.toDate && typeof timestamp.toDate === 'function') {
          date = timestamp.toDate();
        } else if (timestamp instanceof Date) {
          date = timestamp;
        } else {
          // Попытка преобразовать в Date, если это строка или число
          date = new Date(timestamp);
        }
  
        // Проверяем, что дата валидна
        if (isNaN(date.getTime())) {
          return "Неверная дата";
        }
  
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });
      },
      getEmptyStateText() {
        switch (this.currentFilter) {
          case 'completed':
            return 'Нет выполненных задач';
          case 'pending':
            return 'Нет активных задач. Отличная работа!';
          default:
            return 'Пока нет задач. Добавьте первую!';
        }
      }
    }
  };
  </script>
  
  <style scoped>
  /* Ваши стили из предыдущего ответа, без изменений */
  .task-container {
    max-width: 700px;
    margin: 0 auto;
    padding: 2rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: calc(100vh - 70px); /* Учитываем высоту навигационной панели */
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    box-sizing: border-box; /* Чтобы padding не увеличивал ширину */
  }
  
  .header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .title {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 1rem 0;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    animation: fadeInDown 0.8s ease-out;
  }
  
  .stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 1rem;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: white;
    background: rgba(255, 255, 255, 0.1);
    padding: 1rem;
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }
  
  .stat-number {
    font-size: 1.8rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  
  .stat-label {
    font-size: 0.9rem;
    opacity: 0.8;
  }
  
  .input-section {
    margin-bottom: 1.5rem;
    animation: fadeInUp 0.8s ease-out 0.2s both;
  }
  
  .input-group {
    display: flex;
    gap: 0.5rem;
    background: white;
    padding: 0.5rem;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .input-group:focus-within {
    transform: translateY(-2px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  }
  
  .task-input {
    flex: 1;
    border: none;
    outline: none;
    font-size: 1.1rem;
    padding: 1rem;
    border-radius: 8px;
    background: transparent;
    transition: all 0.3s ease;
  }
  
  .difficulty-select {
    border: none;
    outline: none;
    font-size: 1rem;
    padding: 1rem;
    border-radius: 8px;
    background: #f8f9fa;
    cursor: pointer;
    min-width: 120px;
  }
  
  .difficulty-select:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .task-input::placeholder {
    color: #999;
  }
  
  .task-input.shake {
    animation: shake 0.5s ease-in-out;
  }
  
  .add-button {
    background: linear-gradient(45deg, #4CAF50, #45a049);
    color: white;
    border: none;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    min-width: 140px;
  }
  
  .button-content,
  .loading-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    justify-content: center;
  }
  
  .add-button:hover:not(:disabled) {
    background: linear-gradient(45deg, #45a049, #4CAF50);
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
  }
  
  .add-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .updating-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(102, 126, 234, 0.3);
    border-top: 2px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .filter-section {
    margin-bottom: 1.5rem;
    animation: fadeInUp 0.8s ease-out 0.3s both;
  }
  
  .filter-buttons {
    display: flex;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.1);
    padding: 0.5rem;
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }
  
  .filter-btn {
    flex: 1;
    background: transparent;
    color: white;
    border: none;
    padding: 0.8rem 1rem;
    border-radius: 8px;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.3s ease;
    opacity: 0.7;
  }
  
  .filter-btn.active {
    background: white;
    color: #667eea;
    opacity: 1;
    font-weight: 600;
  }
  
  .filter-btn:hover:not(.active) {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }
  
  .tasks-section {
    animation: fadeInUp 0.8s ease-out 0.4s both;
  }
  
  .task-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .task-item {
    background: white;
    margin-bottom: 1rem;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    overflow: hidden;
  }
  
  .task-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .task-item.deleting {
    opacity: 0.6;
    transform: scale(0.95);
  }
  
  .task-item.completed {
    opacity: 0.8;
  }
  
  .task-item.updating {
    opacity: 0.7;
  }
  
  .task-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.2rem;
  }
  
  .task-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
  }
  
  .checkbox-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  
  .checkbox {
    width: 24px;
    height: 24px;
    border: 2px solid #ddd;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  
  .checkbox.checked {
    background: #4CAF50;
    border-color: #4CAF50;
  }
  
  .checkmark {
    color: white;
    font-weight: bold;
    font-size: 14px;
  }
  
  .task-info {
    flex: 1;
  }
  
  .task-text {
    font-size: 1.1rem;
    color: #333;
    display: block;
    margin-bottom: 0.5rem;
    transition: all 0.3s ease;
  }
  
  .task-text.completed {
    text-decoration: line-through;
    color: #999;
  }
  
  .task-meta {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .difficulty-badge {
    padding: 0.2rem 0.6rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .difficulty-badge.easy {
    background: #d4edda;
    color: #155724;
  }
  
  .difficulty-badge.normal {
    background: #fff3cd;
    color: #856404;
  }
  
  .difficulty-badge.hard {
    background: #f8d7da;
    color: #721c24;
  }
  
  .task-date {
    font-size: 0.8rem;
    color: #999;
  }
  
  .task-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .delete-button {
    background: linear-gradient(45deg, #f44336, #d32f2f);
    color: white;
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 1.5rem;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }
  
  .delete-button:hover:not(:disabled) {
    background: linear-gradient(45deg, #d32f2f, #f44336);
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(244, 67, 54, 0.3);
  }
  
  .delete-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .delete-icon {
    line-height: 1;
  }
  
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: white;
    opacity: 0.8;
  }
  
  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    animation: bounce 2s infinite;
  }
  
  .empty-text {
    font-size: 1.2rem;
    margin: 0;
  }
  
  /* Animations */
  @keyframes fadeInDown {
    from {
      opacity: 0;
      transform: translate3d(0, -100%, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate3d(0, 100%, 0);
    }
    to {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
      transform: translate3d(0,0,0);
    }
    40%, 43% {
      animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
      transform: translate3d(0, -30px, 0);
    }
    70% {
      animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
      transform: translate3d(0, -15px, 0);
    }
    90% { transform: translate3d(0,-4px,0); }
  }
  
  /* Transition group animations */
  .task-list-enter-active {
    transition: all 0.5s ease;
  }
  
  .task-list-leave-active {
    transition: all 0.3s ease;
  }
  
  .task-list-enter-from {
    opacity: 0;
    transform: translateX(-30px) scale(0.9);
  }
  
  .task-list-leave-to {
    opacity: 0;
    transform: translateX(30px) scale(0.9);
  }
  
  .task-list-move {
    transition: transform 0.3s ease;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .task-container {
      padding: 1rem;
    }
  
    .title {
      font-size: 2rem;
    }
  
    .stats {
      gap: 1rem;
    }
  
    .stat-item {
      padding: 0.8rem;
    }
  
    .stat-number {
      font-size: 1.5rem;
    }
  
    .input-group {
      flex-direction: column;
      gap: 0.5rem;
    }
  
    .add-button {
      width: 100%;
      justify-content: center;
    }
  
    .filter-buttons {
      flex-direction: column;
      gap: 0.5rem;
    }
  
    .task-content {
      padding: 1rem;
    }
  
    .task-text {
      font-size: 1rem;
    }
  
    .task-meta {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }
  </style>