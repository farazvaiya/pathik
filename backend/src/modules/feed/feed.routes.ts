import { Router } from 'express';
import { getPosts, createPost, voteOnPost, getComments, createComment, getReplies, getNearbyPosts, getPostById, deletePost } from './feed.controller';
import { optionalAuth, requireAuth } from '../../middleware/requireAuth';
import { uploadSingle } from './feed.upload';
import { voteRateLimiter } from '../../middleware/rateLimiters';

const router = Router();

router.get('/', getPosts);
router.get('/nearby', getNearbyPosts);
router.get('/:id', getPostById);
router.post('/', optionalAuth, uploadSingle('media'), createPost);
router.post('/vote', optionalAuth, voteRateLimiter, voteOnPost);
router.delete('/:id', requireAuth, deletePost);
router.get('/comments', getComments);
router.get('/comments/:postId/replies', getReplies);
router.post('/comments', optionalAuth, uploadSingle('media'), createComment);

export { router as feedRouter };
