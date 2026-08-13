import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';
import './index.css';
import App from './App.vue';
import Dashboard from './views/Dashboard.vue';
import Projects from './views/Projects.vue';
import ProjectDetail from './views/ProjectDetail.vue';
import Payments from './views/Payments.vue';
import Settings from './views/Settings.vue';
import Login from './views/Login.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', component: Login },
    { path: '/dashboard', component: Dashboard },
    { path: '/projects', component: Projects },
    { path: '/projects/:id', component: ProjectDetail },
    { path: '/payments', component: Payments },
    { path: '/settings', component: Settings },
  ],
});

axios.defaults.baseURL = '/api/admin';
axios.defaults.withCredentials = true;
axios.interceptors.response.use((r) => r, (err) => {
  if (err?.response?.status === 401) router.push('/login');
  return Promise.reject(err);
});

const app = createApp(App);
app.use(router);
app.mount('#app');
