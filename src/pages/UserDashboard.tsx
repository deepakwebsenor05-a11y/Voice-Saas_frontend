import { useAuth } from "../context/AuthContext";
import api from "../axios";
import { useState, useEffect, useCallback } from "react";
import { Upload, Plus, Trash2, RefreshCw, ChevronLeft, ChevronRight, FileSpreadsheet, Table2, TrendingUp, Database, Download, Settings, Bell } from "lucide-react";
import { CallManager } from "../components/CallManager";
import CallHistory from "../components/CallHistory";

const UserDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [fileLoading, setFileLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState("");
  const [sheetLoading, setSheetLoading] = useState(false);
  const [syncedSheets, setSyncedSheets] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [dataLoaded, setDataLoaded] = useState(false);
  const [vapiSessionId, setVapiSessionId] = useState<string | null>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Reset pagination when file changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFile]);

  // Memoize fetch functions to prevent unnecessary re-creation
  const fetchFiles = useCallback(async () => {
    try {
      console.log("Fetching files...");
      const response = await api.get("/data/files");
      console.log("Files response:", response.data);
      setFiles(response.data.data || []);
    } catch (error) {
      console.error("Error fetching files:", error);
      setError("Failed to fetch files");
    }
  }, []);

  const fetchSheets = useCallback(async () => {
    try {
      console.log("Fetching sheets...");
      const response = await api.get("/data/sheets");
      console.log("Sheets response:", response.data);
      setSyncedSheets(response.data.data || []);
    } catch (error) {
      console.error("Error fetching sheets:", error);
      setError("Failed to fetch sheets");
    }
  }, []);

  // Fetch data only once when user is available and data hasn't been loaded
  useEffect(() => {
    if (user && !dataLoaded) {
      console.log("User is available, fetching files and sheets...");
      const loadData = async () => {
        try {
          await Promise.all([fetchFiles(), fetchSheets()]);
          setDataLoaded(true);
        } catch (error) {
          console.error("Error loading initial data:", error);
        }
      };
      loadData();
    }
  }, [user, dataLoaded, fetchFiles, fetchSheets]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    setError("");
    setSuccessMessage("");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await api.post("/data/upload/excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      if (response.data.success) {
        if (response.data.sessionId) {
          console.log('Upload returned sessionId:', response.data.sessionId);
          setVapiSessionId(response.data.sessionId);
        }
        await fetchFiles();
        setSelectedFile(response.data.data);
        setSuccessMessage("File uploaded successfully!");
        e.target.value = '';
      } else {
        setError("Upload failed: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setFileLoading(false);
    }
  };

  const handleViewFile = async (fileId: string) => {
    try {
      console.log("Fetching file data for ID:", fileId);
      const response = await api.get(`/data/file/${fileId}`);
      if (response.data.success) {
        console.log("File data received:", response.data.data);
        setSelectedFile(response.data.data);
      } else {
        setError("Failed to load file data");
      }
    } catch (error: any) {
      console.error("Error fetching file:", error);
      setError("Failed to load file data");
    }
  };

  const handleViewSheet = async (sheetId: string) => {
    try {
      console.log("Fetching sheet data for ID:", sheetId);
      const response = await api.get(`/data/sheet/${sheetId}`);
      if (response.data.success) {
        console.log("Sheet data received:", response.data.data);
        setSelectedFile(response.data.data);
      } else {
        setError("Failed to load sheet data");
      }
    } catch (error: any) {
      console.error("Error fetching sheet:", error);
      setError("Failed to load sheet data");
    }
  };

  const handleConnectGoogleSheet = async () => {
    if (!googleSheetUrl.trim()) return;

    setSheetLoading(true);
    setError("");
    setSuccessMessage("");
    try {
      const response = await api.post("/data/sheets/connect", {
        sheetUrl: googleSheetUrl,
      });
      
      if (response.data.success) {
        if (response.data.sessionId) setVapiSessionId(response.data.sessionId);
        await fetchSheets();
        setGoogleSheetUrl("");
        setSuccessMessage("Google Sheet connected successfully!");
      } else {
        setError("Connection failed: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Sheet sync error:", error);
      setError(error.response?.data?.message || "Failed to connect Google Sheet. Please try again.");
    } finally {
      setSheetLoading(false);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      setError("");
      setSuccessMessage("");
      const response = await api.delete(`/data/file/${fileId}`);
      if (response.data.success) {
        await fetchFiles();
        if (selectedFile?.id === fileId) setSelectedFile(null);
        setSuccessMessage("File deleted successfully!");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      setError(error.response?.data?.message || "Failed to delete file.");
    }
  };

  const handleDeleteSheet = async (sheetId: string) => {
    try {
      setError("");
      setSuccessMessage("");
      const response = await api.delete(`/data/sheet/${sheetId}`);
      if (response.data.success) {
        await fetchSheets();
        if (selectedFile?.id === sheetId) setSelectedFile(null);
        setSuccessMessage("Sheet deleted successfully!");
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      setError(error.response?.data?.message || "Failed to delete sheet.");
    }
  };

  const handleRefreshSheet = async (sheetId: string) => {
    try {
      setError("");
      setSuccessMessage("");
      const response = await api.post(`/data/sheets/refresh/${sheetId}`);
      if (response.data.success) {
        await fetchSheets();
        if (selectedFile?.id === sheetId) {
          handleViewSheet(sheetId);
        }
        setSuccessMessage("Sheet refreshed successfully!");
      } else {
        setError("Failed to refresh sheet: " + response.data.message);
      }
    } catch (error: any) {
      console.error("Refresh error:", error);
      setError(error.response?.data?.message || "Failed to refresh sheet.");
    }
  };

  // Enhanced DataTable with pagination
  const DataTable = ({ data }: { data: any }) => {
    console.log("DataTable received data (raw):", data);

    if (!data) {
      return (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No data provided</p>
        </div>
      );
    }

    let rows: any[] = [];
    if (Array.isArray(data)) {
      rows = data;
    } else if (Array.isArray(data.rows)) {
      rows = data.rows;
    } else if (Array.isArray(data.data)) {
      rows = data.data.rows || data.data || [];
    }

    const derivedColumns: string[] = Array.isArray(data.columns) ? data.columns : [];

    console.log("Normalized rows (length):", rows.length);
    console.log("Derived columns:", derivedColumns);

    if (!rows || rows.length === 0) {
      return (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No data available</p>
          <p className="text-xs text-gray-400 mt-2">
            Rows: {rows ? rows.length : 'undefined'} | Columns: {derivedColumns.length}
          </p>
        </div>
      );
    }

    const columns = derivedColumns.length > 0 ? derivedColumns : Object.keys(rows[0]);
    const totalRows = rows.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    const currentRows = rows.slice(startIndex, endIndex);

    const handlePageChange = (newPage: number) => {
      setCurrentPage(newPage);
    };

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
      setRowsPerPage(newRowsPerPage);
      setCurrentPage(1);
    };

    return (
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Show</label>
            <select
              value={rowsPerPage}
              onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
              className="border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span className="text-sm text-gray-600">entries</span>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{startIndex + 1}-{Math.min(endIndex, totalRows)}</span>
            <span>of</span>
            <span className="font-medium">{totalRows}</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <th className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16">
                    #
                  </th>
                  {columns.map((col: string, idx: number) => (
                    <th key={`header-${idx}`} className="px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {currentRows.map((row: any, idx: number) => (
                  <tr key={`row-${startIndex + idx}`} className="hover:bg-indigo-50 transition-colors duration-150">
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                      {startIndex + idx + 1}
                    </td>
                    {columns.map((col: string, cidx: number) => {
                      const rawValue = row[col] ?? row[col.trim()] ?? row[col.replace(/\s+/g, '')] ?? row[col.toLowerCase()];
                      const cell = rawValue !== undefined && rawValue !== null ? rawValue : '-';
                      return (
                        <td key={`cell-${idx}-${cidx}`} className="px-4 py-3 text-sm text-gray-700">
                          {typeof cell === 'object' ? JSON.stringify(cell) : cell}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="text-sm text-gray-600">
              Page <span className="font-semibold text-gray-900">{currentPage}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const totalFiles = files.length + syncedSheets.length;
  const totalRows = [...files, ...syncedSheets].reduce((sum, f) => sum + (f.rowCount || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DataHub Pro</h1>
                  <p className="text-xs text-gray-500">Data Management Platform</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-gray-600" />
              </button>
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email || 'User Account'}</p>
                </div>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-sm">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}! 👋</h2>
              <p className="text-indigo-100 text-lg">Manage your data sources and analytics in one place</p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loading}
              className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium hover:bg-white/30 transition-all disabled:opacity-50 border border-white/30 shadow-lg"
            >
              {loading ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <div className="bg-green-50 border-l-4 border-green-500 text-green-800 px-6 py-4 rounded-lg mb-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-600 hover:text-green-800 font-bold text-xl">×</button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-6 py-4 rounded-lg mb-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
            <button onClick={() => setError("")} className="text-red-600 hover:text-red-800 font-bold text-xl">×</button>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Sources</p>
                <p className="text-3xl font-bold text-gray-900">{totalFiles}</p>
                <p className="text-xs text-green-600 mt-2 font-medium">↑ All data sources</p>
              </div>
              <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Database className="w-7 h-7 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Records</p>
                <p className="text-3xl font-bold text-gray-900">{totalRows.toLocaleString()}</p>
                <p className="text-xs text-blue-600 mt-2 font-medium">↑ Data rows</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                <Table2 className="w-7 h-7 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Sheets</p>
                <p className="text-3xl font-bold text-gray-900">{syncedSheets.length}</p>
                <p className="text-xs text-purple-600 mt-2 font-medium">↑ Google Sheets</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-7 h-7 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Upload className="w-6 h-6 text-indigo-600" />
            Data Import
          </h2>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Excel Upload */}
            <label className="block cursor-pointer group">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-indigo-500 hover:bg-indigo-50 transition-all duration-300">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Excel File</h3>
                  <p className="text-sm text-gray-500 mb-4">Supports .xlsx, .xls, and .csv formats</p>
                  <div className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium group-hover:bg-indigo-700 transition-colors">
                    Choose File
                  </div>
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv" 
                    onChange={handleExcelUpload}
                    disabled={fileLoading}
                    className="hidden" 
                  />
                </div>
              </div>
              {fileLoading && <p className="text-center text-indigo-600 mt-3 text-sm font-medium animate-pulse">Uploading...</p>}
            </label>

            {/* Google Sheets */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-green-500 hover:bg-green-50 transition-all duration-300">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Plus className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">Connect Google Sheet</h3>
                <p className="text-sm text-gray-500 mb-4 text-center">Sync data from Google Sheets</p>
                <input
                  type="text"
                  placeholder="Paste Google Sheet URL here..."
                  value={googleSheetUrl}
                  onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  onClick={handleConnectGoogleSheet}
                  disabled={sheetLoading || !googleSheetUrl.trim()}
                  className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sheetLoading ? "Connecting..." : "Connect Sheet"}
                </button>
              </div>
            </div>
          </div>

          <CallManager externalSessionId={vapiSessionId} />
        </div>

        {/* Data Sources */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Files */}
          {files.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                  Excel Files
                </h3>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">{files.length}</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.id || file._id}
                    onClick={() => handleViewFile(file.id || file._id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedFile?.id === (file.id || file._id)
                        ? "border-indigo-500 bg-indigo-50 shadow-md"
                        : "border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">{file.name}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Table2 className="w-3 h-3" />
                            {file.rowCount || 0} rows
                          </span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id || file._id);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sheets */}
          {syncedSheets.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-green-600" />
                  Google Sheets
                </h3>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{syncedSheets.length}</span>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {syncedSheets.map((sheet) => (
                  <div
                    key={sheet.id || sheet._id}
                    onClick={() => handleViewSheet(sheet.id || sheet._id)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                      selectedFile?.id === (sheet.id || sheet._id)
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-1">{sheet.name}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Table2 className="w-3 h-3" />
                            {sheet.rowCount || 0} rows
                          </span>
                          <span>Synced: {new Date(sheet.lastSync).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRefreshSheet(sheet.id || sheet._id);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Refresh sheet"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSheet(sheet.id || sheet._id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete sheet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Data Preview */}
        {selectedFile && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Table2 className="w-6 h-6 text-indigo-600" />
                {selectedFile.name}
              </h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
            <DataTable data={selectedFile} />
          </div>
        )}

        {/* Empty State */}
        {files.length === 0 && syncedSheets.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center mb-8">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No data sources yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">Upload an Excel file or connect a Google Sheet to start managing your data</p>
            <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
              Get Started
            </button>
          </div>
        )}

        {/* Call History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Call History & Transcripts
          </h2>
          <CallHistory />
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;