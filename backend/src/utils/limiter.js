class RateLimiter {
  constructor(minTime = 12000) {
    this.minTime = minTime;
    this.lastCall = 0;
    this.queue = Promise.resolve();
  }

  /**
   * Schedules a task to be run sequentially after respecting the rate limit spacing time.
   * @param {Function} fn - The async task function to schedule
   * @returns {Promise<any>} The result of the task function
   */
  schedule(fn) {
    this.queue = this.queue.then(async () => {
      const now = Date.now();
      const timeSinceLast = now - this.lastCall;
      if (timeSinceLast < this.minTime) {
        const sleepTime = this.minTime - timeSinceLast;
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
      }
      this.lastCall = Date.now();
      return fn();
    });
    return this.queue;
  }
}

// 12 seconds limit between consecutive LLM calls ensures safety on 5 RPM limits
const limiter = new RateLimiter(12000);

export default limiter;
