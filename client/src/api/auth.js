import request from './request'

export function login(username, password) {
  return request({
    url: '/auth/login',
    method: 'post',
    data: { username, password }
  })
}

export function register(username, email, password) {
  return request({
    url: '/auth/register',
    method: 'post',
    data: { username, email, password }
  })
}

export function getProfile() {
  return request({
    url: '/auth/profile',
    method: 'get'
  })
}

export function updateProfile(data) {
  return request({
    url: '/auth/profile',
    method: 'put',
    data
  })
}

export function updatePassword(data) {
  return request({
    url: '/auth/password',
    method: 'put',
    data
  })
}
