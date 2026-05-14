import request from './request'

export function getHabits() {
  return request({
    url: '/habits',
    method: 'get'
  })
}

export function createHabit(data) {
  return request({
    url: '/habits',
    method: 'post',
    data
  })
}

export function updateHabit(id, data) {
  return request({
    url: `/habits/${id}`,
    method: 'put',
    data
  })
}

export function deleteHabit(id) {
  return request({
    url: `/habits/${id}`,
    method: 'delete'
  })
}
