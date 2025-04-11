import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { createUrl, getUrls, deleteUrl } from '../store/slices';
// Comment out analytics imports for now
// import { getUrlAnalytics, clearError } from '../store/slices/analyticsSlice';
import { useAppDispatch } from '../hooks/useAppDispatch';

interface FormData {
  originalUrl: string;
  customAlias: string;
  expiresAt?: string;
}

const Dashboard = () => {
  const dispatch = useAppDispatch();
  // Only select URL state for now
  const { urls, loading: urlLoading, error: urlError } = useSelector((state: RootState) => state.url);
  
  // --- Temporarily Commented Out Analytics State Selection ---
  // const analyticsState = useSelector((state: RootState) => {
  //   console.log('[Dashboard] Full Redux State:', state);
  //   if (state.analytics === undefined) {
  //       console.error('[Dashboard] state.analytics is UNDEFINED in useSelector!');
  //   }
  //   return state.analytics;
  // });
  // 
  // if (!analyticsState) {
  //   console.error('[Dashboard] analyticsState is falsy after useSelector. Rendering error message.');
  //   return <div className=\"container mx-auto p-4 text-red-600 font-bold\">Error: Failed to load analytics state. Store might be misconfigured.</div>;
  // }
  // 
  // const { selectedUrlAnalytics, loading: analyticsLoading, error: analyticsError } = analyticsState;
  // --- End Temporary Comment Out ---
  
  const [formData, setFormData] = useState<FormData>({
    originalUrl: '',
    customAlias: '',
    expiresAt: '',
  });

  useEffect(() => {
    dispatch(getUrls());
    // Comment out analytics cleanup for now
    // return () => { dispatch(clearError()); }; 
  }, [dispatch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      expiresAt: formData.expiresAt || undefined,
    };
    await dispatch(createUrl(payload));
    setFormData({ originalUrl: '', customAlias: '', expiresAt: '' });
  };

  const handleDelete = async (id: string) => {
    await dispatch(deleteUrl(id));
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

  // Comment out analytics handler for now
  // const handleViewAnalytics = (urlId: string) => {
  //   if (selectedUrlAnalytics && selectedUrlAnalytics.shortId === urls.find(u => u._id === urlId)?.shortId) {
  //       dispatch(clearError());
  //   } else {
  //       dispatch(getUrlAnalytics(urlId));
  //   }
  // };

  // Comment out chart processing for now
  // const processClicksOverTime = () => { /* ... */ };
  // const processDataDistribution = (key: 'device' | 'browser' | 'os' | 'country') => { /* ... */ };
  // const clicksData = []; // processClicksOverTime();
  // const deviceData = []; // processDataDistribution('device');
  // const browserData = []; // processDataDistribution('browser');

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold">URL Analytics Dashboard</h1>
      
      {urlError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {urlError}
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
            disabled={urlLoading}
            className="w-full md:w-auto bg-blue-600 text-white px-5 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {urlLoading ? 'Creating...' : 'Create Short URL'}
          </button>
        </div>
      </form>

      {/* --- Temporarily Commented Out Analytics Section --- */}
      {/* {analyticsLoading && <p>Loading analytics...</p>} */}
      {/* {analyticsError && <p>Error loading analytics: {analyticsError}</p>} */}
      {/* {selectedUrlAnalytics && ( */}
      {/*   <div>... Analytics Charts ...</div> */}
      {/* )} */}
      {/* --- End Temporary Comment Out --- */} 

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
            {urls.map((url) => (
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
                  {/* Comment out Analytics Button */}
                  {/* <button onClick={() => handleViewAnalytics(url._id)} className="text-blue-600 hover:text-blue-800 hover:underline"> */}
                  {/*   Analytics */}
                  {/* </button> */}
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
    </div>
  );
};

export default Dashboard; 