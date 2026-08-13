<template>
  <div>
    <h1 class="text-lg font-semibold mb-4">系统设置</h1>
    <div v-if="loading" class="text-sm text-slate-500">加载中...</div>
    <form v-else @submit.prevent="save" class="space-y-4 max-w-lg">
      <div>
        <label class="block text-sm text-slate-600">站点名称</label>
        <input v-model="form.site_name" class="mt-1 block w-full rounded border p-2 text-sm" placeholder="AI PPT 生成器" />
      </div>
      <div>
        <label class="block text-sm text-slate-600">PPT 价格（元）</label>
        <input v-model="form.ppt_price" class="mt-1 block w-full rounded border p-2 text-sm" placeholder="9.90" />
      </div>
      <div>
        <label class="block text-sm text-slate-600">LLM 模型</label>
        <input v-model="form.llm_model" class="mt-1 block w-full rounded border p-2 text-sm" placeholder="deepseek-chat" />
      </div>
      <div>
        <label class="block text-sm text-slate-600">API 地址</label>
        <input v-model="form.llm_base_url" class="mt-1 block w-full rounded border p-2 text-sm" placeholder="https://api.deepseek.com/v1" />
      </div>
      <div>
        <label class="block text-sm text-slate-600">API Key</label>
        <input v-model="form.llm_api_key" type="password" class="mt-1 block w-full rounded border p-2 text-sm" placeholder="sk-xxx" />
        <p class="text-xs text-slate-400 mt-1">留空则使用环境变量 DEEPSEEK_API_KEY</p>
      </div>
      <div>
        <label class="block text-sm text-slate-600">微信收款码路径</label>
        <input v-model="form.wechat_qr_path" class="mt-1 block w-full rounded border p-2 text-sm" placeholder="/uploads/wechat-qr.png" />
      </div>
      <div>
        <label class="block text-sm text-slate-600">支付宝收款码路径</label>
        <input v-model="form.alipay_qr_path" class="mt-1 block w-full rounded border p-2 text-sm" placeholder="/uploads/alipay-qr.png" />
      </div>
      <div class="flex gap-2">
        <button type="submit" :disabled="saving" class="px-4 py-2 bg-slate-900 text-white text-sm rounded hover:bg-slate-800 disabled:opacity-50">
          {{ saving ? '保存中...' : '保存' }}
        </button>
        <span v-if="saved" class="text-emerald-600 text-sm self-center">已保存 ✓</span>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import axios from 'axios';

const form = reactive({
  site_name: 'AI PPT 生成器',
  ppt_price: '9.90',
  llm_model: 'deepseek-chat',
  llm_base_url: 'https://api.deepseek.com/v1',
  llm_api_key: '',
  wechat_qr_path: '',
  alipay_qr_path: '',
});
const loading = ref(true);
const saving = ref(false);
const saved = ref(false);

async function load() {
  try {
    const res = await axios.get('/api/settings/public');
    form.site_name = res.data.site_name || 'AI PPT 生成器';
  } catch (_) { /* ignore */ }
  // Load all settings keys
  const keys = ['ppt_price', 'llm_model', 'llm_base_url', 'llm_api_key', 'wechat_qr_path', 'alipay_qr_path'];
  for (const key of keys) {
    try {
      const res = await axios.get(`/api/admin/settings/${key}`);
      if (res.data.value !== undefined && res.data.value !== null && res.data.value !== '') {
        form[key] = res.data.value;
      }
    } catch (_) { /* use default */ }
  }
}

async function save() {
  saving.value = true;
  saved.value = false;
  try {
    const keys = ['site_name', 'ppt_price', 'llm_model', 'llm_base_url', 'llm_api_key', 'wechat_qr_path', 'alipay_qr_path'];
    for (const key of keys) {
      await axios.post('/api/admin/settings', { key, value: form[key] });
    }
    saved.value = true;
    setTimeout(() => { saved.value = false; }, 3000);
  } catch (e) {
    alert('保存失败: ' + (e.response?.data?.error || e.message));
  } finally {
    saving.value = false;
  }
}

onMounted(load);
</script>
