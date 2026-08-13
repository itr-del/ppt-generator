<template>
  <div>
    <h1 class="text-lg font-semibold mb-4">项目详情</h1>
    <div v-if="loading" class="text-sm text-slate-500">加载中...</div>
    <div v-else-if="project" class="bg-white border rounded p-4 space-y-2 text-sm">
      <div><span class="text-slate-500">ID：</span><span class="font-mono">{{ project.id }}</span></div>
      <div><span class="text-slate-500">标题：</span>{{ project.title || '未命名' }}</div>
      <div><span class="text-slate-500">页数：</span>{{ project.pages }}</div>
      <div><span class="text-slate-500">风格：</span>{{ project.style || '-' }}</div>
      <div><span class="text-slate-500">方向：</span>{{ project.direction || '-' }}</div>
      <div><span class="text-slate-500">使用场景：</span>{{ project.use_case || '-' }}</div>
      <div><span class="text-slate-500">补充信息：</span>{{ project.additional_info || '-' }}</div>
      <div><span class="text-slate-500">状态：</span>
        <span :class="statusBadge(project.status)">{{ statusLabel(project.status) }}</span>
      </div>
      <div><span class="text-slate-500">创建时间：</span>{{ project.created_at }}</div>
      <div><span class="text-slate-500">更新时间：</span>{{ project.updated_at }}</div>
      <div v-if="project.raw_content" class="pt-2">
        <span class="text-slate-500">PPT 内容：</span>
        <pre class="mt-1 bg-slate-50 border rounded p-3 text-xs overflow-auto max-h-96">{{ formatJson(project.raw_content) }}</pre>
      </div>
      <div class="pt-2 flex gap-2">
        <router-link to="/projects" class="text-sm text-blue-600 hover:underline">← 返回列表</router-link>
      </div>
    </div>
    <div v-else class="text-red-600 text-sm">项目不存在或加载失败</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const project = ref(null);
const loading = ref(true);

function statusLabel(s) {
  const map = { draft: '草稿', generating: '生成中', preview: '预览', paid: '已支付', completed: '已完成', expired: '已过期' };
  return map[s] || s;
}
function statusBadge(s) {
  const map = { draft: 'bg-slate-100 text-slate-600 px-2 py-0.5 rounded', generating: 'bg-blue-50 text-blue-600 px-2 py-0.5 rounded', preview: 'bg-amber-50 text-amber-600 px-2 py-0.5 rounded', paid: 'bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded', completed: 'bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded', expired: 'bg-red-50 text-red-600 px-2 py-0.5 rounded' };
  return map[s] || 'bg-slate-100 text-slate-600 px-2 py-0.5 rounded';
}
function formatJson(str) {
  try { return JSON.stringify(JSON.parse(str), null, 2); } catch (e) { return str; }
}

onMounted(async () => {
  try {
    const res = await axios.get(`/api/projects/${route.params.id}`);
    project.value = res.data;
  } catch (e) {
    console.error('Failed to load project:', e);
  } finally {
    loading.value = false;
  }
});
</script>
