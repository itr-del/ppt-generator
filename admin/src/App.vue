<template>
  <div class="min-h-screen bg-slate-50">
    <aside class="w-56 bg-slate-900 text-slate-200 min-h-screen fixed left-0 top-0 bottom-0">
      <div class="px-5 py-4 text-sm font-semibold">PPT 运营后台</div>
      <nav class="px-2 space-y-1 text-sm">
        <router-link class="block px-3 py-2 rounded hover:bg-slate-800" to="/dashboard">概览</router-link>
        <router-link class="block px-3 py-2 rounded hover:bg-slate-800" to="/projects">项目</router-link>
        <router-link class="block px-3 py-2 rounded hover:bg-slate-800" to="/payments">支付</router-link>
        <router-link class="block px-3 py-2 rounded hover:bg-slate-800" to="/settings">设置</router-link>
      </nav>
    </aside>
    <main class="ml-56 p-6">
      <router-view />
    </main>
  </div>
</template>
