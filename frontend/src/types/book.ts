/**
 * 書籍の定義
 */
export type Book = {
  /** ユーザー名 */
  username: string,
  /** シーケンス番号 */
  seqno: number,
  /** 著者 */
  author: string,
  /** ISBN */
  isbn: string,
  /** 出版社 */
  publisherName: string,
  /** 発売日 */
  salesDate: string,
  /** タイトル */
  title: string,
  //** タイトル（カナ） */
  titleKana: string,
  /** 読んだフラグ */
  readFlag: boolean,
  /** 感想 */
  note: string,
  /** 貸出中フラグ */
  lendFlag?: boolean,
  /** 貸出ID */
  rentalId?: number,
  /** 貸出中ユーザー名 */
  renterUsername?: string,
  /** 貸出日時 */
  rentalDate?: number,
};

export const initBook: Book = {
  username: '',
  seqno: 0,
  author: '',
  isbn: '',
  publisherName: '',
  salesDate: '',
  title: '',
  titleKana: '',
  readFlag: false,
  note: '',
  lendFlag: false,
  rentalId: 0,
  renterUsername: '',
  rentalDate: 0,
};

export type BookSummary = {
  /** シーケンス番号 */
  seqno: number,
  /** 著者 */
  author: string,
  /** 出版社 */
  publisherName: string,
  /** タイトル */
  title: string,
  /** 貸出中フラグ */
  lendFlag?: boolean,
}

export const initBookSummary: BookSummary = {
  seqno: 0,
  author: '',
  publisherName: '',
  title: '',
  lendFlag: false,
};

export type BooksLastEvaluatedKey = {
  username: string,
  seqno: number,
};

export type GetBooksResponse = {
  items: BookSummary[],
  lastEvaluatedKey?: BooksLastEvaluatedKey
};
