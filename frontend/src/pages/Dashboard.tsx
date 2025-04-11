import React, { useState, useEffect } from 'react';
import api from '../api/axiosConfig';

// Add interface for backend status
interface BackendStatus {
  status: string;
  timestamp: string;
  uptime: number;
  mongoConnection: 'connected' | 'disconnected';
}

interface FormData {
  originalUrl: string;
  customAlias: string;
  expiresAt?: string;
}

interface UrlData {
  _id: string;
  originalUrl: string;
  shortUrl: string;
  shortId: string;
  clicks: number;
  createdAt: string;
  expiresAt?: string;
  qrCode?: string; // QR code data URL
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const Dashboard = () => {
  // Form state
  const [formData, setFormData] = useState<FormData>({
    originalUrl: '',
    customAlias: '',
    expiresAt: '',
  });
  
  // URL creation state
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // URL list state
  const [localUrls, setLocalUrls] = useState<UrlData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination state
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  
  // QR Code modal state
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [selectedUrlInfo, setSelectedUrlInfo] = useState<UrlData | null>(null);

  // Add backend status state
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load URLs when page, limit, or search term changes
  useEffect(() => {
    loadUrls(pagination.page, pagination.limit, debouncedSearchTerm);
  }, [pagination.page, pagination.limit, debouncedSearchTerm]);

  // Add useEffect to check backend status
  useEffect(() => {
    checkBackendStatus();
    
    // Set up interval to check status every 30 seconds
    const intervalId = setInterval(checkBackendStatus, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Direct API call to load URLs with pagination and search
  const loadUrls = async (page: number = 1, limit: number = 10, search: string = '') => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/urls', {
        params: { page, limit, search }
      });
      
      // Check if the response has the expected structure
      if (response.data && Array.isArray(response.data)) {
        // If the API just returns an array of URLs (without pagination info)
        setLocalUrls(response.data);
        setPagination({
          page,
          limit,
          total: response.data.length,
          pages: Math.ceil(response.data.length / limit)
        });
      } else if (response.data && response.data.urls && response.data.pagination) {
        // If the API returns a structure with urls and pagination info
        setLocalUrls(response.data.urls);
        setPagination(response.data.pagination);
      } else {
        console.error('Unexpected response format:', response.data);
        setLocalUrls([]);
      }
    } catch (error) {
      console.error('Error loading URLs:', error);
      setLocalUrls([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check backend status
  const checkBackendStatus = async () => {
    setStatusLoading(true);
    setStatusError(null);
    
    try {
      const response = await api.get('/api/health');
      setBackendStatus(response.data);
    } catch (error) {
      console.error('Error checking backend status:', error);
      setStatusError('Failed to connect to backend');
      setBackendStatus(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= pagination.pages) {
      setPagination({
        ...pagination,
        page: newPage
      });
    }
  };

  // Direct API call to create URL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);
    
    const payload = {
      ...formData,
      expiresAt: formData.expiresAt || undefined,
    };
    
    console.log('Sending URL creation payload:', payload);
    
    try {
      // Log the token presence first
      const token = localStorage.getItem('token');
      console.log('Token exists in localStorage:', !!token);
      
      const response = await api.post('/api/urls', payload);
      console.log('URL creation response:', response.data);
      
      // Check if the response has the expected structure
      if (response.data && response.data.url) {
        // Add the new URL to the local state immediately
        setLocalUrls(prevUrls => [response.data.url, ...prevUrls]);
        
        // Reset form
        setFormData({ originalUrl: '', customAlias: '', expiresAt: '' });
        
        // Refresh the first page to ensure we see the new URL
        if (pagination.page !== 1) {
          setPagination({
            ...pagination,
            page: 1
          });
        } else {
          // Just reload the current page
          loadUrls(1, pagination.limit, debouncedSearchTerm);
        }
      } else {
        console.error('Unexpected response format:', response.data);
        setCreateError('Server returned unexpected data format');
      }
    } catch (error: any) {
      console.error('Error creating URL:', error);
      
      // More detailed error logging
      if (error.response) {
        // Server responded with an error status
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
        setCreateError(error.response?.data?.message || `Server error: ${error.response.status}`);
      } else if (error.request) {
        // Request was made but no response
        console.error('No response received from server');
        setCreateError('No response from server - check your network connection');
      } else {
        // Something else caused the error
        console.error('Error message:', error.message);
        setCreateError(`Error: ${error.message}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Direct API call to delete URL
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/api/urls/${id}`);
      // Remove the deleted URL from local state
      setLocalUrls(prevUrls => prevUrls.filter(url => url._id !== id));
      
      // If we deleted the last item on a page, go to the previous page
      if (localUrls.length === 1 && pagination.page > 1) {
        setPagination({
          ...pagination,
          page: pagination.page - 1
        });
      } else {
        // Reload the current page
        loadUrls(pagination.page, pagination.limit, debouncedSearchTerm);
      }
    } catch (error) {
      console.error('Error deleting URL:', error);
    }
  };

  // Show QR code in modal
  const handleShowQR = (url: UrlData) => {
    // If we already have the QR code, just show it
    if (url.qrCode) {
      setSelectedQR(url.qrCode);
      setSelectedUrlInfo(url);
    } else {
      // If not, generate it on the fly
      generateQRCode(url.shortUrl).then(qrCode => {
        setSelectedQR(qrCode);
        setSelectedUrlInfo(url);
      });
    }
  };

  // Generate QR code for a URL
  const generateQRCode = async (url: string): Promise<string> => {
    try {
      const response = await api.get(`/api/urls/qr?url=${encodeURIComponent(url)}`);
      return response.data.qrCode;
    } catch (error) {
      console.error('Error generating QR code:', error);
      // If API fails, use a public QR code API as fallback
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;
    }
  };

  const formatExpiration = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Generate pagination controls
  const renderPagination = () => {
    const { page, pages } = pagination;
    
    return (
      <div className="flex justify-center items-center mt-4 space-x-2">
        <button 
          onClick={() => handlePageChange(page - 1)} 
          disabled={page <= 1}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Previous
        </button>
        
        <span className="text-sm">
          Page {page} of {pages || 1}
        </span>
        
        <button 
          onClick={() => handlePageChange(page + 1)} 
          disabled={page >= pages}
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    );
  };

  // Modal for QR code
  const renderQRModal = () => {
    if (!selectedQR || !selectedUrlInfo) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <h3 className="text-xl font-semibold mb-4">QR Code for Short URL</h3>
          
          <div className="flex flex-col items-center mb-4">
            <img 
              src={selectedQR} 
              alt="QR Code" 
              className="w-64 h-64 mb-2" 
            />
            <a 
              href={selectedUrlInfo.shortUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline mt-2"
            >
              {selectedUrlInfo.shortUrl}
            </a>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => {
                // Download QR code
                const link = document.createElement('a');
                link.href = selectedQR;
                link.download = `qrcode-${selectedUrlInfo.shortId}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Download
            </button>
            
            <button 
              onClick={() => {
                setSelectedQR(null);
                setSelectedUrlInfo(null);
              }}
              className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render status indicator badge
  const renderStatusBadge = () => {
    if (statusLoading) {
      return (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 bg-yellow-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Checking...</span>
        </div>
      );
    }
    
    if (statusError || !backendStatus) {
      return (
        <div className="flex items-center space-x-2" title={statusError || 'Unable to connect to backend'}>
          <div className="h-4 w-4 bg-red-500 rounded-full"></div>
          <span className="text-sm text-red-600">Backend Disconnected</span>
          <button 
            onClick={checkBackendStatus}
            className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            Retry
          </button>
        </div>
      );
    }
    
    const isFullyConnected = backendStatus.status === 'ok' && backendStatus.mongoConnection === 'connected';
    
    return (
      <div className="flex items-center space-x-2" title={`MongoDB: ${backendStatus.mongoConnection}`}>
        <div className={`h-4 w-4 ${isFullyConnected ? 'bg-green-500' : 'bg-yellow-500'} rounded-full`}></div>
        <span className={`text-sm ${isFullyConnected ? 'text-green-600' : 'text-yellow-600'}`}>
          {isFullyConnected ? 'Backend Connected' : 'Partial Connection'}
        </span>
        <button 
          onClick={checkBackendStatus}
          className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
        >
          Refresh
        </button>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">URL Analytics Dashboard</h1>
        {renderStatusBadge()}
      </div>
      
      {createError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {createError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Create New Short URL</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <label htmlFor="originalUrl" className="block text-sm font-medium text-gray-700 mb-1">Original URL</label>
            <input
              id="originalUrl"
              name="originalUrl"
              type="url"
              value={formData.originalUrl}
              onChange={handleChange}
              placeholder="https://example.com"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="customAlias" className="block text-sm font-medium text-gray-700 mb-1">Custom Alias (Optional)</label>
            <input
              id="customAlias"
              name="customAlias"
              type="text"
              value={formData.customAlias}
              onChange={handleChange}
              placeholder="my-link"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="expiresAt" className="block text-sm font-medium text-gray-700 mb-1">Expiration Date (Optional)</label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="datetime-local"
            value={formData.expiresAt}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isCreating}
            className="w-full md:w-auto bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Short URL'}
          </button>
        </div>
      </form>

      {/* Search Box */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search URLs</label>
            <input
              id="search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search by URL or alias..."
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="w-32">
            <label htmlFor="pageSize" className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
            <select
              id="pageSize"
              value={pagination.limit}
              onChange={(e) => setPagination({...pagination, limit: Number(e.target.value), page: 1})}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* URLs Table */}
      {isLoading && <p className="text-center text-gray-500">Loading URLs...</p>}
      {!isLoading && localUrls.length === 0 && <p className="text-center text-gray-500">No URLs found. Try creating a new one or adjusting your search.</p>}
      {!isLoading && localUrls.length > 0 && (
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original URL</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Short URL</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clicks</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {localUrls.map((url) => (
                <tr key={url._id}>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate" title={url.originalUrl}>{url.originalUrl}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-blue-600">
                    {url.shortUrl ? (
                      <a href={url.shortUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {url.shortUrl.replace(/^https?:\/\//, '')}
                      </a>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">{url.clicks}</td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(url.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm text-gray-500">
                    {formatExpiration(url.expiresAt)}
                  </td>
                  <td className="py-4 px-4 whitespace-nowrap text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleShowQR(url)}
                      className="text-blue-600 hover:text-blue-800 hover:underline mr-4"
                    >
                      QR Code
                    </button>
                    <button
                      onClick={() => handleDelete(url._id)}
                      className="text-red-600 hover:text-red-800 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination Controls */}
      {!isLoading && localUrls.length > 0 && renderPagination()}
      
      {/* QR Code Modal */}
      {selectedQR && renderQRModal()}
    </div>
  );
};

export default Dashboard; 