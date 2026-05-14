import request from './request'

export function getRecommendHabits() {
  return request({
    url: '/ai/recommend-habits',
    method: 'get'
  })
}

export function getAnalysis(params) {
  return request({
    url: '/ai/analysis',
    method: 'get',
    params
  })
}

export function getScheduleSuggest() {
  return request({
    url: '/ai/schedule-suggest',
    method: 'get'
  })
}
