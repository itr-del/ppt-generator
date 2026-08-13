export default function AdminLoginPage() {
  const [username, setUsername] = React.useState('admin');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include',
    });
    if (res.ok) navigate('/admin');
    else setError('登录失败');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <form onSubmit={submit} className="bg-white border rounded p-6 w-full max-w-sm space-y-3">
        <h1 className="text-lg font-semibold">运营后台登录</h1>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="用户名" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="密码" />
        <button type="submit" className="w-full px-3 py-2 bg-slate-900 text-white rounded text-sm">登录</button>
      </form>
    </div>
  );
}
