import express from 'express';
import {
  listConnectedRepos,
  connectRepo,
  getRepoDetails,
  syncRepo,
  disconnectRepo,
  getFileContent,
  searchRepositoryIndex,
} from '../controllers/repository.controller.js';
import { getDocumentation } from '../controllers/documentation.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect); // Secure all repository routes

router.route('/')
  .get(listConnectedRepos)
  .post(connectRepo);

router.route('/:id')
  .get(getRepoDetails)
  .delete(disconnectRepo);

router.post('/:id/sync', syncRepo);
router.get('/:id/files/content', getFileContent);
router.get('/:id/search', searchRepositoryIndex);
router.get('/:id/docs/:type', getDocumentation);

export default router;
