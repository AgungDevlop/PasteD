import { motion } from "framer-motion";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full p-4 bg-green-600 text-white flex items-center justify-between z-50 shadow-lg">
        <div className="flex items-center">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Analisa Sentimen</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 text-gray-800 pt-20 bg-gradient-to-b from-white to-gray-200">
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