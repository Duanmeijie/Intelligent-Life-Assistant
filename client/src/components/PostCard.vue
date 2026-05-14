<template>
  <div class="post-card">
    <div class="post-header">
      <div class="post-user">
        <el-avatar :size="40" :src="post.user?.avatar">
          {{ post.user?.username?.charAt(0).toUpperCase() || 'U' }}
        </el-avatar>
        <div class="post-user-info">
          <span class="post-username">{{ post.user?.username || '匿名用户' }}</span>
          <span class="post-time">{{ relativeTime }}</span>
        </div>
      </div>
      <el-dropdown v-if="showActions" trigger="click" @command="handleCommand">
        <el-button class="post-more-btn" text circle :icon="MoreFilled" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="delete" divided>
              <el-icon><Delete /></el-icon>删除帖子
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="post-content">
      <p class="post-text">{{ post.content }}</p>
    </div>

    <div v-if="post.images && post.images.length > 0" class="post-images" :class="imageGridClass">
      <div
        v-for="(img, index) in post.images"
        :key="index"
        class="post-image-item"
        :class="{ 'image-full': post.images.length === 1 }"
        @click="handleImagePreview(index)"
      >
        <img :src="img" :alt="'图片' + (index + 1)" loading="lazy" />
      </div>
    </div>

    <div class="post-stats">
      <span class="stat-item">
        <el-icon :class="{ liked: post.isLiked }" @click="handleLike"><Heart /></el-icon>
        {{ post.likesCount || 0 }}
      </span>
      <span class="stat-item" @click="toggleComments">
        <el-icon><ChatDotSquare /></el-icon>
        {{ post.commentsCount || 0 }}
      </span>
    </div>

    <div v-if="showActions" class="post-actions">
      <button class="action-btn" :class="{ liked: post.isLiked }" @click="handleLike">
        <span class="action-icon">
          <el-icon :size="18"><Heart /></el-icon>
        </span>
        <span>点赞</span>
      </button>
      <button class="action-btn" @click="toggleComments">
        <span class="action-icon">
          <el-icon :size="18"><ChatDotSquare /></el-icon>
        </span>
        <span>评论</span>
      </button>
    </div>

    <div v-if="showCommentSection" class="comment-section">
      <div class="comments-list">
        <div v-if="comments.length === 0" class="no-comments">暂无评论，快来抢沙发吧~</div>
        <div v-for="comment in comments" :key="comment.id" class="comment-item">
          <el-avatar :size="28" :src="comment.user?.avatar">
            {{ comment.user?.username?.charAt(0).toUpperCase() || 'U' }}
          </el-avatar>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-username">{{ comment.user?.username || '匿名' }}</span>
              <span class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</span>
            </div>
            <p class="comment-text">{{ comment.content }}</p>
          </div>
        </div>
      </div>
      <div class="comment-input-wrapper">
        <el-input
          v-model="commentText"
          placeholder="写下你的评论..."
          :disabled="commentSubmitting"
          @keyup.enter="submitComment"
        >
          <template #append>
            <el-button
              :loading="commentSubmitting"
              :disabled="!commentText.trim()"
              @click="submitComment"
            >
              发送
            </el-button>
          </template>
        </el-input>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { ElMessage } from 'element-plus'
import {
  MoreFilled,
  Delete,
  Heart,
  ChatDotSquare
} from '@element-plus/icons-vue'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['delete', 'like', 'comment'])

const showCommentSection = ref(false)
const comments = ref([])
const commentText = ref('')
const commentSubmitting = ref(false)

const relativeTime = computed(() => {
  if (!props.post.createdAt) return ''
  return dayjs(props.post.createdAt).fromNow()
})

const imageGridClass = computed(() => {
  const len = props.post.images?.length || 0
  if (len === 0) return ''
  if (len === 1) return 'grid-1'
  if (len === 2) return 'grid-2'
  if (len === 3) return 'grid-3'
  if (len === 4) return 'grid-4'
  return 'grid-many'
})

function handleCommand(command) {
  if (command === 'delete') {
    emit('delete', props.post.id)
  }
}

function handleLike() {
  emit('like', props.post.id)
}

function toggleComments() {
  showCommentSection.value = !showCommentSection.value
  if (showCommentSection.value && comments.value.length === 0) {
    emit('comment', { id: props.post.id, action: 'fetch' })
  }
}

function formatRelativeTime(time) {
  if (!time) return ''
  return dayjs(time).fromNow()
}

async function submitComment() {
  const text = commentText.value.trim()
  if (!text || commentSubmitting.value) return

  commentSubmitting.value = true
  try {
    emit('comment', { id: props.post.id, action: 'submit', content: text })
    commentText.value = ''
  } catch {
    ElMessage.error('评论发送失败')
  } finally {
    commentSubmitting.value = false
  }
}

function handleImagePreview(index) {
  if (props.post.images && props.post.images.length > 0) {
    emit('preview', { images: props.post.images, index })
  }
}

function setComments(commentList) {
  comments.value = commentList || []
}

defineExpose({ setComments, showCommentSection })
</script>

<style scoped>
.post-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s;
}

.post-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.post-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
}

.post-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.post-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.post-username {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.post-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.post-more-btn {
  flex-shrink: 0;
}

.post-content {
  margin-bottom: 12px;
}

.post-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.post-images {
  display: grid;
  gap: 4px;
  margin-bottom: 12px;
}

.post-images.grid-1 {
  grid-template-columns: 1fr;
  max-width: 400px;
}

.post-images.grid-2 {
  grid-template-columns: 1fr 1fr;
}

.post-images.grid-3 {
  grid-template-columns: 1fr 1fr 1fr;
}

.post-images.grid-4 {
  grid-template-columns: 1fr 1fr;
}

.post-images.grid-many {
  grid-template-columns: repeat(3, 1fr);
}

.post-image-item {
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  aspect-ratio: 1;
  background: #f5f5f5;
}

.post-image-item.image-full {
  aspect-ratio: 16 / 9;
}

.post-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.post-image-item:hover img {
  transform: scale(1.05);
}

.post-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-extra-light);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: color 0.2s;
  user-select: none;
}

.stat-item:hover {
  color: var(--el-color-primary);
}

.stat-item .liked {
  color: #f56c6c;
}

.post-actions {
  display: flex;
  border-top: 1px solid var(--el-border-color-extra-light);
  padding-top: 8px;
  gap: 8px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.action-btn.liked {
  color: #f56c6c;
}

.action-btn.liked:hover {
  background-color: #fef0f0;
}

.action-icon {
  display: flex;
  align-items: center;
}

.comment-section {
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-extra-light);
  padding-top: 12px;
}

.comments-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.no-comments {
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  padding: 16px 0;
}

.comment-item {
  display: flex;
  gap: 8px;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}

.comment-username {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.comment-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.comment-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  word-break: break-word;
}

.comment-input-wrapper {
  display: flex;
  gap: 8px;
}

:deep(.comment-input-wrapper .el-input-group__append) {
  padding: 0;
}

:deep(.comment-input-wrapper .el-input-group__append .el-button) {
  margin: 0;
  border-radius: 0;
  height: 100%;
}
</style>
