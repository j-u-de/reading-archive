import test from "node:test";
import assert from "node:assert/strict";
import {
  addReading,
  completeSession,
  createEmptyArchive,
  getArchiveStats,
  mergeCloudArchive,
  updateProgress,
} from "../lib/archive.ts";

test("adding the same title and author creates one book and two reading sessions", () => {
  let archive = createEmptyArchive();
  archive = addReading(archive, { title: "红楼梦", author: "曹雪芹", status: "FINISHED", finishedAt: "2026-01-10" }, "session-1", "book-1");
  archive = addReading(archive, { title: " 红楼梦 ", author: "曹 雪芹", status: "READING", startedAt: "2026-08-30" }, "session-2", "book-2");
  assert.equal(archive.books.length, 1);
  assert.equal(archive.sessions.length, 2);
  assert.equal(archive.sessions[0].bookId, archive.sessions[1].bookId);
});

test("cloud archive merge keeps local-only records and avoids duplicate ids", () => {
  let archive = addReading(createEmptyArchive(), { title: "本地书", status: "READING" }, "local-session", "local-book");
  const merged = mergeCloudArchive(archive, { books: [{ id: "cloud-book", title: "云端书", author: "作者", created_at: "2026-08-30T00:00:00Z" }], sessions: [{ id: "cloud-session", book_id: "cloud-book", status: "FINISHED", source: "PAPER", finished_at: "2026-08-29", created_at: "2026-08-29T00:00:00Z" }] });
  assert.equal(merged.books.length, 2);
  assert.equal(merged.sessions.length, 2);
  assert.equal(merged.books.filter((book) => book.id === "local-book").length, 1);
});

test("progress update preserves a dated history entry", () => {
  let archive = addReading(createEmptyArchive(), { title: "测试书", status: "READING" }, "session-1", "book-1");
  archive = updateProgress(archive, "session-1", { currentPage: 186, currentChapter: "第 7 章", date: "2026-08-30" }, "log-1");
  assert.equal(archive.sessions[0].currentPage, 186);
  assert.equal(archive.progressLogs[0].currentChapter, "第 7 章");
});

test("finishing a session records the date and contributes to month and year stats", () => {
  let archive = addReading(createEmptyArchive(), { title: "测试书", status: "READING", startedAt: "2026-08-05" }, "session-1", "book-1");
  archive = completeSession(archive, "session-1", "2026-08-29");
  assert.equal(archive.sessions[0].status, "FINISHED");
  assert.equal(archive.sessions[0].finishedAt, "2026-08-29");
  const stats = getArchiveStats(archive, new Date("2026-08-30T12:00:00+08:00"));
  assert.deepEqual({ total: stats.totalFinished, year: stats.yearFinished, month: stats.monthFinished }, { total: 1, year: 1, month: 1 });
});
