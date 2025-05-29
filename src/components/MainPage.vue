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

    <div class="sync-section">
      <div class="sync-controls">
        <button
          @click="refreshTasks"
          class="refresh-button"
          :disabled="isRefreshing"
          :class="{ 'refreshing': isRefreshing }"
        >
          <span class="refresh-icon" :class="{ 'spinning': isRefreshing }">🔄</span>
          <span class="button-text">
            {{ isRefreshing ? 'Обновление...' : 'Обновить' }}
          </span>
        </button>

        <div class="auto-sync-toggle">
          <button
            @click="toggleAutoSync"
            class="sync-toggle-button"
            :class="{ 'active': autoSyncEnabled }"
          >
            <span class="sync-icon">{{ autoSyncEnabled ? '🔒' : '🔓' }}</span>
            <span class="button-text">
              {{ autoSyncEnabled ? 'Авто-синх ВКЛ' : 'Авто-синх ВЫКЛ' }}
            </span>
          </button>
          <div v-if="autoSyncEnabled" class="sync-status">
            <span class="sync-indicator" :class="{ 'active': syncIndicator }"></span>
            <span class="next-sync-text">
              Следующее обновление: {{ nextSyncCountdown }}с
            </span>
          </div>
        </div>
      </div>

      <div class="last-updated" v-if="lastUpdated">
        <span class="update-text">
          Последнее обновление: {{ formatLastUpdated() }}
        </span>
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

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { db, auth } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  orderBy,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

// --- Props ---
const props = defineProps({
  msg: {
    type: String,
    default: "Менеджер задач"
  }
});

// --- Reactive State ---
const newTask = ref('');
const newTaskDifficulty = ref('normal');
const tasks = ref([]);
const inputError = ref(false);
const isAddingTask = ref(false);
const currentFilter = ref('all');
const user = ref(null); // This will hold the Firebase user object

// Sync and Refresh state
const isRefreshing = ref(false);
const autoSyncEnabled = ref(true); // Default to true, will be overwritten by preference
const syncIndicator = ref(false);
const lastUpdated = ref(null);
const nextSyncCountdown = ref(0);
const currentTime = ref(Date.now()); // New reactive variable for current time

// Intervals for polling and countdown
let autoSyncIntervalId = null;
let countdownIntervalId = null;
let updateCurrentTimeIntervalId = null; // New interval for current time

const SYNC_INTERVAL = 10000; // 10 seconds for polling

// --- Computed Properties ---
const completedTasks = computed(() => {
  return tasks.value.filter(task => task.completed);
});

const pendingTasks = computed(() => {
  return tasks.value.filter(task => !task.completed);
});

const filteredTasks = computed(() => {
  switch (currentFilter.value) {
    case 'completed':
      return completedTasks.value;
    case 'pending':
      return pendingTasks.value;
    default:
      // Sort tasks by creation date (newest first) for consistency
      return [...tasks.value].sort((a, b) => {
        // Ensure both a.createdAt and b.createdAt are valid Date objects or Firebase Timestamps
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });
  }
});

// --- Methods ---

/**
 * Loads user preferences from Firestore.
 */
const loadUserPreferences = async (userId) => {
  // Added check: Ensure userId is not null or undefined before proceeding
  if (!userId) {
    console.log("No userId provided to loadUserPreferences. Skipping preference load.");
    return;
  }

  try {
    const docRef = doc(db, "userPreferences", userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const preferences = docSnap.data();
      if (typeof preferences.autoSyncEnabled === 'boolean') {
        autoSyncEnabled.value = preferences.autoSyncEnabled;
        console.log("Loaded autoSyncEnabled from Firestore:", preferences.autoSyncEnabled);
      }
    } else {
      console.log("No user preferences found for this user. Will use default autoSyncEnabled: true.");
    }
  } catch (e) {
    console.error("Error loading user preferences:", e);
  }
};

/**
 * Saves a single user preference to Firestore.
 */
const saveUserPreference = async (key, value) => {
  // Added check: Ensure user.value is not null before accessing uid
  if (!user.value || !user.value.uid) {
    console.error("Cannot save user preference: User not authenticated or UID unavailable.");
    return;
  }

  try {
    const docRef = doc(db, "userPreferences", user.value.uid);
    await setDoc(docRef, { [key]: value }, { merge: true });
    console.log(`User preference '${key}' saved as '${value}' to Firestore.`);
  } catch (e) {
    console.error(`Error saving user preference '${key}':`, e);
  }
};


