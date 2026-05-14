<template>
  <div class="social-page">
    <div class="page-header">
      <h2>社区动态</h2>
      <el-button type="primary" :icon="Edit" @click="showCreateDialog">
        发布动态
      </el-button>
    </div>

    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else>
      <div v-if="posts.length === 0" class="empty-state">
        <el-empty description="还没有动态，快来发布第一条吧" />
      </div>

      <div v-else class="post-list">
        <el-card
          v-for="post in posts"
          :key="post.id"
          shadow="never"
          class="post-card"
        >
          <div class="post-header">
            <div class="post-user">
              <el-avatar :size="40" :src="post.avatar || undefined">
                {{ post.nickname || post.username?.charAt(0)?.toUpperCase() }}
              </el-avatar>
              <div class="user-info">
                <span class="user-name">{{ post.nickname || post.username }}</span>
                <span class="post-time">{{ formatTime(post.created_at) }}</span>
              </div>
            </div>
            <el-button
              v-if="post.user_id === currentUserId"
              text
              type="danger"
              size="small"
              :icon="Delete"
              @click="handleDeletePost(post.id)"
              :loading="deleteLoading[post.id]"
            />
          </div>

          <div class="post-content">{{ post.content }}</div>

          <div v-if="post.images && post.images.length > 0" class="post-images" :class="imageGridClass(post.images.length)">
            <img
              v-for="(img, idx) in post.images"
              :key="idx"
              :src="img"
              class="post-image"
              @click="previewImage(img)"
            />
          </div>

          <div class="post-actions">
            <el-button
              text
              :type="likedPosts.has(post.id) ? 'danger' : 'default'"
              :icon="likedPosts.has(post.id) ? 'HeartFilled' : 'Heart'"
              @click="handleLike(post)"
              :loading="likeLoading[post.id]"
            >
              {{ post.likes_count }}
            </el-button>
            <el-button
              text
              type="default"
              icon="ChatLineSquare"
              @click="toggleComments(post)"
            >
              {{ post.comments_count }}
            </el-button>
          </div>

          <div v-if="expandedComments[post.id]" class="comment-section">
            <div v-if="commentsLoading[post.id]" class="comments-loading">
              <el-skeleton :rows="2" animated />
            </div>
            <template v-else>
              <div v-if="postComments[post.id]?.length === 0" class="no-comments">
                暂无评论
              </div>
              <div v-else class="comments-list">
                <div
                  v-for="comment in postComments[post.id]"
                  :key="comment.id"
                  class="comment-item"
                >
                  <span class="comment-user">{{ comment.nickname || comment.username }}</span>
                  <span class="comment-content">{{ comment.content }}</span>
                  <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
                </div>
              </div>
            </template>
            <div class="comment-input-row">
              <el-input
                v-model="commentInputs[post.id]"
                placeholder="输入评论..."
                size="small"
                @keyup.enter="handleAddComment(post.id)"
                :disabled="commentSubmitting[post.id]"
              />
              <el-button
                type="primary"
                size="small"
                @click="handleAddComment(post.id)"
                :loading="commentSubmitting[post.id]"
                :disabled="!commentInputs[post.id]?.trim()"
              >
                发送
              </el-button>
            </div>
          </div>
        </el-card>
      </div>

      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="total"
          layout="prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </template>

    <el-dialog
      v-model="createDialogVisible"
      title="发布动态"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="newPostContent"
        type="textarea"
        :rows="5"
        placeholder="分享你的生活点滴..."
        maxlength="2000"
        show-word-limit
      />
      <div class="image-url-section">
        <div
          v-for="(url, idx) in newPostImages"
          :key="idx"
          class="image-url-row"
        >
          <el-input
            v-model="newPostImages[idx]"
            :placeholder="`图片链接 ${idx + 1}`"
            size="small"
          />
          <el-button
            text
            type="danger"
            :icon="Delete"
            size="small"
            @click="removeImageUrl(idx)"
          />
        </div>
        <el-button
          v-if="newPostImages.length < 6"
          text
          type="primary"
          :icon="Plus"
          size="small"
          @click="addImageUrl"
        >
          添加图片链接
        </el-button>
      </div>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleCreatePost"
          :loading="createLoading"
          :disabled="!newPostContent.trim()"
        >
          发布
        </el-button>
      </template>
    </el-dialog>

    <el-image-viewer
      v-if="previewVisible"
      :url-list="[previewUrl]"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Plus } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import { getPosts, createPost, deletePost, likePost, getComments, commentPost } from '@/api/social'
import { useAuthStore } from '@/stores/auth'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.userId)

const posts = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const deleteLoading = reactive({})
const likeLoading = reactive({})
const commentsLoading = reactive({})
const commentSubmitting = reactive({})

const likedPosts = ref(new Set())
const expandedComments = ref({})
const postComments = ref({})
const commentInputs = ref({})

const createDialogVisible = ref(false)
const newPostContent = ref('')
const newPostImages = ref([])
const createLoading = ref(false)

const previewVisible = ref(false)
const previewUrl = ref('')

function formatTime(time) {
  return dayjs(time).fromNow()
}

function imageGridClass(count) {
  if (count === 1) return 'grid-1'
  if (count === 2) return 'grid-2'
  if (count === 3) return 'grid-3'
  if (count === 4) return 'grid-4'
  return 'grid-many'
}

