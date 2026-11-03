import axios from "axios";
import { fetchAuthSession } from "aws-amplify/auth";

import config from "../config.json";

/** 書影URLの長さの上限（サーバー側の検証と同じ値） */
const MAX_COVER_URL_LENGTH = 500;

/**
 * 外部 API から受け取った書影URLを検証する。
 * img 要素に直接渡すため https の URL だけを受け付ける（http は https のページで読み込めない）。
 * サーバー側(update-books/cover.mjs)でも同じ検証をしているが、
 * 保存に失敗する値を送らないよう、クライアントでも事前に弾く
 * @param value 書影URL（空文字や未定義も受け付ける）
 * @returns 検証を通った書影URL。通らなければ undefined
 */
export const normalizeCoverUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const url = value.trim();
  if (url.length === 0 || url.length > MAX_COVER_URL_LENGTH) {
    return undefined;
  }

  try {
    return new URL(url).protocol === "https:" ? url : undefined;
  } catch {
    return undefined;
  }
};

/**
 * openBD から書影URLを探す。openBD は書影を持たない本が多く、その場合は undefined を返す。
 * 失敗しても例外にしない（理由は findRakutenCoverUrl と同じ）
 * @param isbnjan ISBN/JANコード
 */
export const findOpenBdCoverUrl = async (isbnjan: string): Promise<string | undefined> => {
  try {
    const session = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();

    const response = await axios.post(`${config.ApiEndpoint}/search-openbd`, {
      isbnjan: isbnjan,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    return normalizeCoverUrl(response.data?.summary?.cover);
  } catch (error) {
    console.log("findOpenBdCoverUrl failed (ignored)", error);
    return undefined;
  }
};

/**
 * 書影URLを探す。openBD を先に試し、無ければ楽天ブックスで探す。
 * openBD は認証情報が不要で、楽天のようなリクエスト間隔の制限も厳しくないため、先に使う
 * @param isbnjan ISBN/JANコード
 */
export const findCoverUrl = async (isbnjan: string): Promise<string | undefined> => {
  return (await findOpenBdCoverUrl(isbnjan)) ?? (await findRakutenCoverUrl(isbnjan));
};

/**
 * 書影URLだけを保存する。タイトルなど他の項目には触れない（画面にまだ保存していない編集内容があっても影響しない）
 * @param seqno 書籍のシーケンス番号
 * @param coverUrl 書影URL
 * @returns 保存できたら true
 */
export const saveCoverUrl = async (seqno: number, coverUrl: string): Promise<boolean> => {
  try {
    const session = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();

    await axios.post(`${config.ApiEndpoint}/update-books`, {
      data: {
        seqno: seqno,
        coverOnly: true,
        coverUrl: coverUrl,
      },
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    return true;
  } catch (error) {
    console.log("saveCoverUrl ERROR!", error);
    return false;
  }
};

/**
 * 楽天ブックスから書影URLを探す。
 * openBD は書影を持たない本が多い（summary.cover が空）ため、その場合の補助として使う。
 * 書影は付加的な情報なので、見つからなくても、通信に失敗しても、登録は止めずに undefined を返す
 * （ここでエラーを表示すると、書影が無いだけで登録できなくなってしまう）
 * @param isbnjan ISBN/JANコード
 */
export const findRakutenCoverUrl = async (isbnjan: string): Promise<string | undefined> => {
  try {
    const session = await fetchAuthSession();
    const token = session?.tokens?.idToken?.toString();

    const response = await axios.post(`${config.ApiEndpoint}/search-rakuten-book`, {
      isbnjan: isbnjan,
    }, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": token,
      },
    });

    const item = response.data?.Item;
    return normalizeCoverUrl(item?.largeImageUrl) ?? normalizeCoverUrl(item?.mediumImageUrl);
  } catch (error) {
    console.log("findRakutenCoverUrl failed (ignored)", error);
    return undefined;
  }
};
