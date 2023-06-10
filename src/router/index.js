/*
 * @Author      : Mr.bin
 * @Date        : 2023-06-10 11:19:30
 * @LastEditTime: 2023-06-10 11:50:12
 * @Description : 路由
 */
import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',

    component: () => import('../views/About.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
