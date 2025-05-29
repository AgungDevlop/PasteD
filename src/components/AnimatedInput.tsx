import { ChangeEvent } from "react";
import { IconType } from "react-icons";
import { motion } from "framer-motion";

interface AnimatedInputProps {
  icon: IconType;
  placeholder: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  value?: string;
  error?: string;
}

const AnimatedInput: React.FC<AnimatedInputProps> = ({
  icon: Icon,
  placeholder,
  onChange,
  type = "text",
  value,
  error,
}) => (
  <motion.div
    initial={{ y: 20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    transition={{ duration: 0.5, ease: "easeOut" }}
    className="relative"
  >
    <div className="relative group">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-green-600" />
      <input
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        className={`w-full pl-10 pr-4 py-2 bg-gray-100 text-gray-800 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 transition-all duration-300 ${
          error
            ? "border-red-500"
            : "border-gradient-to-r from-green-400 to-green-600 group-hover:shadow-[0_0_10px_rgba(34,197,94,0.5)]"
        }`}
      />
    </div>
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </motion.div>
);

export default AnimatedInput;