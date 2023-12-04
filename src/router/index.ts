import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../Home.vue'
import SnakeView from '../snake/View.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/snake',
      name: 'snake',
      component: SnakeView
    }
  ]
})

export default router
