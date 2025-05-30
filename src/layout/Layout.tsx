import { motion } from "framer-motion";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-900 font-orbitron">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full p-4 bg-gray-950 bg-opacity-80 backdrop-blur-md text-neon-blue flex items-center justify-between z-50 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
        <div className="flex items-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-white">PasteJav</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 text-gray-100 pt-20 bg-gradient-to-b from-gray-900 to-gray-800">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto p-6"
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};

export default Layout;