const RecurrenceDay = {
  MO: '월요일',
  TU: '화요일',
  WE: '수요일',
  TH: '목요일',
  FR: '금요일',
  SA: '토요일',
  SU: '일요일',
};

const RecurrenceType = {
  NONE: '일정 반복 없음',
  DAILY: '매일',
  WEEKLY: {
    EVERY_DAY: '매주',
    WEEKDAYS: '주중',
  },
  MONTHLY: {
    EVERY_DAY: '매월',
    NTH_DAY: '매월',
    NTH_WEEKDAY: '매월',
  },
  YEARLY: '매년',
};

const getRecurrenceEvent = (recurrence) => {
  if (!recurrence || recurrence.length === 0) {
    return RecurrenceType.NONE;
  }

  const rule = recurrence[0];

  if (rule.includes('FREQ=DAILY')) {
    return RecurrenceType.DAILY;
  }

  if (rule.includes('FREQ=WEEKLY')) {
    if (rule.includes('BYDAY=MO,TU,WE,TH,FR')) {
      return RecurrenceType.WEEKLY.WEEKDAYS;
    }

    if (rule.includes('BYDAY')) {
      const days = rule.split('BYDAY=')[1].split(',');
      if (days.length === 5 && days.every((day) => RecurrenceDay[day])) {
        return `${RecurrenceType.WEEKLY.EVERY_DAY} ${RecurrenceType.WEEKLY.WEEKDAYS}`;
      }
      return `${RecurrenceType.WEEKLY.EVERY_DAY} ${days
        .map((day) => RecurrenceDay[day])
        .join(', ')}`;
    }
  }

  if (rule.includes('FREQ=MONTHLY')) {
    if (
      rule.includes('BYDAY=') &&
      /\d/.test(rule.split('BYDAY=')[1].charAt(0))
    ) {
      const nthDay = rule.split('BYDAY=')[1].match(/\d+/)[0];
      const day = rule.split(/\d+/)[1];
      return `${RecurrenceType.MONTHLY.NTH_DAY} ${nthDay}번째 ${
        RecurrenceDay[day] || 'undefined'
      }`;
    }
    return RecurrenceType.MONTHLY.EVERY_DAY;
  }

  if (rule.includes('FREQ=YEARLY')) {
    return RecurrenceType.YEARLY;
  }

  return RecurrenceType.NONE;
};

module.exports = { getRecurrenceEvent };
