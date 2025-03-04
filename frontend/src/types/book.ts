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
  /** 説明文 */
  itemCaption: string,
  /** 価格 */
  itemPrice: number,
  /** 出版社 */
  publisherName: string,
  /** 発売日 */
  salesDate: string,
  /** タイトル */
  title: string,
};

export const initBook = {
  username: '',
  seqno: 0,
  author: '',
  isbn: '',
  itemCaption: '',
  itemPrice: 0,
  publisherName: '',
  salesDate: '',
  title: '',
};
