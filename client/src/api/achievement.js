import request from './request'

export function getAchievements() {
  return request({
    url: '/achievements',
    method: 'get'
  })
}

export function getUserAchievements() {
  return request({
    url: '/achievements/user',
    method: 'get'
  })
}
