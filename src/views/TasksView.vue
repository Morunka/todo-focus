<template>
  <div class="home">
    <MainPage msg="Список задач"/>
  </div>
</template>

<script>
// @ is an alias to /src
import MainPage from '@/components/MainPage.vue';

export default {
  name: 'TasksView',
  components: {
    MainPage
  }
}
</script>
