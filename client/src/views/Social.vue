<template>
  <div class="page-container">
    <div class="page-header">
      <h1><span class="gradient-text">社区动态</span></h1>
      <p>分享您的进步，互相鼓励，共同成长</p>
    </div>

    <el-tabs v-model="activeTab" class="social-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="全部动态" name="all" />
      <el-tab-pane label="我的动态" name="mine" />
    </el-tabs>

    <div class="new-post-card glass-card">
      <div class="new-post-header">
        <el-avatar :size="40" :src="authStore.user?.avatar">
          {{ authStore.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
        </el-avatar>
        <span class="new-post-label">分享新鲜事...</span>
      </div>
      <el-input
        v-model="newPostContent"
        type="textarea"
        :rows="3"
        placeholder="今天有什么想分享的？"
        maxlength="500"
        show-word-limit
        class="new-post-textarea"
      />
      <div v-if="previewImages.length > 0" class="preview-images">
        <div v-for="(img, idx) in previewImages" :key="idx" class="preview-image-item">
          <img :src="img" alt="preview" />
          <button class="preview-remove" @click="removePreviewImage(idx)">
            <el-icon :size="12"><Delete /></el-icon>
          </button>
        </div>
      </div>
      <div class="new-post-actions">
        <div class="new-post-actions-left">
          <label class="upload-trigger" :class="{ disabled: uploading }">
            <input
              type="file"
              accept="image/*"
              multiple
              hidden
              :disabled="uploading"
              @change="handleFileSelect"
            />
            <el-icon :size="20"><PictureFilled /></el-icon>
            <span>图片</span>
          </label>
        </div>
        <div class="new-post-actions-right">
          <span class="char-count">{{ newPostContent.length }}/500</span>
          <el-button
            type="primary"
            class="btn-gradient"
            :loading="creating"
            :disabled="!newPostContent.trim() || uploading"
            @click="handleCreatePost"
          >
            <el-icon :size="16" v-if="!creating"><Plus /></el-icon>
            发布
          </el-button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton animated :rows="3" />
      <el-skeleton animated :rows="3" style="margin-top:16px" />
      <el-skeleton animated :rows="3" style="margin-top:16px" />
    </div>

    <el-empty
      v-else-if="posts.length === 0"
      description="还没有动态，成为第一个分享的人吧"
      :image-size="120"
    />

    <div v-else class="post-list">
      <div v-for="post in posts" :key="post.id" class="post-card glass-card">
        <div class="post-header">
          <div class="post-user">
            <el-avatar :size="44" :src="post.user?.avatar">
              {{ post.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
            </el-avatar>
            <div class="post-user-info">
              <span class="post-username">{{ post.user?.username || '匿名用户' }}</span>
              <span class="post-time">{{ formatTime(post.createdAt) }}</span>
            </div>
          </div>
          <button
            v-if="post.user?.id === authStore.userId"
            class="post-delete-btn"
            @click="handleDeletePost(post.id)"
          >
            <el-icon :size="14"><Delete /></el-icon>
          </button>
        </div>

        <div class="post-content">
          <p>{{ post.content }}</p>
        </div>

        <div v-if="post.images && post.images.length" class="post-images" :class="gridClass(post.images.length)">
          <el-image
            v-for="(img, idx) in post.images"
            :key="idx"
            :src="img"
            fit="cover"
            :preview-src-list="post.images"
            :initial-index="idx"
            class="post-image-item"
          />
        </div>

        <div class="post-stats">
          <div class="post-stats-left">
            <button class="stat-btn" :class="{ active: post.isLiked }" @click="handleLike(post)">
              <el-icon :size="18"><StarFilled /></el-icon>
              <span>{{ post.likesCount || 0 }}</span>
            </button>
            <button class="stat-btn" @click="toggleComments(post)">
              <el-icon :size="18"><ChatDotSquare /></el-icon>
              <span>{{ post.commentsCount || 0 }}</span>
            </button>
          </div>
        </div>

        <div class="post-actions-bar">
          <button class="action-btn" :class="{ liked: post.isLiked }" @click="handleLike(post)">
            <el-icon :size="18"><StarFilled /></el-icon>
            <span>{{ post.isLiked ? '已赞' : '点赞' }}</span>
          </button>
          <el-divider direction="vertical" />
          <button class="action-btn" @click="toggleComments(post)">
            <el-icon :size="18"><ChatDotSquare /></el-icon>
            <span>评论</span>
          </button>
          <el-divider direction="vertical" />
          <button class="action-btn">
            <el-icon :size="18"><Share /></el-icon>
            <span>分享</span>
          </button>
        </div>

        <div v-if="post.showComments" class="comments-section">
          <div v-if="post.commentsLoading" class="comments-loading">
            <el-icon class="is-loading" :size="20"><Loading /></el-icon>
            <span>加载评论中...</span>
          </div>
          <template v-else>
            <div v-if="post.comments && post.comments.length" class="comments-list">
              <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
                <el-avatar :size="32" :src="comment.user?.avatar">
                  {{ comment.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
                </el-avatar>
                <div class="comment-body">
                  <div class="comment-header">
                    <span class="comment-username">{{ comment.user?.username || '匿名' }}</span>
                    <span class="comment-time">{{ formatTime(comment.createdAt) }}</span>
                  </div>
                  <span class="comment-text">
                    <span v-if="comment.reply_to" class="reply-mention">@{{ comment.reply_to }}</span>
                    {{ comment.content }}
                  </span>
                  <button
                    class="comment-reply-btn"
                    @click="setReplyTarget(post, comment)"
                  >
                    回复
                  </button>
                </div>
              </div>
            </div>
            <div v-else class="comments-empty">暂无评论，快来抢沙发吧~</div>
            <div class="comment-input-row">
              <el-avatar :size="28" :src="authStore.user?.avatar" style="flex-shrink:0">
                {{ authStore.user?.username?.charAt(0)?.toUpperCase() || 'U' }}
              </el-avatar>
              <div class="comment-input-wrap">
                <div v-if="post.replyTarget" class="reply-indicator">
                  回复 @{{ post.replyTarget.username }}
                  <button class="reply-cancel" @click="cancelReply(post)">
                    <el-icon :size="12"><Close /></el-icon>
                  </button>
                </div>
                <el-input
                  v-model="post.commentText"
                  :placeholder="post.replyTarget ? `回复 @${post.replyTarget.username}...` : '写下你的评论...'"
                  size="small"
                  class="comment-input"
                  @keyup.enter="handleComment(post)"
                >
                  <template #suffix>
                    <el-button
                      link
                      type="primary"
                      :loading="post.commenting"
                      :disabled="!post.commentText?.trim()"
                      @click="handleComment(post)"
                    >
                      发送
                    </el-button>
                  </template>
                </el-input>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div class="pagination-wrap" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="fetchPosts"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  Plus, Delete, ChatDotSquare, StarFilled, PictureFilled,
  Share, Refresh, Loading, Close
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import {
  getPosts, createPost, deletePost as delPost,
  likePost, commentPost, getComments
} from '@/api/social'
import { uploadMultiple } from '@/api/upload'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const authStore = useAuthStore()

const posts = ref([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const activeTab = ref('all')

const newPostContent = ref('')
const previewImages = ref([])
const uploadedUrls = ref([])
const uploading = ref(false)
const creating = ref(false)

function formatTime(date) {
  if (!date) return ''
  return dayjs(date).fromNow()
}

function gridClass(count) {
  if (count === 1) return 'grid-1'
  if (count === 2 || count === 4) return 'grid-2'
  return 'grid-3'
}

async function fetchPosts() {
  loading.value = true
  try {
    const params = { page: page.value, pageSize: pageSize.value }
    if (activeTab.value === 'mine') {
      params.userId = authStore.userId
    }
    const res = await getPosts(params)
    const list = res.rows || res.data?.rows || res.data || res || []
    posts.value = (Array.isArray(list) ? list : []).map(p => ({
      ...p,
      showComments: false,
      comments: null,
      commentsLoading: false,
      commentText: '',
      commenting: false,
      replyTarget: null
    }))
    total.value = res.total || res.data?.total || posts.value.length
  } catch (err) {
    console.error('获取动态失败:', err)
    posts.value = []
  } finally {
    loading.value = false
  }
}

function handleTabChange() {
  page.value = 1
  fetchPosts()
}

function handleFileSelect(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  files.forEach(file => {
    const reader = new FileReader()
    reader.onload = (ev) => {
      previewImages.value.push(ev.target.result)
    }
    reader.readAsDataURL(file)
  })
  uploadImages(files)
  e.target.value = ''
}

async function uploadImages(files) {
  uploading.value = true
  try {
    const res = await uploadMultiple(files)
    const urls = res.data?.urls || res.data || res.urls || res || []
    if (Array.isArray(urls)) {
      uploadedUrls.value.push(...urls)
    } else if (typeof urls === 'string') {
      uploadedUrls.value.push(urls)
    }
  } catch (err) {
    console.error('图片上传失败:', err)
    ElMessage.error('图片上传失败')
  } finally {
    uploading.value = false
  }
}

function removePreviewImage(idx) {
  previewImages.value.splice(idx, 1)
  uploadedUrls.value.splice(idx, 1)
}

async function handleCreatePost() {
  if (!newPostContent.value.trim()) return
  creating.value = true
  try {
    await createPost({
      content: newPostContent.value.trim(),
      images: [...uploadedUrls.value]
    })
    ElMessage.success('发布成功')
    newPostContent.value = ''
    previewImages.value = []
    uploadedUrls.value = []
    page.value = 1
    await fetchPosts()
  } catch (err) {
    console.error('发布失败:', err)
    ElMessage.error('发布失败，请重试')
  } finally {
    creating.value = false
  }
}

async function handleDeletePost(id) {
  try {
    await ElMessageBox.confirm('确定要删除这条动态吗？', '提示', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await delPost(id)
    ElMessage.success('删除成功')
    await fetchPosts()
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除失败:', err)
    }
  }
}

async function handleLike(post) {
  try {
    await likePost(post.id)
    post.isLiked = !post.isLiked
    post.likesCount = (post.likesCount || 0) + (post.isLiked ? 1 : -1)
  } catch (err) {
    console.error('点赞失败:', err)
  }
}

async function setReplyTarget(post, comment) {
  post.replyTarget = {
    id: comment.user_id || comment.user?.id,
    username: comment.user?.username || '匿名',
    commentId: comment.id
  }
  post.commentText = ''
}

function cancelReply(post) {
  post.replyTarget = null
  post.commentText = ''
}

async function toggleComments(post) {
  post.showComments = !post.showComments
  if (post.showComments && !post.comments) {
    post.commentsLoading = true
    try {
      const res = await getComments(post.id)
      const list = res.data?.rows || res.data || res || []
      post.comments = Array.isArray(list) ? list : []
    } catch (err) {
      console.error('获取评论失败:', err)
      post.comments = []
    } finally {
      post.commentsLoading = false
    }
  }
}

async function handleComment(post) {
  const text = post.commentText?.trim()
  if (!text) return
  post.commenting = true
  try {
    const commentData = { content: text }
    if (post.replyTarget) {
      commentData.reply_to = post.replyTarget.username
      commentData.parent_id = post.replyTarget.commentId
    }
    await commentPost(post.id, commentData)
    ElMessage.success('评论成功')
    post.commentText = ''
    post.replyTarget = null
    const res = await getComments(post.id)
    const list = res.data?.rows || res.data || res || []
    post.comments = Array.isArray(list) ? list : []
    post.commentsCount = (post.commentsCount || 0) + 1
  } catch (err) {
    console.error('评论失败:', err)
    ElMessage.error('评论失败')
  } finally {
    post.commenting = false
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.social-tabs {
  margin-bottom: 20px;
}

.social-tabs :deep(.el-tabs__header) {
  margin-bottom: 0;
}

.social-tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
}

.social-tabs :deep(.el-tabs__item) {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 0 20px;
  height: 44px;
  line-height: 44px;
}

.social-tabs :deep(.el-tabs__item.is-active) {
  color: var(--primary);
  font-weight: 600;
}

.new-post-card {
  padding: 20px 24px;
  margin-bottom: 20px;
}

.new-post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.new-post-label {
  font-size: 15px;
  color: var(--text-tertiary);
}

.new-post-textarea {
  margin-bottom: 12px;
}

.new-post-textarea :deep(.el-textarea__inner) {
  background: var(--bg-secondary);
  border-color: var(--border-color);
  border-radius: var(--radius);
  resize: none;
  font-size: 14px;
  color: var(--text-primary);
  transition: var(--transition-fast);
}

.new-post-textarea :deep(.el-textarea__inner):focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb), 0.1);
}

.preview-images {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.preview-image-item {
  position: relative;
  width: 88px;
  height: 88px;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: var(--radius-sm);
}

.preview-remove {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--danger);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  transition: var(--transition-fast);
  opacity: 0;
}

.preview-image-item:hover .preview-remove {
  opacity: 1;
}

.new-post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.new-post-actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 13px;
  transition: var(--transition-fast);
  user-select: none;
}

.upload-trigger:hover {
  background: rgba(var(--primary-rgb), 0.08);
  color: var(--primary);
}

.upload-trigger.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.new-post-actions-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.char-count {
  font-size: 12px;
  color: var(--text-tertiary);
}

.loading-state {
  padding: 16px 0;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  padding: 20px 24px;
  transition: var(--transition);
}

.post-card:hover {
  transform: translateY(-1px);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.post-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.post-user-info {
  display: flex;
  flex-direction: column;
}

.post-username {
  font-weight: 600;
  color: var(--text-primary);
  font-size: 15px;
}

.post-time {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.post-delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition-fast);
}

.post-delete-btn:hover {
  background: rgba(var(--danger-rgb), 0.1);
  color: var(--danger);
}

.post-content p {
  margin: 0 0 14px;
  line-height: 1.7;
  color: var(--text-primary);
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-images {
  display: grid;
  gap: 8px;
  margin-bottom: 14px;
}

.post-images.grid-1 {
  grid-template-columns: 1fr;
  max-width: 400px;
}

.post-images.grid-1 .post-image-item {
  aspect-ratio: 16/9;
}

.post-images.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.post-images.grid-3 {
  grid-template-columns: repeat(3, 1fr);
}

.post-image-item {
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
}

.post-image-item :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-image-item:hover :deep(img) {
  transform: scale(1.05);
}

.post-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 4px;
}

.post-stats-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  background: none;
  color: var(--text-tertiary);
  font-size: 14px;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  transition: var(--transition-fast);
}

.stat-btn.active {
  color: var(--danger);
}

.post-actions-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 4px 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: none;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  transition: var(--transition-fast);
  flex: 1;
  justify-content: center;
}

.action-btn:hover {
  background: rgba(var(--primary-rgb), 0.06);
  color: var(--primary);
}

.action-btn.liked {
  color: var(--danger);
}

.post-actions-bar :deep(.el-divider--vertical) {
  height: 20px;
  margin: 0;
}

.comments-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.comments-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 0;
  color: var(--text-tertiary);
  font-size: 13px;
  justify-content: center;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 14px;
}

.comment-item {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.comment-body {
  flex: 1;
  background: var(--bg-secondary);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.comment-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.comment-username {
  font-weight: 600;
  font-size: 13px;
  color: var(--primary);
}

.comment-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.comment-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.5;
}

.comments-empty {
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
  padding: 12px 0;
  margin-bottom: 8px;
}

.comment-input-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.comment-input-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.reply-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--primary);
  padding: 4px 10px;
  background: rgba(var(--primary-rgb), 0.06);
  border-radius: var(--radius-sm);
}

.reply-cancel {
  margin-left: auto;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: var(--transition-fast);
}

.reply-cancel:hover {
  background: rgba(var(--danger-rgb), 0.1);
  color: var(--danger);
}

.reply-mention {
  color: var(--primary);
  font-weight: 600;
  margin-right: 4px;
}

.comment-reply-btn {
  border: none;
  background: none;
  cursor: pointer;
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 4px;
  transition: var(--transition-fast);
}

.comment-reply-btn:hover {
  color: var(--primary);
  background: rgba(var(--primary-rgb), 0.06);
}

.comment-input :deep(.el-input__wrapper) {
  background: var(--bg-secondary);
  border-radius: 20px;
  box-shadow: none;
  padding: 2px 12px;
}

.comment-input :deep(.el-input__wrapper):hover {
  box-shadow: 0 0 0 1px var(--border-color) inset;
}

.comment-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px var(--primary) inset;
}

.pagination-wrap {
  display: flex;
  justify-content: center;
  padding-top: 28px;
}

@media (max-width: 768px) {
  .new-post-card {
    padding: 16px;
  }

  .post-card {
    padding: 16px;
  }

  .post-images.grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }

  .action-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .post-images.grid-1 {
    max-width: 100%;
  }
}
</style>
