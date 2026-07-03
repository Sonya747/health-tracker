import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  buildExportBundle,
  exportDailyNotesToCsv,
  exportRecordsToCsv,
  exportToJson,
  todayKey,
} from '@health-tracker/core';
import * as repo from '../db/repo';

function writeTempFile(name: string, content: string): string {
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  file.write(content);
  return file.uri;
}

/** 导出全部数据为 JSON 并调起系统分享（由用户主动选择保存位置） */
export async function exportJson(): Promise<void> {
  const bundle = buildExportBundle(
    repo.getCategories(),
    repo.getAllRecords(),
    repo.getAllDailyNotes(),
    new Date().toISOString(),
  );
  const uri = writeTempFile(`health-tracker-${todayKey()}.json`, exportToJson(bundle));
  await Sharing.shareAsync(uri, { mimeType: 'application/json', dialogTitle: '导出健康记录 JSON' });
}

/** 导出记录 CSV（记录 + 每日备注两个文件，依次分享） */
export async function exportCsv(): Promise<void> {
  // ﻿ BOM：让 Excel 按 UTF-8 打开中文不乱码
  const recordsCsv = exportRecordsToCsv(repo.getAllRecords(), repo.getCategories());
  const uri = writeTempFile(`health-tracker-records-${todayKey()}.csv`, '﻿' + recordsCsv);
  await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: '导出健康记录 CSV' });

  const notes = repo.getAllDailyNotes();
  if (notes.length > 0) {
    const notesUri = writeTempFile(
      `health-tracker-daily-notes-${todayKey()}.csv`,
      '﻿' + exportDailyNotesToCsv(notes),
    );
    await Sharing.shareAsync(notesUri, { mimeType: 'text/csv', dialogTitle: '导出每日备注 CSV' });
  }
}
