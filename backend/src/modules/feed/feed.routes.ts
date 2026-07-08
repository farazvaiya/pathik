import { Router } from 'express';
import { getPosts, createPost, voteOnPost, getComments, createComment } from './feed.controller';
import { optionalAuth } from '../../middleware/requireAuth';

const router = Router();

router.get('/', getPosts);
router.post('/', optionalAuth, createPost);
router.post('/vote', optionalAuth, voteOnPost);
router.get('/comments', getComments);
router.post('/comments', optionalAuth, createComment);

export { router as feedRouter };
