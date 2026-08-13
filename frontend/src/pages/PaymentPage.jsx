import React from 'react';
import { useParams, Link } from 'react-router-dom';

const METHOD_LABELS = {
  wechat: '微信支付',
  alipay: '支付宝',
  mock: '模拟支付',
};

export default function PaymentPage() {
  const { id } = useParams();

  const [loading, setLoading] = React.useState(true);
  const [paying, setPaying] = React.useState(false);
  const [error, setError] = React.useState('');

  const [price] = React.useState(9.9);
  const [availableMethods, setAvailableMethods] = React.useState([]);
  const [selectedMethod, setSelectedMethod] = React.useState('');

  const [paymentId, setPaymentId] = React.useState('');
  const [qrCode, setQrCode] = React.useState('');
  const [redirectUrl, setRedirectUrl] = React.useState('');
  const [paid, setPaid] = React.useState(false);
  const [expired, setExpired] = React.useState(false);
  const [countdown, setCountdown] = React.useState(0);

  const pollingRef = React.useRef(null);
  const countdownRef = React.useRef(null);

  // ─── Load available methods on mount ───────────────────

  React.useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const methodsRes = await fetch('/api/payments/methods');
        const methods = await methodsRes.json();
        if (cancelled) return;

        setAvailableMethods(methods);
        if (methods.length > 0) {
          setSelectedMethod(methods[0].method);
        }
      } catch {
        if (!cancelled) setError('加载支付信息失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // ─── Cleanup timers on unmount ─────────────────────────

  React.useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  // ─── Start payment ─────────────────────────────────────

  async function startPayment() {
    setPaying(true);
    setError('');

    try {
      const res = await fetch('/api/payments/create-async', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id, method: selectedMethod }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPaymentId(data.id);
      setQrCode(data.qr_code || '');
      setRedirectUrl(data.redirect_url || '');

      // Start 30-minute countdown
      setCountdown(30 * 60);
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setExpired(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Alipay redirect: open in new tab
      if (data.redirect_url) {
        window.open(data.redirect_url, '_blank');
      }

      // Start polling for payment status
      startPolling(data.id);
    } catch (e) {
      setError(e.message);
      setPaying(false);
    }
  }

  function startPolling(pid) {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/verify/${pid}`);
        const data = await res.json();

        if (data.status === 'paid') {
          setPaid(true);
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
        } else if (data.status === 'expired') {
          setExpired(true);
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
        }
      } catch {
        // ignore polling errors
      }
    }, 3000);
  }

  // ─── Mock: manual confirm ──────────────────────────────

  async function mockPay() {
    try {
      const res = await fetch(`/api/payments/confirm/${paymentId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'paid') {
        setPaid(true);
        clearInterval(pollingRef.current);
        clearInterval(countdownRef.current);
      }
    } catch (e) {
      setError(e.message);
    }
  }

  function download() {
    window.open(`/api/ppt/download/${id}`, '_blank');
  }

  function formatCountdown(s) {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // ─── Paid state ────────────────────────────────────────

  if (paid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-50 flex items-center justify-center p-4">
        <div className="bg-white border border-emerald-200 rounded-xl p-8 text-center space-y-4 shadow-lg max-w-sm w-full">
          <div className="text-5xl">🎉</div>
          <h2 className="text-xl font-bold text-emerald-800">支付成功</h2>
          <p className="text-sm text-slate-600">PPT 文件已就绪，点击下方按钮下载</p>
          <button onClick={download} className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition shadow">
            📥 下载 PPT
          </button>
          <Link to={`/project/${id}`} className="block text-sm text-slate-500 hover:text-slate-700">返回项目</Link>
        </div>
      </div>
    );
  }

  // ─── Expired state ─────────────────────────────────────

  if (expired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 max-w-sm w-full">
          <div className="text-5xl">⏰</div>
          <h2 className="text-xl font-bold text-slate-700">支付超时</h2>
          <p className="text-sm text-slate-500">订单已过期，请重新发起支付</p>
          <button onClick={() => { setExpired(false); setPaying(false); setPaymentId(''); setQrCode(''); }}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">
            重新支付
          </button>
          <Link to={`/project/${id}`} className="block text-sm text-slate-500">返回项目</Link>
        </div>
      </div>
    );
  }

  // ─── Loading state ─────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm">加载支付信息...</div>
      </div>
    );
  }

  // ─── Main payment UI ───────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-lg max-w-md w-full space-y-6">

        {/* Header */}
        <div className="text-center space-y-1">
          <h2 className="text-lg font-bold text-slate-800">付费下载 PPT</h2>
          <p className="text-sm text-slate-500">AI 已为您生成精美的幻灯片</p>
        </div>

        {/* Price */}
        <div className="text-center">
          <span className="text-3xl font-bold text-slate-800">¥{price.toFixed(2)}</span>
        </div>

        {/* Method selection */}
        {!paymentId && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 font-medium">选择支付方式</p>
            <div className="grid grid-cols-2 gap-2">
              {availableMethods.map((m) => (
                <button
                  key={m.method}
                  onClick={() => setSelectedMethod(m.method)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition ${
                    selectedMethod === m.method
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {m.method === 'wechat' && <span>💚</span>}
                  {m.method === 'alipay' && <span>💙</span>}
                  {m.method === 'mock' && <span>🧪</span>}
                  {m.label}
                </button>
              ))}
            </div>
            {availableMethods.length === 0 && (
              <p className="text-xs text-slate-400 text-center">暂无可用支付方式</p>
            )}
          </div>
        )}

        {/* QR Code */}
        {paymentId && qrCode && (
          <div className="text-center space-y-3">
            <div className="bg-white inline-block p-3 rounded-xl border border-slate-200 shadow-sm">
              <img src={qrCode} alt="支付二维码" className="w-56 h-56 mx-auto" />
            </div>
            <p className="text-sm text-slate-600 font-medium">
              请使用{METHOD_LABELS[selectedMethod] || '支付'}扫码支付
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              等待支付 · <span className="font-mono">{formatCountdown(countdown)}</span>
            </div>
          </div>
        )}

        {/* Redirect info (Alipay page pay) */}
        {paymentId && !qrCode && redirectUrl && (
          <div className="text-center space-y-3">
            <div className="text-5xl">💙</div>
            <p className="text-sm text-slate-600">支付宝支付页面已在新窗口打开</p>
            <p className="text-xs text-slate-400">
              如未打开，请<a href={redirectUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline mx-1">点击这里</a>
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              等待支付完成 · <span className="font-mono">{formatCountdown(countdown)}</span>
            </div>
          </div>
        )}

        {/* Mock: manual confirm button */}
        {paymentId && selectedMethod === 'mock' && (
          <div className="text-center space-y-2">
            <div className="bg-slate-100 rounded-lg p-4">
              <p className="text-xs text-slate-500 mb-3">🧪 开发模式 — 模拟支付</p>
              <button onClick={mockPay} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition">
                模拟支付成功
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Pay button */}
        {!paymentId && (
          <button
            onClick={startPayment}
            disabled={!selectedMethod || paying}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow"
          >
            {paying ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                创建订单中...
              </span>
            ) : (
              '立即支付'
            )}
          </button>
        )}

        {paymentId && selectedMethod !== 'mock' && (
          <p className="text-xs text-slate-400 text-center">支付成功后页面将自动更新</p>
        )}

        <div className="text-center">
          <Link to={`/project/${id}`} className="text-sm text-slate-500 hover:text-slate-700">返回项目</Link>
        </div>
      </div>
    </div>
  );
}
