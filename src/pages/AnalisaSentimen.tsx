import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaUser, FaUpload, FaDownload, FaRedo, FaSearch, FaSort, FaSignOutAlt } from "react-icons/fa";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

interface User {
  username: string;
  nama: string;
}

interface SentimentData {
  ulasan: string;
  rating: number;
  kategori: string;
  namaProduk: string;
  sentiment: string;
}

const GITHUB_TOKEN_URL = "https://skinml.agungbot.my.id/";
const GITHUB_REPO = "AgungDevlop/JokiTugas";
const GITHUB_PATH = "Data";
const ROWS_PER_PAGE = 10;

const AnalisaSentimen: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<SentimentData[]>([]);
  const [filteredData, setFilteredData] = useState<SentimentData[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    type: "" | "loading" | "success" | "error";
    message: string;
  }>({ type: "", message: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<keyof SentimentData | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState<{
    kategori: string;
    namaProduk: string;
    sentiment: string;
  }>({ kategori: "", namaProduk: "", sentiment: "" });
  const [githubToken, setGithubToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Retrieve user from sessionStorage
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/");
    }
  }, [navigate]);

  // Fetch and cache GitHub token
  const fetchGitHubToken = useCallback(async (): Promise<string> => {
    if (githubToken) return githubToken;
    try {
      const response = await fetch(GITHUB_TOKEN_URL);
      if (!response.ok) throw new Error("Failed to fetch GitHub token");
      const data = await response.json();
      setGithubToken(data.githubToken);
      return data.githubToken;
    } catch (error) {
      throw new Error(`Error fetching GitHub token: ${(error as Error).message}`);
    }
  }, [githubToken]);

  // Parse CSV data
  const parseCSV = (content: string): SentimentData[] => {
    const rows = content.split("\n").map((row) => row.trim()).filter((row) => row);
    if (rows.length < 1) return [];
    const headers = rows[0].split(",").map((header) => header.trim());
    const ulasanIndex = headers.indexOf("Ulasan");
    const ratingIndex = headers.indexOf("Rating");
    const kategoriIndex = headers.indexOf("Kategori");
    const namaProdukIndex = headers.indexOf("Nama Produk");
    const labelIndex = headers.indexOf("label");
    if (
      ulasanIndex === -1 ||
      ratingIndex === -1 ||
      kategoriIndex === -1 ||
      namaProdukIndex === -1 ||
      labelIndex === -1
    )
      return [];
    return rows.slice(1).map((row) => {
      const cols = row.split(",").map((col) => col.trim());
      return {
        ulasan: cols[ulasanIndex] || "",
        rating: parseInt(cols[ratingIndex]) || 0,
        kategori: cols[kategoriIndex] || "",
        namaProduk: cols[namaProdukIndex] || "",
        sentiment: cols[labelIndex] === "1" ? "Positive" : "Negative",
      };
    });
  };

  // Delete file from GitHub
  const deleteFromGitHub = async (fileName: string, token: string): Promise<void> => {
    try {
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}/${fileName}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (!getFileResponse.ok) {
        if (getFileResponse.status === 404) return;
        throw new Error("Failed to fetch file SHA");
      }
      const fileData = await getFileResponse.json();
      const sha = fileData.sha;

      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}/${fileName}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github.v3+json",
          },
          body: JSON.stringify({
            message: `Delete ${fileName} after processing`,
            sha,
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to delete file from GitHub");
    } catch (error) {
      console.error(`Error deleting file: ${(error as Error).message}`);
    }
  };

  // Upload file to GitHub
  const uploadToGitHub = async (file: File): Promise<void> => {
    setUploadStatus({ type: "loading", message: "Processing file..." });
    try {
      const token = await fetchGitHubToken();
      const reader = new FileReader();
      reader.onload = async () => {
        const content = btoa(reader.result as string);
        const response = await fetch(
          `https://api.github.com/repos/${GITHUB_REPO}/contents/${GITHUB_PATH}/${file.name}`,
          {
            method: "PUT",
            headers: {
              Authorization: `token ${token}`,
              Accept: "application/vnd.github.v3+json",
            },
            body: JSON.stringify({
              message: `Upload ${file.name}`,
              content,
            }),
          }
        );
        if (!response.ok) throw new Error("Failed to upload file to GitHub");
        const text = await file.text();
        const parsedData = parseCSV(text);
        if (parsedData.length === 0) {
          throw new Error("No valid data found in CSV");
        }
        setData(parsedData);
        setFilteredData(parsedData);
        setUploadStatus({ type: "success", message: "File processed successfully!" });
        await deleteFromGitHub(file.name, token);
      };
      reader.readAsBinaryString(file);
    } catch (error) {
      setUploadStatus({
        type: "error",
        message: `Error processing file: ${(error as Error).message}`,
      });
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      uploadToGitHub(selectedFile);
    } else {
      setUploadStatus({ type: "error", message: "Please upload a valid CSV file" });
    }
  };

  // Handle drag-and-drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
      uploadToGitHub(droppedFile);
    } else {
      setUploadStatus({ type: "error", message: "Please upload a valid CSV file" });
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Apply filters, search, and sorting
  useEffect(() => {
    let result = [...data];
    if (filters.kategori) {
      result = result.filter((item) => item.kategori === filters.kategori);
    }
    if (filters.namaProduk) {
      result = result.filter((item) => item.namaProduk === filters.namaProduk);
    }
    if (filters.sentiment) {
      result = result.filter((item) => item.sentiment === filters.sentiment);
    }
    if (searchQuery) {
      result = result.filter((item) =>
        item.ulasan.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sortKey) {
      result = result.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    setFilteredData(result);
    setCurrentPage(1);
  }, [filters, searchQuery, sortKey, sortOrder, data]);

  // Get unique filter options
  const uniqueKategori = [...new Set(data.map((item) => item.kategori))];
  const uniqueNamaProduk = [...new Set(data.map((item) => item.namaProduk))];
  const uniqueSentiment = ["Positive", "Negative"];

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const paginatedData = filteredData.slice(startIndex, startIndex + ROWS_PER_PAGE);

  // Handle filter change
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    filterKey: keyof typeof filters
  ) => {
    setFilters((prev) => ({ ...prev, [filterKey]: e.target.value }));
  };

  // Handle search change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle sort
  const handleSort = (key: keyof SentimentData) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ kategori: "", namaProduk: "", sentiment: "" });
    setSearchQuery("");
    setSortKey(null);
    setSortOrder("asc");
  };

  // Download filtered data as CSV
  const downloadCSV = () => {
    const headers = ["Ulasan", "Rating", "Kategori", "Nama Produk", "Sentiment"];
    const csvRows = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          `"${row.ulasan.replace(/"/g, '""')}"`,
          row.rating,
          row.kategori,
          row.namaProduk,
          row.sentiment,
        ].join(",")
      ),
    ];
    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sentiment_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart data for sentiment distribution
  const sentimentCounts = filteredData.reduce(
    (acc, curr) => {
      const sentiment = curr.sentiment.toLowerCase();
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    },
    { positive: 0, negative: 0 } as Record<string, number>
  );

  const barChartData = {
    labels: ["Positive", "Negative"],
    datasets: [
      {
        label: "Sentiment Distribution",
        data: [sentimentCounts.positive, sentimentCounts.negative],
        backgroundColor: ["#22C55E", "#EF4444"],
        borderColor: ["#16A34A", "#DC2626"],
        borderWidth: 1,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Sentiment Distribution" },
    },
    maintainAspectRatio: false,
  };

  const pieChartData = {
    labels: ["Positive", "Negative"],
    datasets: [
      {
        data: [sentimentCounts.positive, sentimentCounts.negative],
        backgroundColor: ["#22C55E", "#EF4444"],
        borderColor: ["#16A34A", "#DC2626"],
        borderWidth: 1,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Sentiment Proportions" },
    },
    maintainAspectRatio: false,
  };

  // Rating distribution chart
  const ratingCounts = filteredData.reduce(
    (acc, curr) => {
      acc[curr.rating] = (acc[curr.rating] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  const ratingChartData = {
    labels: [1, 2, 3, 4, 5],
    datasets: [
      {
        label: "Rating Distribution",
        data: [1, 2, 3, 4, 5].map((rating) => ratingCounts[rating] || 0),
        backgroundColor: "#22C55E",
        borderColor: "#16A34A",
        borderWidth: 1,
      },
    ],
  };

  const ratingChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" as const },
      title: { display: true, text: "Rating Distribution" },
    },
    maintainAspectRatio: false,
  };

  // Summary statistics
  const totalReviews = filteredData.length;
  const averageRating =
    filteredData.length > 0
      ? (
          filteredData.reduce((sum, item) => sum + item.rating, 0) / filteredData.length
        ).toFixed(2)
      : "0.00";

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto p-4 sm:p-6 text-gray-800 min-h-screen flex flex-col bg-gray-50"
    >
      <div className="max-w-full mx-auto space-y-6">
        {/* Profile Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <FaUser className="text-green-600 text-3xl sm:text-4xl" />
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
                Welcome, {user.nama}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base">Username: {user.username}</p>
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem("user");
              navigate("/");
            }}
            className="mt-4 sm:mt-0 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-md flex items-center text-sm sm:text-base transition-colors"
          >
            <FaSignOutAlt className="mr-2" /> Logout
          </button>
        </div>

        {/* Upload Section */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            Upload Sentiment Data
          </h3>
          <div
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging ? "border-green-600 bg-green-50" : "border-gray-300 hover:bg-gray-50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            <FaUpload className="mx-auto text-green-600 text-3xl sm:text-4xl mb-4" />
            <p className="text-gray-600 text-sm sm:text-base">
              {file ? file.name : "Drag & drop a CSV file here or click to upload"}
            </p>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {uploadStatus.message && (
            <p
              className={`mt-4 text-center text-sm sm:text-base ${
                uploadStatus.type === "error"
                  ? "text-red-500"
                  : uploadStatus.type === "success"
                  ? "text-green-600"
                  : "text-gray-600"
              }`}
            >
              {uploadStatus.message}
            </p>
          )}
        </div>

        {/* Search and Filters */}
        {data.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Filter & Search</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Ulasan..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="w-full p-2 border border-gray-300 rounded-md text-gray-800 text-sm sm:text-base focus:ring-2 focus:ring-green-500 pl-10 transition-all"
                />
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              <select
                value={filters.kategori}
                onChange={(e) => handleFilterChange(e, "kategori")}
                className="p-2 border border-gray-300 rounded-md text-gray-800 text-sm sm:text-base focus:ring-2 focus:ring-green-500 transition-all"
              >
                <option value="">All Kategori</option>
                {uniqueKategori.map((kat) => (
                  <option key={kat} value={kat}>
                    {kat}
                  </option>
                ))}
              </select>
              <select
                value={filters.namaProduk}
                onChange={(e) => handleFilterChange(e, "namaProduk")}
                className="p-2 border border-gray-300 rounded-md text-gray-800 text-sm sm:text-base focus:ring-2 focus:ring-green-500 transition-all"
              >
                <option value="">All Products</option>
                {uniqueNamaProduk.map((prod) => (
                  <option key={prod} value={prod}>
                    {prod}
                  </option>
                ))}
              </select>
              <select
                value={filters.sentiment}
                onChange={(e) => handleFilterChange(e, "sentiment")}
                className="p-2 border border-gray-300 rounded-md text-gray-800 text-sm sm:text-base focus:ring-2 focus:ring-green-500 transition-all"
              >
                <option value="">All Sentiments</option>
                {uniqueSentiment.map((sent) => (
                  <option key={sent} value={sent}>
                    {sent}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={resetFilters}
                className="flex items-center justify-center bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-md text-sm sm:text-base transition-colors"
              >
                <FaRedo className="mr-2" /> Reset
              </button>
              <button
                onClick={downloadCSV}
                className="flex items-center justify-center bg-green-600 hover:bg-green-500 text-white py-2 px-4 rounded-md text-sm sm:text-base transition-colors"
              >
                <FaDownload className="mr-2" /> Download CSV
              </button>
            </div>
          </div>
        )}

        {/* Summary Statistics */}
        {filteredData.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800">Total Reviews</h4>
              <p className="text-2xl font-bold text-green-600">{totalReviews}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800">Average Rating</h4>
              <p className="text-2xl font-bold text-green-600">{averageRating}</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-200 text-center">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800">Sentiment Breakdown</h4>
              <p className="text-sm sm:text-base text-gray-600">
                {sentimentCounts.positive} Positive, {sentimentCounts.negative} Negative
              </p>
            </div>
          </div>
        )}

        {/* Data Table */}
        {filteredData.length > 0 && (
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Uploaded Data</h3>
            <table className="w-full text-left border-collapse text-sm sm:text-base">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 sm:p-3 text-gray-800 font-semibold border-b border-gray-300">
                    Ulasan
                  </th>
                  <th className="p-2 sm:p-3 text-gray-800 font-semibold border-b border-gray-300 cursor-pointer" onClick={() => handleSort("rating")}>
                    Rating {sortKey === "rating" && (sortOrder === "asc" ? <FaSort className="inline" /> : <FaSort className="inline rotate-180" />)}
                  </th>
                  <th className="p-2 sm:p-3 text-gray-800 font-semibold border-b border-gray-300">
                    Kategori
                  </th>
                  <th className="p-2 sm:p-3 text-gray-800 font-semibold border-b border-gray-300">
                    Nama Produk
                  </th>
                  <th className="p-2 sm:p-3 text-gray-800 font-semibold border-b border-gray-300 cursor-pointer" onClick={() => handleSort("sentiment")}>
                    Sentiment {sortKey === "sentiment" && (sortOrder === "asc" ? <FaSort className="inline" /> : <FaSort className="inline rotate-180" />)}
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-2 sm:p-3 border-b border-gray-300 text-gray-600">{row.ulasan}</td>
                    <td className="p-2 sm:p-3 border-b border-gray-300 text-gray-600">{row.rating}</td>
                    <td className="p-2 sm:p-3 border-b border-gray-300 text-gray-600">{row.kategori}</td>
                    <td className="p-2 sm:p-3 border-b border-gray-300 text-gray-600">{row.namaProduk}</td>
                    <td className="p-2 sm:p-3 border-b border-gray-300 text-gray-600">{row.sentiment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-4 space-x-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="text-green-600 hover:text-green-500 disabled:text-gray-400 text-sm sm:text-base transition-colors"
                >
                  &lt; Prev
                </button>
                {totalPages <= 5 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-full text-sm sm:text-base transition-colors ${
                        currentPage === page
                          ? "bg-green-600 text-white"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className={`w-8 h-8 rounded-full text-sm sm:text-base transition-colors ${
                        currentPage === 1 ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      1
                    </button>
                    {currentPage > 3 && <span className="text-gray-600">...</span>}
                    {Array.from({ length: 3 }, (_, i) => {
                      const page = currentPage - 1 + i;
                      return page > 1 && page < totalPages ? page : null;
                    })
                      .filter((page) => page !== null)
                      .map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page!)}
                          className={`w-8 h-8 rounded-full text-sm sm:text-base transition-colors ${
                            currentPage === page
                              ? "bg-green-600 text-white"
                              : "text-gray-600 hover:bg-gray-200"
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    {currentPage < totalPages - 2 && <span className="text-gray-600">...</span>}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`w-8 h-8 rounded-full text-sm sm:text-base transition-colors ${
                        currentPage === totalPages
                          ? "bg-green-600 text-white"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="text-green-600 hover:text-green-500 disabled:text-gray-400 text-sm sm:text-base transition-colors"
                >
                  Next &gt;
                </button>
              </div>
            )}
          </div>
        )}

        {/* Charts */}
        {filteredData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 h-64 sm:h-80">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Sentiment Distribution</h3>
              <div className="h-full">
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 h-64 sm:h-80">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Sentiment Proportions</h3>
              <div className="h-full">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200 h-64 sm:h-80">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">Rating Distribution</h3>
              <div className="h-full">
                <Bar data={ratingChartData} options={ratingChartOptions} />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AnalisaSentimen;