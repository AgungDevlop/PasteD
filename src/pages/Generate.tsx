import { useState, useCallback } from "react";
import { FaTag, FaLink, FaTrash, FaCopy } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../components/Modal";
import AnimatedInput from "../components/AnimatedInput";

// API URL for fetching GitHub token
const GITHUB_TOKEN_URL = "https://skinml.agungbot.my.id/";

// Interface for button data
interface ButtonData {
  buttonName: string;
  url: string;
}

// Interface for form data
interface FormData {
  id: string;
  buttons: ButtonData[];
}

const Generate: React.FC = () => {
  const [forms, setForms] = useState<Array<{ buttonName: string; url: string }>>([{ buttonName: "", url: "" }]);
  const [errors, setErrors] = useState<Array<{ buttonName?: string; url?: string }>>([{}]);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "" | "loading" | "success" | "error";
    message: string;
    generatedId?: string;
  }>({
    isOpen: false,
    type: "",
    message: "",
  });
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  // Generate random 10-character ID
  const generateRandomId = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 10; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

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

  // Fetch existing Data.json from GitHub
  const fetchDataJson = useCallback(async (token: string): Promise<FormData[]> => {
    try {
      const response = await fetch(
        "https://api.github.com/repos/AgungDevlop/JokiTugas/contents/Data.json",
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (!response.ok && response.status !== 404) {
        throw new Error("Failed to fetch Data.json");
      }
      if (response.status === 404) {
        return [];
      }
      const data = await response.json();
      const content = JSON.parse(atob(data.content));
      return Array.isArray(content) ? content : [content];
    } catch (error) {
      throw new Error(`Error fetching Data.json: ${(error as Error).message}`);
    }
  }, []);

  // Push updated Data.json to GitHub
  const pushDataJson = useCallback(async (token: string, newData: FormData[], sha?: string) => {
    try {
      const content = JSON.stringify(newData, null, 2);
      const response = await fetch(
        "https://api.github.com/repos/AgungDevlop/JokiTugas/contents/Data.json",
        {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            message: "Update Data.json with new buttons",
            content: btoa(content),
            sha,
          }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update Data.json");
      }
    } catch (error) {
      throw new Error(`Error pushing Data.json: ${(error as Error).message}`);
    }
  }, []);

  // Handle form input change
  const handleInputChange = (index: number, field: "buttonName" | "url", value: string) => {
    const newForms = [...forms];
    newForms[index][field] = value;
    setForms(newForms);

    const newErrors = [...errors];
    newErrors[index] = { ...newErrors[index], [field]: undefined };
    setErrors(newErrors);
  };

  // Add new form
  const addNewForm = () => {
    setForms([...forms, { buttonName: "", url: "" }]);
    setErrors([...errors, {}]);
  };

  // Remove form
  const removeForm = (index: number) => {
    setForms(forms.filter((_, i) => i !== index));
    setErrors(errors.filter((_, i) => i !== index));
  };

  // Copy URL to clipboard
  const copyToClipboard = (id: string) => {
    const url = `https://${window.location.hostname}/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopyStatus(`Copied ${url}`);
      setTimeout(() => setCopyStatus(null), 2000);
    }).catch(() => {
      setCopyStatus("Failed to copy URL");
      setTimeout(() => setCopyStatus(null), 2000);
    });
  };

  // Handle submit
  const handleSubmit = useCallback(async () => {
    const newErrors: Array<{ buttonName?: string; url?: string }> = forms.map(() => ({}));
    let hasError = false;

    forms.forEach((form, index) => {
      if (!form.buttonName.trim()) {
        newErrors[index].buttonName = "Button Name is required";
        hasError = true;
      }
      if (!form.url.trim()) {
        newErrors[index].url = "URL is required";
        hasError = true;
      }
    });

    if (hasError) {
      setErrors(newErrors);
      setModalState({
        isOpen: true,
        type: "error",
        message: "Please fill in all required fields",
      });
      return;
    }

    setModalState({ isOpen: true, type: "loading", message: "Submitting data..." });
    setErrors(forms.map(() => ({})));

    try {
      const token = await fetchGitHubToken();
      const existingData = await fetchDataJson(token);

      const newId = generateRandomId();
      const newEntry: FormData = {
        id: newId,
        buttons: forms.map((form) => ({
          buttonName: form.buttonName,
          url: form.url,
        })),
      };

      const updatedData = [...existingData, newEntry];

      const response = await fetch(
        "https://api.github.com/repos/AgungDevlop/JokiTugas/contents/Data.json",
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      const sha = response.ok ? (await response.json()).sha : undefined;

      await pushDataJson(token, updatedData, sha);

      setModalState({
        isOpen: true,
        type: "success",
        message: "Data successfully submitted!",
        generatedId: newId,
      });
      setForms([{ buttonName: "", url: "" }]);
      setErrors([{}]);
    } catch (error) {
      setModalState({
        isOpen: true,
        type: "error",
        message: `Error: ${(error as Error).message}`,
      });
    }
  }, [forms, fetchGitHubToken, fetchDataJson, pushDataJson]);

  // Close modal
  const closeModal = () => {
    setModalState({ isOpen: false, type: "", message: "", generatedId: undefined });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-6 text-gray-100 min-h-screen flex items-center justify-center"
    >
      <div className="max-w-lg w-full bg-gray-800 bg-opacity-80 backdrop-blur-md p-8 rounded-xl shadow-[0_0_20px_rgba(59,130,246,0.3)] border border-neon-blue">
        <h2 className="text-3xl font-bold text-center mb-8 text-neon-blue tracking-wide font-orbitron">Generate PasteDoods Links</h2>

        <AnimatePresence>
          {forms.map((form, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 bg-gray-900 bg-opacity-50 p-6 rounded-lg mb-4 border border-gray-700 shadow-sm"
            >
              <AnimatedInput
                icon={FaTag}
                placeholder="Button Name"
                onChange={(e) => handleInputChange(index, "buttonName", e.target.value)}
                value={form.buttonName}
                error={errors[index].buttonName}
                type="text"
              />
              <AnimatedInput
                icon={FaLink}
                placeholder="URL"
                onChange={(e) => handleInputChange(index, "url", e.target.value)}
                value={form.url}
                error={errors[index].url}
                type="text"
              />
              {forms.length > 1 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => removeForm(index)}
                  className="flex items-center text-sm bg-red-900 bg-opacity-50 text-red-400 hover:bg-red-800 hover:bg-opacity-50 py-2 px-4 rounded-md transition-colors"
                >
                  <FaTrash className="mr-2" /> Remove
                </motion.button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="space-y-4 mt-6">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(59,130,246,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={addNewForm}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 py-3 px-4 rounded-lg font-medium transition-colors font-orbitron"
          >
            Add Another Button
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 15px rgba(59,130,246,0.5)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSubmit}
            className="w-full bg-gray-700 hover:bg-gray-600 text-gray-100 py-3 px-4 rounded-lg font-bold transition-colors disabled:opacity-50 font-orbitron border border-neon-blue z-10"
            disabled={modalState.type === "loading"}
          >
            Submit
          </motion.button>
        </div>

        <Modal isOpen={modalState.isOpen} onClose={closeModal}>
          <div className="text-center">
            {modalState.type === "loading" && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-blue mx-auto mb-4"></div>
                <p className="text-gray-100 font-orbitron">{modalState.message}</p>
              </>
            )}
            {modalState.type === "success" && (
              <>
                <div className="text-neon-blue text-4xl mb-4">✔</div>
                <p className="text-gray-100 font-medium font-orbitron">{modalState.message}</p>
                {modalState.generatedId && (
                  <div className="mt-4 space-y-2">
                    <p className="text-gray-300 font-orbitron">Generated Link:</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`https://${window.location.hostname}/${modalState.generatedId}`}
                        readOnly
                        className="w-full p-2 bg-gray-900 border border-gray-700 rounded-md text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue font-orbitron"
                      />
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => modalState.generatedId && copyToClipboard(modalState.generatedId)}
                        className="bg-neon-blue hover:bg-blue-600 text-gray-900 p-2 rounded-md"
                      >
                        <FaCopy />
                      </motion.button>
                    </div>
                    {copyStatus && (
                      <p className="text-neon-blue text-sm mt-2 font-orbitron">{copyStatus}</p>
                    )}
                  </div>
                )}
              </>
            )}
            {modalState.type === "error" && (
              <>
                <div className="text-red-500 text-4xl mb-4">✖</div>
                <p className="text-gray-100 font-orbitron">{modalState.message}</p>
              </>
            )}
          </div>
        </Modal>
      </div>
    </motion.div>
  );
};

export default Generate;