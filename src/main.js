import { createApp } from 'vue';
import { createStore } from 'vuex';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import Login from './Login.vue';
import Main from './Main.vue';
import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';

const store = createStore({
  state() {
    return {
      token: null,  // 在 state 中定义一个变量来存储 Token
      user: {
        userID: null,
        username: null
      }
    }
  },
  mutations: {
    setToken(state, token) {  // 定义一个 mutation 来更新 Token
      state.token = token
    },
    setUser(state, user) { // 定义一个 mutation 来更新 User
      state.user = user
    },
    logout(state) { // 定义一个 mutation 来清除 Token
      state.token = null
      state.user = {
        userID: null,
        username: null
      }
    }
  }
});

const routes = [
  { path: '/login', component: Login },
  { path: '/main', component: Main }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from) => {
  if (to.path === '/login') {
    return true;
  }
  else if (!store.state.token) {
    return '/login';
  }
  else {
    try {
      // 验证Token
      await axios.get('http://localhost:3000/verify', {
        headers: { Authorization: `Bearer ${store.state.token}` }
      })
    } catch (err) {
      // Token 验证失败，跳转到登录页
      return '/login';
    }
  }
});

axios.interceptors.request.use(
  config => {
      if (store.state.token) {
          config.headers['Authorization'] = `Bearer ${store.state.token}`; // 设置 Authorization 请求头
      }
      return config;
  },
  error => {
      return Promise.reject(error);
  }
);

const app = createApp(App);
app.use(router);
app.use(ElementPlus);
app.use(store);

app.mount('#app');