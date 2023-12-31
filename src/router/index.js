/*
 * @Author      : Mr.bin
 * @Date        : 2023-06-10 11:19:30
 * @LastEditTime: 2023-06-16 15:49:49
 * @Description : 路由
 */
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

// 解决ElementUI导航栏中的vue-router在3.0版本以上重复点菜单报错问题
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
  return originalPush.call(this, location).catch(err => err)
}

const routes = [
  /*
   * 前面加"/"表示绝对路径，不加"/"表示相对路径
   * 一般嵌套路由中的子路由不需要加"/"，它会在父路由后自动加上"/子路由"
   * 比如父 "/father"，子 "child"，要想访问子路由，跳转链接需要写成 "/father/child"
   */

  {
    path: '/',
    name: 'layout',
    component: () => import('@/layout'),
    redirect: '/home',
    children: [
      // 首页
      {
        path: 'home',
        name: 'home',
        component: () => import('@/views/home'),
        meta: ['首页']
      },
      // 调零
      {
        path: 'set-zero',
        name: 'set-zero',
        component: () => import('@/views/set/set-zero'),
        meta: ['调零']
      },
      // 设置K
      {
        path: 'set-k',
        name: 'set-k',
        component: () => import('@/views/set/set-k'),
        meta: ['设置K']
      },
      // 设置蹬伸动作范围
      {
        path: 'set-relativeDistance',
        name: 'set-relativeDistance',
        component: () => import('@/views/set/set-relativeDistance'),
        meta: ['设置蹬伸动作范围']
      },
      // 开发者
      {
        path: 'set-developer',
        name: 'set-developer',
        component: () => import('@/views/set/set-developer'),
        meta: ['开发者']
      },

      // 任务详情页
      {
        path: 'task',
        name: 'task',
        component: () => import('@/views/task'),
        meta: ['任务详情页']
      },

      /* 评估 */
      // 下肢测试-具体测量
      {
        path: 'lower-limb-measure',
        name: 'lower-limb-measure',
        component: () => import('@/views/test-mode/lower-limb/measure'),
        meta: ['下肢测试-具体测量']
      },

      /* 训练 */
      // 基础训练-具体测量
      {
        path: 'basics-measure',
        name: 'basics-measure',
        component: () => import('@/views/train-mode/basics/measure'),
        meta: ['基础训练-具体测量']
      },
      // 进阶训练-具体测量
      {
        path: 'advance-measure',
        name: 'advance-measure',
        component: () => import('@/views/train-mode/advance/measure'),
        meta: ['进阶训练-具体测量']
      },
      // 离心训练-具体测量
      {
        path: 'offcenter-measure',
        name: 'offcenter-measure',
        component: () => import('@/views/train-mode/offcenter/measure'),
        meta: ['离心训练-具体测量']
      },
      // 等长训练-具体测量
      {
        path: 'equal-measure',
        name: 'equal-measure',
        component: () => import('@/views/train-mode/equal/measure'),
        meta: ['等长训练-具体测量']
      },
      // 自定义训练-具体测量
      {
        path: 'custom-measure',
        name: 'custom-measure',
        component: () => import('@/views/train-mode/custom/measure'),
        meta: ['自定义训练-具体测量']
      }
    ]
  },

  /* 评估数据统一发送页面 */
  {
    path: '/test-send',
    name: 'test-send',
    component: () => import('@/views/test-mode/test-send'),
    meta: ['评估数据统一发送页面']
  },

  /* 训练数据统一发送页面 */
  {
    path: '/train-send',
    name: 'train-send',
    component: () => import('@/views/train-mode/train-send'),
    meta: ['训练数据统一发送页面']
  },

  {
    path: '/refresh',
    name: 'refresh',
    component: () => import('@/views/refresh')
  },

  {
    path: '*',
    redirect: '/'
  }
]

const router = new VueRouter({
  routes,
  /* 自定义路由切换时页面如何滚动 */
  scrollBehavior(to, from, savedPosition) {
    return { x: 0, y: 0 } // 回到顶部
  }
})
export default router