/**
 * Loads tasks from Firestore. This method performs a single fetch.
 * It's used for initial load, manual refresh, and by the auto-sync polling.
 */
const loadTasks = async (userId) => {
  // Added check: Ensure userId is not null or undefined before proceeding
  if (!userId) {
    tasks.value = []; // Clear tasks if no UID is provided (user logged out)
    console.log("Cannot load tasks: No user ID provided (user logged out or not initialized).");
    return;
  }

  isRefreshing.value = true;
  syncIndicator.value = true;

  try {
    const q = query(collection(db, "tasks"), where("userId", "==", userId), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    tasks.value = querySnapshot.docs.map(doc => ({
      id: doc.id,
      deleting: false, // Local state for deletion animation
      updating: false, // Local state for update animation
      completed: doc.data().completed ?? false,
      difficulty: doc.data().difficulty ?? "normal",
      createdAt: doc.data().createdAt, // Firebase Timestamp object
      text: doc.data().text
    }));

    lastUpdated.value = new Date();
  } catch (e) {
    console.error("Error loading tasks:", e);
  } finally {
    // Briefly show sync indicator and then reset refreshing state
    setTimeout(() => {
      syncIndicator.value = false;
      isRefreshing.value = false;
    }, 500); // Simulate network delay for a smoother UX
  }
};

/**
 * Initiates a manual refresh of tasks.
 * Resets the auto-sync timer if auto-sync is enabled.
 */
const refreshTasks = async () => {
  // Added check: Ensure user.value is not null before proceeding
  if (!user.value || !user.value.uid || isRefreshing.value) {
    console.log("Refresh aborted: User not authenticated or already refreshing.");
    return;
  }

  // Manual refresh should reset the auto-sync timer
  if (autoSyncEnabled.value) {
    stopAutoSync(); // Stop current intervals
    await loadTasks(user.value.uid); // Perform refresh
    startAutoSync(); // Restart intervals
  } else {
    await loadTasks(user.value.uid); // Just perform refresh if auto-sync is off
  }
};

/**
 * Toggles the auto-sync feature.
 */
const toggleAutoSync = () => {
  autoSyncEnabled.value = !autoSyncEnabled.value;
  saveUserPreference('autoSyncEnabled', autoSyncEnabled.value); // Save preference to Firestore

  if (autoSyncEnabled.value) {
    startAutoSync();
  } else {
    stopAutoSync();
  }
};

/**
 * Starts the auto-sync by setting up the polling interval and countdown timer.
 */
const startAutoSync = () => {
  // Added check: Ensure user.value is not null before proceeding
  if (!user.value || !user.value.uid) {
    console.log("Cannot start auto-sync: User not authenticated or UID unavailable.");
    return;
  }

  // Clear any existing intervals to prevent duplicates
  stopAutoSync();

  // Initial load when auto-sync starts
  loadTasks(user.value.uid);

  // Start the main polling interval
  autoSyncIntervalId = setInterval(async () => {
    console.log('Auto-sync: Refreshing tasks...');
    // Added check here for robustness within the interval
    if (user.value && user.value.uid) {
      await loadTasks(user.value.uid); // Fetch tasks from DB
      nextSyncCountdown.value = SYNC_INTERVAL / 1000; // Reset countdown after refresh
    } else {
      console.log("Auto-sync interval detected user logged out. Stopping auto-sync.");
      stopAutoSync();
    }
  }, SYNC_INTERVAL);

  // Start the countdown timer for display
  nextSyncCountdown.value = SYNC_INTERVAL / 1000; // Set initial countdown value
  countdownIntervalId = setInterval(() => {
    if (nextSyncCountdown.value > 0) {
      nextSyncCountdown.value--;
    } else {
      // The main polling interval will handle the reset, so no need for explicit action here.
    }
  }, 1000);

  console.log("Auto-sync enabled (polling every 10 seconds).");
};

/**
 * Stops the auto-sync by clearing all intervals.
 */
const stopAutoSync = () => {
  if (autoSyncIntervalId) {
    clearInterval(autoSyncIntervalId);
    autoSyncIntervalId = null;
  }
  if (countdownIntervalId) {
    clearInterval(countdownIntervalId);
    countdownIntervalId = null;
  }
  nextSyncCountdown.value = 0; // Reset countdown display
  console.log("Auto-sync disabled.");
};


const addTask = async () => {
  if (!newTask.value.trim()) {
    inputError.value = true;
    setTimeout(() => {
      inputError.value = false;
    }, 500);
    return;
  }
  // Added check: Ensure user.value is not null before accessing uid
  if (!user.value || !user.value.uid) {
    console.error("User not authenticated to add task.");
    return;
  }

  isAddingTask.value = true;

  try {
    // Simulate network delay for demo purposes
    await new Promise(resolve => setTimeout(resolve, 500));

    const taskData = {
      text: newTask.value.trim(),
      completed: false,
      difficulty: newTaskDifficulty.value,
      createdAt: new Date(), // Firebase will convert this to a Timestamp
      userId: user.value.uid // Attach user ID to the task
    };

    const docRef = await addDoc(collection(db, "tasks"), taskData);

    // Optimistically add the task to the local array
    tasks.value.unshift({ // Use unshift to add to the beginning, mirroring orderBy('desc')
      id: docRef.id,
      deleting: false,
      updating: false,
      ...taskData // Spread all data including text, completed, difficulty, createdAt
    });

    newTask.value = "";
    newTaskDifficulty.value = "normal";
  } catch (e) {
    console.error("Error adding task:", e);
  } finally {
    isAddingTask.value = false;
  }
};

const toggleTask = async (id) => {
  const task = tasks.value.find(t => t.id === id);
  // Added check: Ensure user.value is not null before proceeding
  if (!task || !user.value || !user.value.uid) {
    console.error("Cannot toggle task: Task not found or user not authenticated.");
    return;
  }

  const originalCompleted = task.completed;
  task.updating = true;
  // Optimistically update the UI
  task.completed = !task.completed;

  try {
    await new Promise(resolve => setTimeout(resolve, 300));

    await updateDoc(doc(db, "tasks", id), {
      completed: task.completed // Use the new toggled state
    });

    // If successful, no need to do anything, UI is already updated
  } catch (e) {
    console.error("Error updating task:", e);
    // Revert UI if update fails
    task.completed = originalCompleted;
  } finally {
    task.updating = false;
  }
};

const deleteTask = async (id) => {
  const taskIndex = tasks.value.findIndex(t => t.id === id);
  // Added check: Ensure user.value is not null before proceeding
  if (taskIndex === -1 || !user.value || !user.value.uid) {
    console.error("Cannot delete task: Task not found or user not authenticated.");
    return;
  }

  const taskToDelete = tasks.value[taskIndex];
  taskToDelete.deleting = true; // Set local state for animation

  try {
    // A small delay before actual deletion for the animation to be visible
    await new Promise(resolve => setTimeout(resolve, 300));
    await deleteDoc(doc(db, "tasks", id));

    // Remove from local array after successful deletion from Firestore
    tasks.value = tasks.value.filter(t => t.id !== id);

  } catch (e) {
    console.error("Error deleting task:", e);
    // If deletion fails, revert the deleting state
    if (taskToDelete) {
      taskToDelete.deleting = false;
    }
  }
};

const getDifficultyLabel = (difficulty) => {
  const labels = {
    easy: "Легко",
    normal: "Нормально",
    hard: "Сложно"
  };
  return labels[difficulty] || labels.normal;
};

const formatDate = (timestamp) => {
  if (!timestamp) return "";
  let date;
  // Firebase Timestamp objects have a .toDate() method
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    // Fallback for other formats (e.g., string or number representing date)
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) { // Check if date is valid
    return "Неверная дата";
  }

  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
};

