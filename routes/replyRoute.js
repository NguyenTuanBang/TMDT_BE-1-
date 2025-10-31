import express from 'express';
import ReplyController from '../controllers/replyController.js';
import authController from '../controllers/authController.js';
const router = express.Router();

router.get('/', authController.protect, ReplyController.getReply);

export default router;
