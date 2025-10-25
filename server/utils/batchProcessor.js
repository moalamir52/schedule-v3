// Batch processing utility for heavy API operations
const { apiRetry } = require('./apiRetry');

class BatchProcessor {
  constructor(batchSize = 10, delayBetweenBatches = 500) {
    this.batchSize = batchSize;
    this.delay = delayBetweenBatches;
  }

  async processBatch(items, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      
      try {
        const batchResults = await apiRetry(() => 
          Promise.all(batch.map(processor))
        );
        results.push(...batchResults);
        
        // Delay between batches to avoid rate limits
        if (i + this.batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, this.delay));
        }
      } catch (error) {
        console.error(`Batch ${Math.floor(i/this.batchSize) + 1} failed:`, error.message);
        throw error;
      }
    }
    
    return results;
  }
}

module.exports = { BatchProcessor };