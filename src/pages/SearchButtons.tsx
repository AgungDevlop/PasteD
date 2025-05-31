import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FaSearch } from "react-icons/fa";

// Array of random URLs
const RANDOM_URLS = [
  "https://obqj2.com/4/9397189",
];

// Interface for button data
interface ButtonData {
  buttonName: string;
  url: string;
}

// Interface for JSON data
interface FormData {
  id: string;
  buttons: ButtonData[];
}

const SearchButtons: React.FC = () => {
  const [data, setData] = useState<FormData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch raw JSON data from GitHub
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://raw.githubusercontent.com/AgungDevlop/JokiTugas/main/Data.json"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch data");
        }
        const jsonData = await response.json();
        setData(Array.isArray(jsonData) ? jsonData : [jsonData]);
        setLoading(false);
      } catch (err) {
        setError((err as Error).message);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter buttons based on search term
  const filteredData = data.map((item) => ({
    ...item,
    buttons: item.buttons.filter((button) =>
      button.buttonName.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  })).filter((item) => item.buttons.length > 0);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle button click
  const handleButtonClick = (url: string) => {
    sessionStorage.setItem("selectedUrl", url);
    window.open("/getlink", "_blank");
    
    setTimeout(() => {
    const randomUrl = RANDOM_URLS[Math.floor(Math.random() * RANDOM_URLS.length)];
    window.location.href = randomUrl;
  }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 text-gray-100 min-h-screen flex flex-col items-center bg-gray-900"
    >
      <div className="max-w-2xl w-full bg-gray-800 bg-opacity-80 backdrop-blur-md p-8 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-neon-blue">
        <h2 className="text-3xl font-bold text-center mb-8 text-neon-blue tracking-wide font-orbitron">
          Search Buttons
        </h2>

        {/* Search Input */}
        <div className="relative mb-6">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by button name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full p-3 pl-10 bg-gray-900 border border-gray-700 rounded-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-neon-blue font-orbitron"
          />
        </div>

        {/* Buttons Display */}
        {filteredData.length === 0 && (
          <p className="text-center text-gray-400 font-orbitron">
            No buttons found matching your search.
          </p>
        )}
        {filteredData.map((item) => (
          <div key={item.id} className="mb-6">
            <div className="grid gap-4">
              {item.buttons.map((button, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleButtonClick(button.url)}
                  whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(59,130,246,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="block bg-gray-700 hover:bg-gray-600 text-gray-100 py-3 px-4 rounded-lg text-center font-medium transition-colors font-orbitron border border-neon-blue"
                >
                  {button.buttonName}
                </motion.button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default SearchButtons;
