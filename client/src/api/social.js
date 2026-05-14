import request from './request'

export function getPosts(params) {
  return request({
    url: '/social',
    method: 'get',
    params
  })
}

export function createPost(data) {
  return request({
    url: '/social',
    method: 'post',
    data
  })
}

export function deletePost(id) {
  return request({
    url: `/social/${id}`,
    method: 'delete'
  })
}

export function likePost(id) {
  return request({
    url: `/social/${id}/like`,
    method: 'post'
  })
}

export function commentPost(id, data) {
  return request({
    url: `/social/${id}/comment`,
    method: 'post',
    data
  })
}

export function getComments(id) {
  return request({
    url: `/social/${id}/comments`,
    method: 'get'
  })
}
