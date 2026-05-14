const pool = require('../config/db');
const SocialPost = require('../models/SocialPost');
const SocialLike = require('../models/SocialLike');
const SocialComment = require('../models/SocialComment');
const { success, error, paginated } = require('../utils/response');
const { getPagination } = require('../utils/helpers');

const socialController = {
  async list(req, res, next) {
    try {
      const { page, pageSize, offset } = getPagination(req.query);

      const { sql, values } = await SocialPost.findAll({});
      const total = await SocialPost.countAll({});

      const [rows] = await pool.query(
        sql + ' LIMIT ? OFFSET ?',
        [...values, pageSize, offset]
      );

      const result = rows.map(post => {
        let images = [];
        if (post.images) {
          try {
            images = typeof post.images === 'string' ? JSON.parse(post.images) : post.images;
          } catch (e) {
            images = [];
          }
        }
        return { ...post, images, isLiked: false };
      });

      res.json(paginated(result, total, page, pageSize));
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { content, images } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json(error('动态内容不能为空', 400));
      }

      const postId = await SocialPost.create({
        user_id: req.user.id,
        content,
        images: images || []
      });

      const post = await SocialPost.findById(postId);
      if (post) {
        try {
          post.images = post.images ? JSON.parse(post.images) : [];
        } catch (e) {
          post.images = [];
        }
      }

      res.status(201).json(success(post, '动态发布成功', 201));
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const { id } = req.params;

      const post = await SocialPost.findById(id);
      if (!post) {
        return res.status(404).json(error('动态不存在', 404));
      }

      if (post.user_id !== req.user.id) {
        return res.status(403).json(error('无权删除此动态', 403));
      }

      await SocialPost.delete(id, req.user.id);
      res.json(success(null, '动态删除成功'));
    } catch (err) {
      next(err);
    }
  },

  async toggleLike(req, res, next) {
    try {
      const { id } = req.params;

      const post = await SocialPost.findById(id);
      if (!post) {
        return res.status(404).json(error('动态不存在', 404));
      }

      const existingLike = await SocialLike.findByUserAndPost(req.user.id, id);

      if (existingLike) {
        await SocialLike.delete(req.user.id, id);
        await SocialPost.decrementLikes(id);
        res.json(success({ isLiked: false }, '取消点赞成功'));
      } else {
        await SocialLike.create(req.user.id, id);
        await SocialPost.incrementLikes(id);
        res.json(success({ isLiked: true }, '点赞成功'));
      }
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json(error('已经点过赞了', 409));
      }
      next(err);
    }
  },

  async addComment(req, res, next) {
    try {
      const { id } = req.params;
      const { content } = req.body;

      if (!content || !content.trim()) {
        return res.status(400).json(error('评论内容不能为空', 400));
      }

      const post = await SocialPost.findById(id);
      if (!post) {
        return res.status(404).json(error('动态不存在', 404));
      }

      const commentId = await SocialComment.create({
        post_id: id,
        user_id: req.user.id,
        content
      });

      await SocialPost.incrementComments(id);

      const [rows] = await pool.query(
        `SELECT sc.*, u.username, u.nickname, u.avatar
         FROM social_comments sc
         LEFT JOIN users u ON sc.user_id = u.id
         WHERE sc.id = ?`,
        [commentId]
      );

      res.status(201).json(success(rows[0], '评论成功', 201));
    } catch (err) {
      next(err);
    }
  },

  async getComments(req, res, next) {
    try {
      const { id } = req.params;

      const post = await SocialPost.findById(id);
      if (!post) {
        return res.status(404).json(error('动态不存在', 404));
      }

      const comments = await SocialComment.findByPostId(id);
      res.json(success(comments));
    } catch (err) {
      next(err);
    }
  }
};

module.exports = socialController;
