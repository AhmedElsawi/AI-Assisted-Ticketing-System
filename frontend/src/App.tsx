import './App.css'

function App() {
  return (
    <main className="auth-shell">
      <header className="auth-topbar">
        <div className="brand-lockup">
          <div className="brand-mark">D</div>
          <div>
            <p className="brand-name">Deskflow</p>
            <p className="brand-subtitle">Support operations</p>
          </div>
        </div>
      </header>

      <section className="auth-stage">
        <div className="auth-frame">
          <div className="login-card">
            <div className="card-brand">
              <div className="card-brand-mark">D</div>
              <div>
                <p className="card-brand-name">Deskflow</p>
                <p className="card-brand-subtitle">Support operations platform</p>
              </div>
            </div>

            <p className="panel-label">Welcome back</p>
            <h1>Sign in to your workspace</h1>
            <p className="login-copy">
              Access your tickets, workflows, and role-specific dashboard.
            </p>

            <form className="login-form">
              <label className="field-group">
                <span>Email address</span>
                <input type="email" placeholder="user@company.com" />
              </label>

              <label className="field-group">
                <span>Password</span>
                <input type="password" placeholder="••••••••" />
              </label>

              <button className="primary-button" type="submit">
                Sign in
              </button>
            </form>

            <p className="auth-footnote">
              New here? <button className="inline-link" type="button">Create account</button>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