const formatLastUpdated = () => {
  if (!lastUpdated.value) return '';

  const now = new Date(currentTime.value); // Use currentTime for dynamic updates
  const diffSeconds = Math.floor((now.getTime() - lastUpdated.value.getTime()) / 1000); // Difference in seconds

  if (diffSeconds < 60) {
    if (diffSeconds <= 5) { // 'только что' for very recent updates
      return 'только что';
    } else {
      return `${diffSeconds} сек. назад`;
    }
  } else if (diffSeconds < 3600) { // Less than an hour, show in minutes
    const minutes = Math.floor(diffSeconds / 60);
    return `${minutes} мин. назад`;
  } else if (diffSeconds < 86400) { // Less than a day, show in hours
    const hours = Math.floor(diffSeconds / 3600);
    return `${hours} час. назад`;
  } else {
    // If more than a day, show the formatted date
    return lastUpdated.value.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric' // Changed to numeric year for clarity on older dates
    });
  }
};

const getEmptyStateText = () => {
  switch (currentFilter.value) {
    case 'completed':
      return 'Нет выполненных задач';
    case 'pending':
      return 'Нет активных задач. Отличная работа!';
    default:
      return 'Пока нет задач. Добавьте первую!';
  }
};

// --- Lifecycle Hooks ---