function previewImage(url) {
  previewUrl.value = url
  previewVisible.value = true
}

async function fetchPosts() {
  loading.value = true
  try {
    const res = await getPosts({ page: currentPage.value, pageSize: pageSize.value })
    if (res.data && res.data.list) {
      posts.value = res.data.list.map(p => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : []
      }))
      total.value = res.data.total || 0
    } else if (Array.isArray(res.data)) {
      posts.value = res.data.map(p => ({
        ...p,
        images: Array.isArray(p.images) ? p.images : []
      }))
      total.value = posts.value.length
    } else {
      posts.value = []
      total.value = 0
    }
  } catch (error) {
    console.error('获取动态列表失败:', error)
    posts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function handlePageChange(page) {
  currentPage.value = page
  fetchPosts()
  expandedComments.value = {}
  postComments.value = {}
}

function toggleComments(post) {
  if (expandedComments.value[post.id]) {
    expandedComments.value[post.id] = false
    return
  }
  expandedComments.value[post.id] = true
  if (!postComments.value[post.id]) {
    fetchComments(post.id)
  }
}

async function fetchComments(postId) {
  commentsLoading.value[postId] = true
  try {
    const res = await getComments(postId)
    if (Array.isArray(res.data)) {
      postComments.value[postId] = res.data
    } else if (Array.isArray(res)) {
      postComments.value[postId] = res
    } else {
      postComments.value[postId] = []
    }
  } catch (error) {
    console.error('获取评论失败:', error)
    postComments.value[postId] = []
  } finally {
    commentsLoading.value[postId] = false
  }
}

async function handleLike(post) {
  likeLoading.value[post.id] = true
  try {
    const res = await likePost(post.id)
    const isLiked = res.data?.isLiked
    if (isLiked) {
      likedPosts.value.add(post.id)
      post.likes_count = (post.likes_count || 0) + 1
    } else {
      likedPosts.value.delete(post.id)
      post.likes_count = Math.max(0, (post.likes_count || 0) - 1)
    }
  } catch (error) {
    console.error('点赞操作失败:', error)
  } finally {
    likeLoading.value[post.id] = false
  }
}

async function handleAddComment(postId) {
  const content = commentInputs.value[postId]?.trim()
  if (!content) return
  commentSubmitting.value[postId] = true
  try {
    const res = await commentPost(postId, { content })
    if (!postComments.value[postId]) {
      postComments.value[postId] = []
    }
    if (res.data) {
      postComments.value[postId].push(res.data)
    }
    const post = posts.value.find(p => p.id === postId)
    if (post) {
      post.comments_count = (post.comments_count || 0) + 1
    }
    commentInputs.value[postId] = ''
  } catch (error) {
    console.error('评论失败:', error)
  } finally {
    commentSubmitting.value[postId] = false
  }
}

function showCreateDialog() {
  newPostContent.value = ''
  newPostImages.value = []
  createDialogVisible.value = true
}

function addImageUrl() {
  newPostImages.value.push('')
}

function removeImageUrl(idx) {
  newPostImages.value.splice(idx, 1)
}

async function handleCreatePost() {
  if (!newPostContent.value.trim()) return
  createLoading.value = true
  try {
    const images = newPostImages.value.filter(url => url.trim())
    const res = await createPost({
      content: newPostContent.value,
      images
    })
    ElMessage.success('动态发布成功')
    createDialogVisible.value = false
    currentPage.value = 1
    await fetchPosts()
  } catch (error) {
    console.error('发布动态失败:', error)
  } finally {
    createLoading.value = false
  }
}

async function handleDeletePost(postId) {
  try {
    await ElMessageBox.confirm('确定要删除这条动态吗？', '确认删除', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
    deleteLoading[postId] = true
    await deletePost(postId)
    posts.value = posts.value.filter(p => p.id !== postId)
    total.value = Math.max(0, total.value - 1)
    ElMessage.success('动态已删除')
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除动态失败:', error)
    }
  } finally {
    deleteLoading[postId] = false
  }
}

onMounted(() => {
  fetchPosts()
})
</script>

<style scoped>
.social-page {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 22px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 60px 0;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  border-radius: 12px;
}

.post-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.post-user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.post-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.post-content {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.post-images {
  display: grid;
  gap: 6px;
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
  grid-template-columns: 1fr 1fr 1fr;
}

.post-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.post-image:hover {
  opacity: 0.85;
}

.post-actions {
  display: flex;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.comment-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.comments-loading {
  padding: 8px 0;
}

.no-comments {
  text-align: center;
  color: var(--el-text-color-placeholder);
  font-size: 13px;
  padding: 12px 0;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
  max-height: 240px;
  overflow-y: auto;
}

.comment-item {
  font-size: 13px;
  line-height: 1.6;
}

.comment-user {
  font-weight: 500;
  color: var(--el-color-primary);
  margin-right: 6px;
}

.comment-content {
  color: var(--el-text-color-regular);
  word-break: break-word;
}

.comment-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-left: 8px;
}

.comment-input-row {
  display: flex;
  gap: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding: 16px 0;
}

.image-url-section {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.image-url-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 600px) {
  .post-images.grid-3,
  .post-images.grid-many {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
