import request from './request'

export function uploadSingle(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/upload/single',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function uploadMultiple(files) {
  const formData = new FormData()
  files.forEach((file) => {
    formData.append('files', file)
  })
  return request({
    url: '/upload/multiple',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function deleteUpload(filename) {
  return request({
    url: `/upload/${filename}`,
    method: 'delete'
  })
}
