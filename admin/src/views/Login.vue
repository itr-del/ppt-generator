<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center">
    <form @submit.prevent="login" class="bg-white border rounded p-6 w-full max-w-sm space-y-3">
      <h1 class="text-lg font-semibold">运营后台登录</h1>
      <p class="text-xs text-slate-500">默认账号：admin / admin123</p>
      <div>
        <label class="block text-sm text-slate-600">用户名</label>
        <input v-model="form.username" class="mt-1 block w-full rounded border p-2 text-sm" />
      </div>
      <div>
        <label class="block text-sm text-slate-600">密码</label>
        <input type="password" v-model="form.password" class="mt-1 block w-full rounded border p-2 text-sm" />
      </div>
      <button type="submit" class="w-full px-3 py-2 bg-slate-900 text-white rounded text-sm">登录</button>
      <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const form = reactive({ username: '', password: '' });
const error = ref('');

async function login() {
  error.value = '';
  try {
    const res = await axios.post('/api/admin/login', form);
    if (res.data.ok) {
      router.push('/dashboard');
    }
  } catch (e) {
    error.value = e.response?.data?.error || '登录失败';
  }
}
</script>