onMounted(() => {
  // Start updating currentTime every second for the "Последнее обновление" text
  updateCurrentTimeIntervalId = setInterval(() => {
    currentTime.value = Date.now();
  }, 1000);

  // Subscribe to authentication state changes when the component is mounted.
  onAuthStateChanged(auth, async (currentUser) => {
    user.value = currentUser; // Update the reactive user object

    if (currentUser) {
      console.log("MainPage: User logged in, UID:", currentUser.uid);
      // Ensure currentUser is passed directly to functions that need it
      await loadUserPreferences(currentUser.uid);

      if (autoSyncEnabled.value) {
        startAutoSync(); // startAutoSync internally checks user.value
      } else {
        await loadTasks(currentUser.uid); // loadTasks internally checks userId
      }
    } else {
      console.log("MainPage: User logged out or not authenticated.");
      // If user logs out, clear tasks and stop auto-sync
      tasks.value = [];
      stopAutoSync();
    }
  });
});

onUnmounted(() => {
  stopAutoSync(); // Ensure all polling/countdown intervals are cleared
  if (updateCurrentTimeIntervalId) {
    clearInterval(updateCurrentTimeIntervalId);
    updateCurrentTimeIntervalId = null;
  }
});
</script>

<style scoped>
/* Your existing styles remain unchanged for most elements. */
.task-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: calc(100vh - 70px);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  box-sizing: border-box;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
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
  border: 1px solid rgba(255, 255, 255, 0.2);
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

/* --- New styles for sync section --- */
.sync-section {
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.8s ease-out 0.1s both;
}

