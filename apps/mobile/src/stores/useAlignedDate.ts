import { useEffect } from 'react';
import { isValidDateKey } from '@health-tracker/core';
import { useHealthStore } from './useHealthStore';

/**
 * 表单页用：把路由参数里的 date 与 store 的 selectedDate 对齐。
 * 正常从今日页进入时两者一致（no-op）；通过 deep link 直接打开时，
 * 切换 store 到 URL 指定日期，保证「显示的记录日期」和「实际写入日期」一致。
 * 返回当前生效的记录日期。
 */
export function useAlignedDate(paramDate: string | undefined): string {
  const selectedDate = useHealthStore((s) => s.selectedDate);
  const setSelectedDate = useHealthStore((s) => s.setSelectedDate);
  const target = paramDate && isValidDateKey(paramDate) ? paramDate : selectedDate;

  useEffect(() => {
    if (target !== selectedDate) setSelectedDate(target);
  }, [target, selectedDate, setSelectedDate]);

  return target;
}
