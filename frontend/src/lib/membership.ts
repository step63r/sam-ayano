/**
 * 会員証QRコードに入れる内容。
 * sub は貸出記録のキーに使う（メールアドレスを変更しても変わらない）。
 * email は貸出中ユーザーとして画面に表示するためだけに使う
 */
export type MembershipPayload = {
  sub: string;
  email: string;
};

/**
 * 会員証QRコードの文字列を作る。
 * btoa は Latin1 の範囲外の文字を扱えないため、UTF-8 のバイト列にしてから変換する
 */
export const encodeMembership = (payload: MembershipPayload): string => {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  return btoa(String.fromCharCode(...bytes));
};

/**
 * 会員証QRコードの文字列を読み取る。
 * メールアドレスだけを base64 にした旧形式のQRコードなど、読み取れないものは undefined を返す
 */
export const decodeMembership = (raw: string): MembershipPayload | undefined => {
  try {
    const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      typeof parsed === "object" && parsed !== null &&
      "sub" in parsed && typeof parsed.sub === "string" && parsed.sub !== "" &&
      "email" in parsed && typeof parsed.email === "string"
    ) {
      return { sub: parsed.sub, email: parsed.email };
    }
  } catch {
    // base64 や JSON として読めない文字列は、会員証のQRコードではない
  }
  return undefined;
};
