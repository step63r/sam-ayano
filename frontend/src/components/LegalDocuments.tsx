import React from "react";

import { PrivacyPolicyContent } from "./PrivacyPolicy";
import { TermsContent } from "./Terms";

/**
 * 利用規約とプライバシーポリシーを続けて表示する。
 * 新規登録画面と再同意画面で、同意の対象となる本文を 1 つの枠にまとめて見せるために使う
 */
const LegalDocuments: React.FC = () => (
  <div className="flex flex-col gap-8">
    <section aria-labelledby="legal-terms-title" className="flex flex-col gap-3">
      <h2 id="legal-terms-title" className="border-b pb-2 text-lg font-bold">利用規約</h2>
      <TermsContent />
    </section>
    <section aria-labelledby="legal-privacy-title" className="flex flex-col gap-3">
      <h2 id="legal-privacy-title" className="border-b pb-2 text-lg font-bold">プライバシーポリシー</h2>
      <PrivacyPolicyContent />
    </section>
  </div>
);

export default LegalDocuments;
