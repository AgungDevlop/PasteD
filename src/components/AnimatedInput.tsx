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
    initial={{ y: 20, opacity: 0, scale: 0.95 }}
    animate={{ y: 0, opacity: 1, scale: 1 }}
    transition={{ duration: 0.4, type: "spring", stiffness: 100 }}
    className="relative"
  >
    <div className="relative group">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-neon-blue text-lg" />
      <input
        type={type}
        placeholder={placeholder}
        onChange={onChange}
        value={value}
        className={`w-full pl-10 pr-4 py-2.5 bg-gray-900 text-gray-100 border-2 rounded-lg font-orbitron text-sm focus:outline-none focus:ring-2 focus:ring-neon-blue placeholder-gray-500 transition-all duration-300 ${
          error
            ? "border-red-500"
            : "border-gray-700 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.3)]"
        }`}
      />
    </div>
    {error && <p className="text-red-500 text-xs mt-1 font-orbitron">{error}</p>}
  </motion.div>
);

export default AnimatedInput;