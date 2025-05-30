import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { FaPlay, FaAngleDoubleRight } from "react-icons/fa";

// Array of random URLs
const RANDOM_URLS = [
  "https://violent-error.com/bY3QV.0_Px3XpUvdb/m/VPJ-Z/DG0u2wMuzOkV0uNnTxgH2ELqTpYmzXOuTDQp1yO_DEcC",
];

const getRandomUrl = () => RANDOM_URLS[Math.floor(Math.random() * RANDOM_URLS.length)];

const GetLink: React.FC = () => {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Retrieve URL from sessionStorage or postMessage
  useEffect(() => {
    // Check sessionStorage first
    const storedUrl = sessionStorage.getItem("selectedUrl");
    if (storedUrl && storedUrl.startsWith("http")) {
      setSelectedUrl(storedUrl);
      setError(null);
      return;
    }

    // Listen for postMessage from parent tab
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== window.location.origin) return;
      if (event.data.type === "SET_SELECTED_URL" && event.data.url) {
        const url = event.data.url;
        if (url && typeof url === "string" && url.startsWith("http")) {
          // Store in sessionStorage of new tab
          sessionStorage.setItem("selectedUrl", url);
          setSelectedUrl(url);
          setError(null);
        } else {
          setError("Invalid URL received.");
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Handle GetLink button click
  const handleGetLinkClick = () => {
    if (selectedUrl) {
      window.open(selectedUrl, "_blank", "noopener,noreferrer");
      setTimeout(() => {
        window.location.href = getRandomUrl();
      }, 2000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 sm:p-6 text-gray-100 min-h-screen flex flex-col"
    >
      <div className="max-w-3xl mx-auto space-y-6 w-full">
        <div className="bg-gray-800 bg-opacity-80 backdrop-blur-md p-4 sm:p-6 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-neon-blue">
          <h3 className="text-xl sm:text-2xl font-bold mb-6 text-neon-blue tracking-wide font-orbitron">
            Watch on PasteDoods
          </h3>
          {error && (
            <p className="text-red-500 text-center mb-4 font-orbitron">{error}</p>
          )}
          {selectedUrl ? (
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(59,130,246,0.5)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleGetLinkClick}
              className="bg-gray-900 hover:bg-gray-800 text-gray-100 py-4 px-8 rounded-lg text-base transition-colors flex items-center justify-between w-full border border-neon-blue font-orbitron"
            >
              <div className="flex items-center gap-3">
                <FaPlay className="text-neon-blue text-xl" />
                <span>Watch</span>
              </div>
              <FaAngleDoubleRight className="text-neon-blue text-xl" />
            </motion.button>
          ) : (
            !error && <p className="text-gray-400 text-center font-orbitron">Loading...</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default GetLink;
