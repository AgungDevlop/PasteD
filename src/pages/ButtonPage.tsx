import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "react-router-dom";
import { FaPlay, FaAngleDoubleRight } from "react-icons/fa";

interface ButtonData {
  buttonName: string;
  url: string;
}

interface FormData {
  id: string;
  buttons: ButtonData[];
}

const GITHUB_RAW_URL = "https://raw.githubusercontent.com/AgungDevlop/JokiTugas/main/Data.json";

// Array of random URLs
const RANDOM_URLS = [
  "https://example.com",
  "https://example.org",
  "https://example.net",
  "https://placeholder.com",
];

const getRandomUrl = () => RANDOM_URLS[Math.floor(Math.random() * RANDOM_URLS.length)];

const ButtonPage: React.FC = () => {
  const [buttons, setButtons] = useState<ButtonData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { key } = useParams<{ key: string }>();

  // Fetch Data.json from GitHub raw URL
  useEffect(() => {
    const fetchButtons = async () => {
      try {
        const response = await fetch(GITHUB_RAW_URL);
        if (!response.ok) {
          throw new Error("Failed to fetch Data.json");
        }
        const data: FormData[] = await response.json();
        const matchedEntry = data.find((item) => item.id === key);
        if (!matchedEntry) {
          setError(`No buttons found for ID: ${key}`);
          setButtons([]);
        } else {
          setButtons(matchedEntry.buttons);
          setError(null);
        }
      } catch (err) {
        setError(`Error fetching data: ${(err as Error).message}`);
        setButtons([]);
      }
    };

    if (key) {
      fetchButtons();
    }
  }, [key]);

  // Handle button click
  const handleButtonClick = (url: string) => {
    if (!url || typeof url !== "string" || !url.startsWith("http")) {
      setError("Invalid URL provided");
      return;
    }
    // Store URL in sessionStorage
    sessionStorage.setItem("selectedUrl", url);
    // Open new tab
    const newTab = window.open("/getlink", "_blank");
    if (newTab) {
      // Send URL to new tab via postMessage
      setTimeout(() => {
        newTab.postMessage({ type: "SET_SELECTED_URL", url }, window.location.origin);
      }, 500); // Delay to ensure new tab is ready
    }
    // Redirect original tab after 2 seconds
    setTimeout(() => {
      window.location.href = getRandomUrl();
    }, 2000);
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
          {error && (
            <p className="text-red-500 text-center mb-4 font-orbitron">{error}</p>
          )}
          {buttons.length > 0 ? (
            <div className="flex flex-col gap-3">
              {buttons.map((button, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.02, boxShadow: "0 0 15px rgba(59,130,246,0.5)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleButtonClick(button.url)}
                  className="bg-gray-900 hover:bg-gray-800 text-gray-100 py-4 px-8 rounded-lg text-base transition-colors flex items-center justify-between w-full border border-neon-blue font-orbitron"
                >
                  <div className="flex items-center gap-3">
                    <FaPlay className="text-neon-blue text-xl" />
                    <span>{button.buttonName}</span>
                  </div>
                  <FaAngleDoubleRight className="text-neon-blue text-xl" />
                </motion.button>
              ))}
            </div>
          ) : (
            !error && <p className="text-gray-400 text-center font-orbitron">Loading buttons...</p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ButtonPage;