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
    res.status(500).json({
      status: 'error',
      message: 'Failed to generate documentation. ' + error.message,
    });
  }
};

export default {
  getDocumentation,
};
