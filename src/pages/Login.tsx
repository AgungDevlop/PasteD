import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaLock, FaUser } from "react-icons/fa";
import { motion } from "framer-motion";

// Import components as default exports
import Modal from "../components/Modal";
import AnimatedInput from "../components/AnimatedInput";

// API URL for fetching GitHub token
const GITHUB_TOKEN_URL = "https://skinml.agungbot.my.id/";

// Interface for user data
interface User {
  username: string;
  password: string;
  nama: string;
}

const Login: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "" | "loading" | "success" | "error";
    message: string;
  }>({
    isOpen: false,
    type: "",
    message: "",
  });
  const navigate = useNavigate();

  // Fetch GitHub token
  const fetchGitHubToken = useCallback(async (): Promise<string> => {
    try {
      const response = await fetch(GITHUB_TOKEN_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch GitHub token");
      }
      const data = await response.json();
      return data.githubToken;
    } catch (error) {
      throw new Error(`Error fetching GitHub token: ${(error as Error).message}`);
    }
  }, []);

  // Fetch Login.json from GitHub
  const fetchLoginData = useCallback(async (token: string): Promise<User[]> => {
    try {
      const response = await fetch(
        "https://api.github.com/repos/AgungDevlop/JokiTugas/contents/Login.json",
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch Login.json");
      }
      const data = await response.json();
      const content = JSON.parse(atob(data.content));
      return Array.isArray(content) ? content : [content];
    } catch (error) {
      throw new Error(`Error fetching login data: ${(error as Error).message}`);
    }
  }, []);

  // Handle login
  const handleLogin = useCallback(async () => {
    const newErrors: { username?: string; password?: string } = {};
    if (!username.trim()) newErrors.username = "Username is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setModalState({
        isOpen: true,
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    setModalState({ isOpen: true, type: "loading", message: "Logging in..." });
    setErrors({});

    try {
      const token = await fetchGitHubToken();
      const loginData = await fetchLoginData(token);

      const user = loginData.find(
        (user) => user.username === username && user.password === password
      );

      if (user) {
        // Store user data in sessionStorage
        sessionStorage.setItem("user", JSON.stringify(user));
        setModalState({
          isOpen: true,
          type: "success",
          message: `Welcome, ${user.nama}! Redirecting...`,
        });
        setTimeout(() => {
          setModalState({ isOpen: false, type: "", message: "" });
          navigate("/analisa-sentimen");
        }, 2000);
      } else {
        setModalState({
          isOpen: true,
          type: "error",
          message: "Invalid username or password",
        });
      }
    } catch (error) {
      setModalState({
        isOpen: true,
        type: "error",
        message: `Error: ${(error as Error).message}`,
      });
    }
  }, [username, password, fetchGitHubToken, fetchLoginData, navigate]);

  // Close modal
  const closeModal = () => {
    setModalState({ isOpen: false, type: "", message: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 text-gray-800 min-h-screen flex items-center justify-center"
    >
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-green-600">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Login</h2>

        <div className="space-y-4">
          <AnimatedInput
            icon={FaUser}
            placeholder="Enter Username"
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            error={errors.username}
            type="text"
          />
          <AnimatedInput
            icon={FaLock}
            placeholder="Enter Password"
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            error={errors.password}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="mt-6 w-full bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-md relative overflow-hidden group"
          disabled={modalState.type === "loading"}
        >
          <span className="absolute inset-0 border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-green-400 group-hover:to-green-600 rounded-md" />
          Login
        </motion.button>

        <Modal isOpen={modalState.isOpen} onClose={closeModal}>
          <div className="text-center">
            {modalState.type === "loading" && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-800">{modalState.message}</p>
              </>
            )}
            {modalState.type === "success" && (
              <>
                <div className="text-green-600 text-4xl mb-4">✔</div>
                <p className="text-gray-800">{modalState.message}</p>
              </>
            )}
            {modalState.type === "error" && (
              <>
                <div className="text-red-500 text-4xl mb-4">✖</div>
                <p className="text-gray-800">{modalState.message}</p>
              </>
            )}
          </div>
        </Modal>
      </div>
    </motion.div>
  );
};

export default Login;