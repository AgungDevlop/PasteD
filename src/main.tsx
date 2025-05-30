import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { RouterProvider, createBrowserRouter, useRouteError } from "react-router-dom";
import Generate from "./pages/Generate";
import ButtonPage from "./pages/ButtonPage";
import GetLink from "./pages/GetLink";
import ErrorBoundary from "./components/ErrorBoundary";

// ErrorFallback component with proper typing
interface ErrorFallbackProps {
  error?: Error | null;
  errorInfo?: React.ErrorInfo | null;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo }) => {
  const routeError = useRouteError() as Error | undefined;
  const displayError = error || routeError;

  return (
    <div className="text-center text-red-500 p-4 min-h-screen flex flex-col justify-center items-center bg-gray-900">
      <h1 className="text-2xl font-bold mb-2">Terjadi Kesalahan</h1>
      <p className="mb-2">
        {displayError?.message || "Maaf, terjadi kesalahan yang tidak terduga."}
      </p>
      {displayError && (
        <div className="text-left bg-gray-100 p-4 rounded text-black mb-4 max-w-2xl mx-auto">
          <p className="font-bold">Detail Error:</p>
          <pre className="whitespace-pre-wrap">{displayError.toString()}</pre>
          {errorInfo && (
            <>
              <p className="font-bold mt-2">Stack Trace:</p>
              <pre className="whitespace-pre-wrap">{errorInfo.componentStack}</pre>
            </>
          )}
        </div>
      )}
      <button
        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font font-bold py-2 px-4 rounded"
        onClick={() => window.location.reload()}
      >
        Muat Ulang Halaman
      </button>
    </div>
  );
};

// Define the router
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <ErrorFallback />,
    children: [
      {
        index: true,
        element: <Generate />,
        errorElement: <ErrorFallback />,
      },
      {
        path: ":key",
        element: <ButtonPage />,
        errorElement: <ErrorFallback />,
      },
      {
        path: "getlink",
        element: <GetLink />,
        errorElement: <ErrorFallback />,
      },
    ],
  },
]);

// Render the app
createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error: Error, errorInfo: React.ErrorInfo) => {
        console.error("Error caught by ErrorBoundary:", error, errorInfo);
      }}
    >
      <RouterProvider router={router} />
    </ErrorBoundary>
  </React.StrictMode>
);