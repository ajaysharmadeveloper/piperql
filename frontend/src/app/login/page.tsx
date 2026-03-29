import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center px-3 sm:p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 mb-4 shadow-lg shadow-blue-500/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary">PiperQL</h1>
          <p className="text-text-muted mt-1 text-sm">Chat with your databases using natural language</p>
        </div>
        <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5 sm:p-8 shadow-xl">
          <LoginForm />
        </div>
        <p className="text-center text-text-muted text-xs mt-6">Powered by LangGraph + OpenAI</p>
      </div>
    </div>
  );
}
