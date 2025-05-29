import { FaTimes } from "react-icons/fa";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg border border-green-600 max-w-md w-full relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          <FaTimes className="w-5 h-5" />
        </button>
        {children}
        <button
          onClick={onClose}
          className="mt-4 bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-md relative overflow-hidden group w-full"
        >
          <span className="absolute inset-0 border-2 border-transparent group-hover:border-gradient-to-r group-hover:from-green-400 group-hover:to-green-600 rounded-md" />
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;