.sync-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  background: rgba(255, 255, 255, 0.15);
  padding: 1rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.refresh-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(45deg, #2196F3, #1976D2);
  color: white;
  border: none;
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
  justify-content: center;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.refresh-button:hover:not(:disabled) {
  background: linear-gradient(45deg, #1976D2, #2196F3);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(33, 150, 243, 0.4);
}

.refresh-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  background: #90CAF9;
  box-shadow: none;
}

.refresh-button.refreshing {
  background: linear-gradient(45deg, #FFB300, #F57C00);
  color: #fff;
}

.refresh-icon {
  font-size: 1.1rem;
  transition: transform 0.3s ease;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

.auto-sync-toggle {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.sync-toggle-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  padding: 0.8rem 1.2rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  min-width: 160px;
  justify-content: center;
}

.sync-toggle-button.active {
  background: linear-gradient(45deg, #4CAF50, #45a049);
  border-color: #4CAF50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.sync-toggle-button:hover:not(.active) {
  background: rgba(255, 255, 255, 0.3);
}

.sync-toggle-button.active:hover {
  background: linear-gradient(45deg, #45a049, #4CAF50);
  box-shadow: 0 4px 10px rgba(76, 175, 80, 0.4);
}

.sync-icon {
  font-size: 1.1rem;
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.sync-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.sync-indicator.active {
  background: #4CAF50;
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.6);
  animation: pulse 1.5s infinite ease-in-out;
}

.next-sync-text {
  opacity: 0.8;
}

.last-updated {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
  background: rgba(255, 255, 255, 0.05);
  padding: 0.5rem;
  border-radius: 8px;
  backdrop-filter: blur(5px);
  margin-top: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.update-text {
  font-style: italic;
}
/* --- End of new styles for sync section --- */

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
  border: 1px solid rgba(0, 0, 0, 0.05);
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
  border: 1px solid #e0e0e0;
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
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
  background: #A5D6A7;
  box-shadow: none;
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

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.8;
  }
}

.filter-section {
  margin-bottom: 1.5rem;
  animation: fadeInUp 0.8s ease-out 0.3s both;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  padding: 0.5rem;
  border-radius: 12px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
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
  /* IMPORTANT: Added for correct absolute positioning of leaving items */
  position: relative;
}

.task-item {
  background: white;
  margin-bottom: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* General transition for non-animation properties. Ensure this doesn't conflict. */
  transition: all 0.3s ease;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.05);
  /* Hint to the browser for animation performance */
  will-change: transform, opacity;
}

.task-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.task-item.deleting {
  opacity: 0.6;
  transform: scale(0.95);
  /* Ensure deleting also has its own consistent transition if applied separately */
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.task-item.completed {
  opacity: 0.8; /* Keep this for static display of completed tasks */
  background: #f0f0f0;
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
  flex-shrink: 0;
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
  word-break: break-word;
}

.task-text.completed {
  text-decoration: line-through;
  color: #999;
}

.task-meta {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
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
  flex-shrink: 0;
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
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.delete-button:hover:not(:disabled) {
  background: linear-gradient(45deg, #d32f2f, #f44336);
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(244, 67, 54, 0.3);
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: #FFCDD2;
  box-shadow: none;
}

.delete-icon {
  line-height: 1;
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: white;
  opacity: 0.8;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
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

/* ---- UNIFIED Transition group animations for filtering ---- */
.task-list-enter-active,
.task-list-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease; /* Unified transition for enter and leave */
}

/*
  For enter and leave, we will use symmetrical transforms.
*/
.task-list-enter-from {
  opacity: 0;
  transform: translateX(-30px) scale(0.9); /* Starts faded, smaller, and off to the left */
}

/*
  IMPORTANT FIX for consistent fade-out:
  By explicitly setting `opacity: 1` here, any task (completed or not) will first snap to full opacity
  when the leave transition *starts*, then fade to `opacity: 0` as defined in `task-list-leave-to`.
  This makes the visual fade-out identical in range (1 to 0) and duration (0.3s).
  NOTE: For completed tasks, this might cause a very brief flicker (from 0.8 to 1) just before fading to 0.
*/
.task-list-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
  opacity: 1; /* <-- This forces the starting opacity to 1 for the fade-out */

  position: absolute;
  width: 100%; /* Important: maintain original width during transition */
  top: 0; /* Align with the current top position of where it was */
  left: 0; /* Align with the current left position */
  right: 0; /* Ensure full width */
  margin-bottom: 0 !important; /* Prevent margins from affecting vertical layout */
}

.task-list-leave-to {
  opacity: 0;
  transform: translateX(30px) scale(0.9); /* Ends faded, smaller, and off to the right */
}

/* For elements that are moving (due to other items being added/removed) */
.task-list-move {
  transition: transform 0.3s ease; /* Consistent transition duration for movement */
}

/* Responsive design */
@media (max-width: 768px) {
  .task-container {
    padding: 1rem;
    min-height: calc(100vh - 50px);
  }

  .title {
    font-size: 2rem;
  }

  .stats {
    gap: 1rem;
    flex-wrap: wrap;
  }

  .stat-item {
    padding: 0.8rem;
    flex: 1 1 auto;
  }

  .stat-number {
    font-size: 1.5rem;
  }

  .sync-controls {
    flex-direction: column;
    gap: 0.8rem;
    padding: 0.8rem;
  }

  .refresh-button, .sync-toggle-button {
    width: 100%;
    min-width: unset;
  }

  .auto-sync-toggle {
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
    width: 100%;
  }

  .sync-status {
    width: 100%;
    justify-content: center;
    margin-left: 0;
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
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .task-left {
    width: 100%;
  }

  .task-info {
    width: calc(100% - 34px);
  }

  .task-text {
    font-size: 1rem;
  }

  .task-meta {
    flex-direction: row;
    align-items: center;
    gap: 0.8rem;
    margin-top: 0.5rem;
  }

  .task-actions {
    width: 100%;
    justify-content: flex-end;
    margin-top: 1rem;
  }
}
</style>
