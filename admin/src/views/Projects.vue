<template>
  <div>
    <h1 class="text-lg font-semibold mb-4">项目列表</h1>
    <div v-if="loading" class="text-sm text-slate-500">加载中...</div>
    <div v-else>
      <table class="min-w-full bg-white border rounded text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="p-2 border-b text-left">ID</th>
            <th class="p-2 border-b text-left">标题</th>
            <th class="p-2 border-b">状态</th>
            <th class="p-2 border-b">页数</th>
            <th class="p-2 border-b">更新时间</th>
            <th class="p-2 border-b">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in projects" :key="item.id">
            <td class="p-2 border-b font-mono text-xs">{{ item.id }}</td>
            <td class="p-2 border-b">
              <router-link :to="`/projects/${item.id}`" class="text-blue-600 hover:underline">{{ item.title || '未命名' }}</router-link>
            </td>
            <td class="p-2 border-b text-center">
              <span :class="statusBadge(item.status)">{{ statusLabel(item.status) }}</span>
            </td>
            <td class="p-2 border-b text-center">{{ item.pages }}</td>
            <td class="p-2 border-b">{{ item.updated_at }}</td>
            <td class="p-2 border-b text-center">
              <button @click="remove(item.id)" class="px-2 py-1 bg-red-50 text-red-600 rounded text-xs hover:bg-red-100">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!projects.length" class="text-center text-slate-400 py-10">暂无项目</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const projects = ref([]);
const loading = ref(true);

function statusLabel(s) {
  const map = { draft: '草稿', generating: '生成中', preview: '预览', paid: '已支付', completed: '已完成', expired: '已过期' };
  return map[s] || s;
}
function statusBadge(s) {
  const map = { draft: 'bg-slate-100 text-slate-600 px-2 py-0.5 rounded', generating: 'bg-blue-50 text-blue-600 px-2 py-0.5 rounded', preview: 'bg-amber-50 text-amber-600 px-2 py-0.5 rounded', paid: 'bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded', completed: 'bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded', expired: 'bg-red-50 text-red-600 px-2 py-0.5 rounded' };
  return map[s] || 'bg-slate-100 text-slate-600 px-2 py-0.5 rounded';
}

async function remove(id) {
  if (!confirm('确定删除此项目？')) return;
  try {
    await axios.delete(`/api/admin/projects/${id}`);
    projects.value = projects.value.filter((p) => p.id !== id);
  } catch (e) {
    alert('删除失败');
  }
}

onMounted(async () => {
  try {
    const res = await axios.get('/api/admin/projects');
    projects.value = res.data;
  } catch (e) {
    console.error('Failed to load projects:', e);
  } finally {
    loading.value = false;
  }
});
</script>
