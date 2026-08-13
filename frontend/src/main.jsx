import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import './index.css';
import ChatPage from './pages/ChatPage';
import ProjectPage from './pages/ProjectPage';
import PaymentPage from './pages/PaymentPage';

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-3xl font-bold">AI PPT 生成器</h1>
      <p className="text-slate-600 text-center max-w-md">
        通过问答快速生成 PPT，完成后可付费下载 .pptx 文件。
      </p>
      <Link to="/chat" className="px-4 py-2 bg-blue-600 text-white rounded">开始创建</Link>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/project/:id" element={<ProjectPage />} />
      <Route path="/payment/:id" element={<PaymentPage />} />
    </Routes>
  </BrowserRouter>
);
