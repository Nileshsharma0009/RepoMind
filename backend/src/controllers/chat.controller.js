import { generateChatAnswer } from '../services/chat.service.js';

export const handleChat = async (req, res, next) => {
  try {
    const { repositoryId, message, chatHistory } = req.body;

    if (!repositoryId) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing repositoryId parameter.',
      });
    }

    if (!message || message.trim() === '') {
      return res.status(400).json({
        status: 'error',
        message: 'Message content cannot be empty.',
      });
    }

    const result = await generateChatAnswer(repositoryId, message, chatHistory || []);

    res.status(200).json({
      status: 'success',
      answer: result.answer,
      references: result.references,
    });
  } catch (error) {
    console.error('[CHAT CONTROLLER] Error processing query:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to process AI chat query. ' + error.message,
    });
  }
};

export default {
  handleChat,
};
