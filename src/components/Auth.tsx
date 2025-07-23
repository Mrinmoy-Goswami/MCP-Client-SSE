import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
  const handleAuth = () => {
    window.location.href = "http://localhost:3000/auth";
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold mb-4">Welcome to MailMind AI</h1>
        <p className="text-gray-500 mb-6">Sign in to connect your Gmail</p>
        <button
          onClick={handleAuth}
          className="flex items-center justify-center gap-3 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          <FcGoogle size={20} />
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
}
