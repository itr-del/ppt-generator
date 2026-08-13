<template>
  <div>
    <h1 class="text-lg font-semibold mb-4">概览</h1>
    <div v-if="loading" class="text-sm text-slate-500">加载中...</div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div class="bg-white rounded shadow-sm border p-4">
        <div class="text-sm text-slate-500">项目总数</div>
        <div class="text-2xl font-bold mt-1">{{ stats.total_count ?? '-' }}</div>
      </div>
      <div class="bg-white rounded shadow-sm border p-4">
        <div class="text-sm text-slate-500">付费订单</div>
        <div class="text-2xl font-bold mt-1">{{ stats.paid_count ?? '-' }}</div>
      </div>
      <div class="bg-white rounded shadow-sm border p-4">
        <div class="text-sm text-slate-500">总收入</div>
        <div class="text-2xl font-bold mt-1">{{ (stats.total_revenue ?? 0).toFixed(2) }} 元</div>
      </div>
      <div class="bg-white rounded shadow-sm border p-4">
        <div class="text-sm text-slate-500">今日收入</div>
        <div class="text-2xl font-bold mt-1">{{ (stats.today_revenue ?? 0).toFixed(2) }} 元</div>
      </div>
      <div class="bg-white rounded shadow-sm border p-4">
        <div class="text-sm text-slate-500">本月收入</div>
        <div class="text-2xl font-bold mt-1">{{ (stats.monthly_revenue ?? 0).toFixed(2) }} 元</div>
      </div>
      <div class="bg-white rounded shadow-sm border p-4">
        <div class="text-sm text-slate-500">待处理订单</div>
        <div class="text-2xl font-bold mt-1 text-amber-600">{{ stats.pending_count ?? 0 }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const stats = ref({});
const loading = ref(true);

onMounted(async () => {
  try {
    const res = await axios.get('/api/admin/stats');
    stats.value = res.data;
  } catch (e) {
    console.error('Failed to load stats:', e);
  } finally {
    loading.value = false;
  }
});
</script>
