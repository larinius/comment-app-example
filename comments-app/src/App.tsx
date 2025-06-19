import { Auth } from "./components/auth/Auth";
import CommentsView from "./components/CommentsView";
import { NotificationBell } from "./components/NotificationBell";
import SubmitForm from "./components/SubmitForm";
import { AuthProvider } from "./context/AuthContext";
import { useCommentSubmission } from "./hooks/useCommentSubmission";

export default function App() {
  const { submitComment } = useCommentSubmission();

  const handleSubmit = async (text: string, file?: File) => {
    await submitComment(text, { file });
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <header className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Comments</h1>
            <div className="flex-1"></div>
            <NotificationBell />
            <Auth />
          </header>

          <SubmitForm onSubmit={handleSubmit} />

          <CommentsView />
        </div>
      </div>
    </AuthProvider>
  );
}
