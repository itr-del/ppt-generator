import React from 'react';
import { Link } from 'react-router-dom';

export default function ChatPage() {
  const [projectId, setProjectId] = React.useState('');
  const [step, setStep] = React.useState(null);
  const [project, setProject] = React.useState(null);
  const [answer, setAnswer] = React.useState('');
  const [done, setDone] = React.useState(false);
  const [summary, setSummary] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [freeText, setFreeText] = React.useState('');

  const loadStep = React.useCallback(async (pid, idx = 0) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/step?project_id=${encodeURIComponent(pid)}&step_index=${idx}`);
      const json = await res.json();
      if (json.project) {
        setProjectId(json.project.id);
        setProject(json.project);
      }
      setStep(json.step || null);
      setDone(Boolean(json.done));
      setSummary(json.summary || '');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { loadStep('', 0); }, [loadStep]);

  const submitAnswer = async () => {
    setLoading(true);
    try {
      const body = { project_id: projectId, step_index: step?.index || 0, answer: answer || freeText };
      const res = await fetch('/api/chat/answer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (json.project) setProject(json.project);
      if (json.step) {
        setStep(json.step);
        setAnswer('');
        setFreeText('');
      } else {
        setStep(null);
        setDone(true);
        setSummary(json.summary || '');
      }
    } finally {
      setLoading(false);
    }
  };

  const startOver = () => {
    setProjectId('');
    setStep(null);
    setProject(null);
    setDone(false);
    setSummary('');
    loadStep('', 0);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between">
        <div className="font-semibold">AI PPT 生成器</div>
        {projectId && <button onClick={startOver} className="text-sm text-slate-600">重新开始</button>}
      </header>
      <main className="flex-1 max-w-2xl w-full mx-auto p-6 space-y-4">
        {loading && <div className="text-sm text-slate-500">处理中...</div>}
        {!done && step && (
          <div className="bg-white border rounded p-4 space-y-3">
            <div className="text-sm text-slate-500">步骤 {step.index + 1}</div>
            <div className="text-slate-700 whitespace-pre-wrap">{step.question}</div>
            {step.options ? (
              <div className="flex flex-wrap gap-2">
                {step.options.map((opt) => (
                  <button key={opt} onClick={() => setAnswer(opt)} className={`px-3 py-2 rounded border text-sm ${answer === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white'}`}>{opt}</button>
                ))}
              </div>
            ) : (
              <textarea value={freeText} onChange={(e) => setFreeText(e.target.value)} className="w-full border rounded p-2 text-sm" rows={3} />
            )}
            <button onClick={submitAnswer} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">下一步</button>
          </div>
        )}
        {done && (
          <div className="bg-white border rounded p-4 space-y-3">
            <h2 className="text-lg font-semibold">信息确认</h2>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{summary}</p>
            <div className="flex gap-3">
              <Link to={`/project/${projectId}`} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">查看项目</Link>
              <Link to={`/payment/${projectId}`} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm">下载 PPT</Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
