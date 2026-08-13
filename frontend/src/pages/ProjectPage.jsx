import React from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = React.useState(null);
  const [error, setError] = React.useState('');
  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState('');
  const [generated, setGenerated] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState('');

  const loadProject = React.useCallback(() => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setProject(data);
        if (data.status === 'preview' || data.status === 'paid' || data.status === 'completed') {
          setGenerated(true);
          if (data.preview_images) setPreviewUrl(data.preview_images);
        }
      })
      .catch(() => setError('加载失败'));
  }, [id]);

  React.useEffect(() => { loadProject(); }, [loadProject]);

  // Poll while generating
  React.useEffect(() => {
    if (!generating) return;
    const t = setInterval(() => {
      fetch(`/api/projects/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setProject(data);
          if (data.status === 'preview' || data.status === 'paid') {
            setGenerating(false);
            setGenerated(true);
            if (data.preview_images) setPreviewUrl(data.preview_images);
          }
        })
        .catch(() => {});
    }, 2000);
    return () => clearInterval(t);
  }, [generating, id]);

  const generatePPT = async () => {
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/ppt/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id }),
      });
      const json = await res.json();
      if (json.error) { setGenError(json.error); setGenerating(false); return; }
      if (json.preview_url || json.preview_path) {
        setPreviewUrl(json.preview_url || json.preview_path);
      }
      setGenerated(true);
      loadProject();
    } catch (e) {
      setGenError('生成失败: ' + e.message);
      setGenerating(false);
    }
  };

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!project) return <div className="p-6 text-slate-500">加载中...</div>;

  return (
    <div className="h-screen overflow-hidden bg-slate-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="text-white font-semibold truncate">{project.title || '未命名'}</div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{project.style || '-'} · {project.direction || '-'}</span>
          <Link to="/chat" className="text-sm text-slate-300 hover:text-white">新建</Link>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Not yet generated */}
        {!generated && !generating && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <p className="text-slate-400">已收集完成，共 {project.pages} 页</p>
              <button onClick={generatePPT} className="px-8 py-3 bg-blue-600 text-white rounded-lg text-base font-medium hover:bg-blue-700 transition shadow-lg">
                生成 PPT
              </button>
            </div>
          </div>
        )}

        {/* Generating */}
        {generating && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="inline-block w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-300">正在生成 PPT...</p>
              <p className="text-xs text-slate-500">AI 正在设计幻灯片，请稍候</p>
            </div>
          </div>
        )}

        {/* Error */}
        {genError && (
          <div className="p-6">
            <div className="text-red-400 bg-red-900/30 border border-red-800 rounded-lg p-4 text-sm">{genError}</div>
          </div>
        )}

        {/* Preview */}
        {generated && !generating && previewUrl && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Control bar */}
            <div className="bg-slate-800 px-4 py-2 flex items-center justify-between shrink-0 border-b border-slate-700">
              <span className="text-emerald-400 text-sm">✅ 已生成</span>
              <Link
                to={`/payment/${project.id}`}
                className="px-4 py-1.5 bg-emerald-600 text-white rounded text-sm font-medium hover:bg-emerald-700 transition"
              >
                去支付并下载
              </Link>
            </div>
            {/* Slide iframe */}
            <div className="flex-1 bg-slate-950">
              <iframe
                src={previewUrl}
                className="w-full h-full border-0"
                title="PPT 预览"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
