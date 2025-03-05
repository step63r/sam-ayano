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
};

export const initBook: Book = {
  username: '',
  seqno: 0,
  author: '',
  isbn: '',
  publisherName: '',
  salesDate: '',
  title: '',
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
}

export const initBookSummary: BookSummary = {
  seqno: 0,
  author: '',
  publisherName: '',
  title: '',
};

export type BooksLastEvaluatedKey = {
  username: string,
  seqno: number,
};

export type GetBooksResponse = {
  items: BookSummary[],
  lastEvaluatedKey?: BooksLastEvaluatedKey
};
