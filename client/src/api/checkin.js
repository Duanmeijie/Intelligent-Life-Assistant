import request from './request'

export function createCheckin(data) {
  return request({
    url: '/checkins',
    method: 'post',
    data
  })
}

export function getCheckins(params) {
  return request({
    url: '/checkins',
    method: 'get',
    params
  })
}

export function getCheckinStats(params) {
  return request({
    url: '/checkins/stats',
    method: 'get',
    params
  })
}

export function deleteCheckin(id) {
  return request({
    url: `/checkins/${id}`,
    method: 'delete'
  })
}
