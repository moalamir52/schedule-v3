// API Retry utility with exponential backoff
async function apiRetry(apiCall, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      // Check if it's a rate limit error
      const isRateLimit = error.response?.status === 429 || 
                         error.message?.includes('rate limit') ||
                         error.message?.includes('limit exceeded');
      
      // Check if it's a temporary server error
      const isServerError = error.response?.status >= 500;
      
      // Only retry for rate limits and server errors
      if (!isRateLimit && !isServerError) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

module.exports = { apiRetry };