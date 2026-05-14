import request from './request'

export function getPosts(params) {
  return request({
    url: '/social/posts',
    method: 'get',
    params
  })
}

export function createPost(data) {
  return request({
    url: '/social/posts',
    method: 'post',
    data
  })
}

export function deletePost(id) {
  return request({
    url: `/social/posts/${id}`,
    method: 'delete'
  })
}

export function likePost(id) {
  return request({
    url: `/social/posts/${id}/like`,
    method: 'post'
  })
}

export function commentPost(id, data) {
  return request({
    url: `/social/posts/${id}/comments`,
    method: 'post',
    data
  })
}

export function getComments(id) {
  return request({
    url: `/social/posts/${id}/comments`,
    method: 'get'
  })
}
