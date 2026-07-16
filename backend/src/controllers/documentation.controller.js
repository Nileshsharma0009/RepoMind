import { generateDocumentation } from '../services/documentation.service.js';

export const getDocumentation = async (req, res, next) => {
  try {
    const { id: repositoryId, type } = req.params;

    if (!repositoryId || !type) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing repository ID or documentation type parameters.',
      });
    }

    const content = await generateDocumentation(repositoryId, type);

    res.status(200).json({
      status: 'success',
      type,
      content,
    });
  } catch (error) {
    console.error('[DOCUMENTATION CONTROLLER] Error compiling guide:', error.message);
    
    const errMsg = error.message || '';
    const isRateLimit =
      errMsg.includes('429') ||
      errMsg.toLowerCase().includes('quota') ||
      errMsg.toLowerCase().includes('rate limit') ||
      errMsg.toLowerCase().includes('resource_exhausted');

    if (isRateLimit) {
      const matchSeconds =
        errMsg.match(/retry(?:\s+in)?\s+([\d\.]+)\s*s/i) ||
        errMsg.match(/retry\s+after\s+(\d+)\s*s/i) ||
        errMsg.match(/retry(?:\s+in)?\s+(\d+)\s*seconds/i);

      const seconds = matchSeconds ? Math.ceil(parseFloat(matchSeconds[1])) : 60;

      return res.status(429).json({
        status: 'rate_limited',
        retryAfter: seconds,
        message: `Gemini API rate limit reached. Please try again in ${seconds} seconds.`,
      });
    }

    res.status(500).json({
      status: 'error',
      message: 'Failed to generate documentation. ' + error.message,
    });
  }
};

export default {
  getDocumentation,
};
