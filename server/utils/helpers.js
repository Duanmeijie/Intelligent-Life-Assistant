const crypto = require('crypto');
const dayjs = require('dayjs');

const generateRandomPassword = (length = 16) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const allChars = uppercase + lowercase + digits;
  let password = '';

  password += uppercase[crypto.randomInt(uppercase.length)];
  password += lowercase[crypto.randomInt(lowercase.length)];
  password += digits[crypto.randomInt(digits.length)];

  for (let i = password.length; i < length; i++) {
    password += allChars[crypto.randomInt(allChars.length)];
  }

  return password.split('').sort(() => crypto.randomInt(-1, 2)).join('');
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const calculateStreak = (checkinDates) => {
  if (!checkinDates || checkinDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sortedDates = checkinDates
    .map(date => dayjs(date).format('YYYY-MM-DD'))
    .sort()
    .reverse();

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  const today = dayjs().format('YYYY-MM-DD');
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  const mostRecentDate = sortedDates[0];
  if (mostRecentDate !== today && mostRecentDate !== yesterday) {
    currentStreak = 0;
  } else {
    currentStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const currentDate = dayjs(sortedDates[i - 1]);
      const previousDate = dayjs(sortedDates[i]);
      const diff = currentDate.diff(previousDate, 'day');
      if (diff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  for (let i = 1; i < sortedDates.length; i++) {
    const currentDate = dayjs(sortedDates[i - 1]);
    const previousDate = dayjs(sortedDates[i]);
    const diff = currentDate.diff(previousDate, 'day');
    if (diff === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
};

const getDateRange = (days = 7) => {
  const endDate = dayjs().endOf('day');
  const startDate = dayjs().subtract(days - 1, 'day').startOf('day');
  return {
    startDate: startDate.toDate(),
    endDate: endDate.toDate(),
    start: startDate.format('YYYY-MM-DD HH:mm:ss'),
    end: endDate.format('YYYY-MM-DD HH:mm:ss')
  };
};

const toSafeInteger = (value, defaultValue = 0) => {
  const num = parseInt(value, 10);
  return isNaN(num) ? defaultValue : num;
};

const maskString = (str, start = 3, end = 4, maskChar = '*') => {
  if (!str) return '';
  const strLen = str.length;
  if (strLen <= start + end) return str;
  const maskedLength = strLen - start - end;
  return str.substring(0, start) + maskChar.repeat(maskedLength) + str.substring(strLen - end);
};

const getPagination = (query, defaultPageSize = 10) => {
  const page = parseInt(query.page, 10) || 1;
  const pageSize = parseInt(query.pageSize, 10) || defaultPageSize;
  const offset = (page - 1) * pageSize;
  return { page, pageSize, offset };
};

module.exports = {
  generateRandomPassword,
  validateEmail,
  calculateStreak,
  getDateRange,
  toSafeInteger,
  maskString,
  getPagination
};
