<template>
  <div>
    <h1 class="text-lg font-semibold mb-4">支付记录</h1>
    <div v-if="loading" class="text-sm text-slate-500">加载中...</div>
    <div v-else>
      <table class="min-w-full bg-white border rounded text-sm">
        <thead class="bg-slate-50">
          <tr>
            <th class="p-2 border-b text-left">订单号</th>
            <th class="p-2 border-b text-left">项目</th>
            <th class="p-2 border-b">金额</th>
            <th class="p-2 border-b">方式</th>
            <th class="p-2 border-b">状态</th>
            <th class="p-2 border-b">交易号</th>
            <th class="p-2 border-b">创建时间</th>
            <th class="p-2 border-b">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in payments" :key="row.id">
            <td class="p-2 border-b font-mono text-xs">{{ row.id }}</td>
            <td class="p-2 border-b">{{ row.title || '-' }}</td>
            <td class="p-2 border-b text-center">{{ row.amount }} 元</td>
            <td class="p-2 border-b text-center">{{ row.method === 'wechat' ? '微信' : '支付宝' }}</td>
            <td class="p-2 border-b text-center">
              <span :class="statusBadge(row.status)">{{ statusLabel(row.status) }}</span>
            </td>
            <td class="p-2 border-b font-mono text-xs">{{ row.trade_no || '-' }}</td>
            <td class="p-2 border-b text-xs">{{ row.created_at }}</td>
            <td class="p-2 border-b text-center">
              <button v-if="row.status === 'pending'" @click="confirmPay(row.id)" class="px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs hover:bg-emerald-100">确认收款</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!payments.length" class="text-center text-slate-400 py-10">暂无支付记录</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';

const payments = ref([]);
const loading = ref(true);

function statusLabel(s) {
  const map = { pending: '待支付', paid: '已支付', expired: '已过期', refunded: '已退款' };
  return map[s] || s;
}
function statusBadge(s) {
  const map = { pending: 'bg-amber-50 text-amber-600 px-2 py-0.5 rounded', paid: 'bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded', expired: 'bg-red-50 text-red-600 px-2 py-0.5 rounded', refunded: 'bg-slate-100 text-slate-600 px-2 py-0.5 rounded' };
  return map[s] || 'bg-slate-100 text-slate-600 px-2 py-0.5 rounded';
}

async function confirmPay(id) {
  try {
    await axios.post(`/api/admin/payments/${id}/confirm`, { trade_no: '' });
    const res = await axios.get('/api/admin/payments');
    payments.value = res.data;
  } catch (e) {
    alert('确认失败');
  }
}

onMounted(async () => {
  try {
    const res = await axios.get('/api/admin/payments');
    payments.value = res.data;
  } catch (e) {
    console.error('Failed to load payments:', e);
  } finally {
    loading.value = false;
  }
});
</script>
