"use client";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-xl mb-6">
        <span className="text-white text-3xl font-bold">!</span>
      </div>
      <h1 className="text-3xl font-extrabold text-[#FF6F61] mb-4">
        Unauthorized
      </h1>
      <p className="text-lg text-[#6B7A8F] mb-6">
        You do not have permission to access this page.
      </p>
      <a
        href="/"
        className="px-6 py-2 bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-semibold rounded-full hover:opacity-90 transition shadow"
      >
        Go to Home
      </a>
    </div>
  );
}
