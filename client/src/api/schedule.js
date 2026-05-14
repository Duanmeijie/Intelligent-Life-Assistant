import request from './request'

export function getSchedules(params) {
  return request({
    url: '/schedules',
    method: 'get',
    params
  })
}

export function createSchedule(data) {
  return request({
    url: '/schedules',
    method: 'post',
    data
  })
}

export function updateSchedule(id, data) {
  return request({
    url: `/schedules/${id}`,
    method: 'put',
    data
  })
}

export function deleteSchedule(id) {
  return request({
    url: `/schedules/${id}`,
    method: 'delete'
  })
}

export function updateScheduleStatus(id, status) {
  return request({
    url: `/schedules/${id}/status`,
    method: 'put',
    data: { status }
  })
}
