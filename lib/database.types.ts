export type ReadingStatus = 'WANT_TO_READ' | 'READING' | 'FINISHED' | 'PAUSED';
export type ReadingSource = 'WECHAT_READING' | 'KINDLE' | 'PAPER' | 'OTHER';
export interface Book { id:string; title:string; subtitle:string|null; author:string|null; cover_url:string|null; description:string|null; publisher:string|null; publish_year:number|null; isbn:string|null; total_pages:number|null; toc_json:unknown|null; metadata_source:string|null; created_at:string; updated_at:string }
export interface ReadingSession { id:string; book_id:string; status:ReadingStatus; reading_source:ReadingSource; started_at:string|null; finished_at:string|null; current_page:number|null; current_chapter:string|null; user_reflection:string|null; created_at:string; updated_at:string }
export interface ProgressLog { id:string; reading_session_id:string; log_date:string; page_number:number|null; chapter_text:string|null; created_at:string }
