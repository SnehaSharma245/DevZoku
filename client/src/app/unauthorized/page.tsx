"use client";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold text-red-600 mb-4">Unauthorized</h1>
      <p className="text-lg text-gray-700 mb-6">
        You do not have permission to access this page.
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
      >
        Go to Home
      </a>
    </div>
  );
}
