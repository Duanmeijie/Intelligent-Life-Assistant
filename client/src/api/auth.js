import request from './request'

export function login(data) {
  return request({
    url: '/auth/login',
    method: 'post',
    data
  })
}

export function register(data) {
  return request({
    url: '/auth/register',
    method: 'post',
    data
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

export function changePassword(data) {
  return request({
    url: '/auth/password',
    method: 'put',
    data
  })
}

export function forgotPassword(data) {
  return request({
    url: '/auth/forgot-password',
    method: 'post',
    data
  })
}

export function resetPassword(data) {
  return request({
    url: '/auth/reset-password',
    method: 'post',
    data
  })
}

export function getSettings() {
  return request({
    url: '/auth/settings',
    method: 'get'
  })
}

export function updateSettings(data) {
  return request({
    url: '/auth/settings',
    method: 'put',
    data
  })
}
