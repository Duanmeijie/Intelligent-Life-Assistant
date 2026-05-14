const success = (data = null, message = '操作成功') => {
  return {
    success: true,
    code: 200,
    message,
    data
  };
};

const error = (message = '操作失败', code = 400, errors = null) => {
  const response = {
    success: false,
    code,
    message
  };
  if (errors) {
    response.errors = errors;
  }
  return response;
};

const paginated = (list = [], total = 0, page = 1, pageSize = 10) => {
  return {
    success: true,
    code: 200,
    message: '获取成功',
    data: {
      list,
      total,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
      totalPages: Math.ceil(total / pageSize)
    }
  };
};

const created = (data = null, message = '创建成功') => {
  return {
    success: true,
    code: 201,
    message,
    data
  };
};

module.exports = { success, error, paginated, created };