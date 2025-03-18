import React from "react";

import {
  Divider,
  Grid2 as Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";

/**
 * プライバシーポリシー
 * @returns コンポーネント
 */
const PrivacyPolicy: React.FC = () => {
  return (
    <Grid margin={2} paddingBottom={2}>
      <Stack spacing={2} direction="column">
        <Typography variant='subtitle1' component='div' sx={{ textAlign: 'center'}}>
          プライバシーポリシー
        </Typography>
        <Divider />
        <Typography variant="body2" gutterBottom>
          minato project（以下，「当社」といいます。）は，
          本ウェブサイト上で提供するサービス（以下,「本サービス」といいます。）における，
          ユーザーの個人情報の取扱いについて，
          以下のとおりプライバシーポリシー（以下，「本ポリシー」といいます。）を定めます。
        </Typography>

        {/* 第1条（個人情報） */}
        <Typography variant="subtitle1" gutterBottom>
          第1条（個人情報）
        </Typography>
        <Typography variant="body2" gutterBottom>
          「個人情報」とは，個人情報保護法にいう「個人情報」を指すものとし，
          生存する個人に関する情報であって，
          当該情報に含まれる氏名，生年月日，住所，電話番号，連絡先その他の記述等により特定の個人を識別できる情報
          及び容貌，指紋，声紋にかかるデータ，及び健康保険証の保険者番号などの当該情報単体から
          特定の個人を識別できる情報（個人識別情報）を指します。
        </Typography>

        {/* 第2条（個人情報の収集方法） */}
        <Typography variant="subtitle1" gutterBottom>
          第2条（個人情報の収集方法）
        </Typography>
        <Typography variant="body2" gutterBottom>
          当社は，ユーザーが利用登録をする際に氏名，生年月日，住所，電話番号，メールアドレス，銀行口座番号，
          クレジットカード番号，運転免許証番号などの個人情報をお尋ねすることがあります。
          また，ユーザーと提携先などとの間でなされたユーザーの個人情報を含む取引記録や決済に関する情報を，
          当社の提携先（情報提供元，広告主，広告配信先などを含みます。以下，｢提携先｣といいます。）などから収集することがあります。
        </Typography>

        {/* 第3条（個人情報を収集・利用する目的） */}
        <Typography variant="subtitle1" gutterBottom>
          第3条（個人情報を収集・利用する目的）
        </Typography>
        <Typography variant="body2" gutterBottom>
          当社が個人情報を収集・利用する目的は，以下のとおりです。
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社サービスの提供・運営のため
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  ユーザーが利用中のサービスの新機能，更新情報，キャンペーン等
                  及び当社が提供する他のサービスの案内のメールを送付するため
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  メンテナンス，重要なお知らせなど必要に応じたご連絡のため
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  利用規約に違反したユーザーや，不正・不当な目的でサービスを
                  利用しようとするユーザーの特定をし，ご利用をお断りするため
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  ユーザーにご自身の登録情報の閲覧や変更，削除，ご利用状況の閲覧を行っていただくため
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  有料サービスにおいて，ユーザーに利用料金を請求するため
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  上記の利用目的に付随する目的
                </Typography>
              }
            />
          </ListItem>
        </List>

        {/* 第4条（利用目的の変更） */}
        <Typography variant="subtitle1" gutterBottom>
          第4条（利用目的の変更）
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社は，利用目的が変更前と関連性を有すると合理的に認められる
                  場合に限り，個人情報の利用目的を変更するものとします。
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  利用目的の変更を行った場合には，変更後の目的について，
                  当社所定の方法により，ユーザーに通知し，または本ウェブサイト上に公表するものとします。
                </Typography>
              }
            />
          </ListItem>
        </List>

        {/* 第5条（個人情報の第三者提供） */}
        <Typography variant="subtitle1" gutterBottom>
          第5条（個人情報の第三者提供）
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社は，次に掲げる場合を除いて，あらかじめユーザーの同意を得ることなく，
                  第三者に個人情報を提供することはありません。
                  ただし，個人情報保護法その他の法令で認められる場合を除きます。
                </Typography>
              }
            />
          </ListItem>
          <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    人の生命，身体または財産の保護のために必要がある
                    場合であって，本人の同意を得ることが困難であるとき
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    公衆衛生の向上または児童の健全な育成の推進のために特に
                    必要がある場合であって，本人の同意を得ることが困難であるとき
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    国の機関もしくは地方公共団体またはその委託を受けた者が
                    法令の定める事務を遂行することに対して協力する必要がある場合であって，
                    本人の同意を得ることにより当該事務の遂行に支障を及ぼすおそれがあるとき
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    予め次の事項を告知あるいは公表し，
                    かつ当社が個人情報保護委員会に届出をしたとき
                  </Typography>
                }
              />
            </ListItem>
            <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
              <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography variant="body2">
                      利用目的に第三者への提供を含むこと
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography variant="body2">
                      第三者に提供されるデータの項目
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography variant="body2">
                      第三者への提供の手段または方法
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography variant="body2">
                      本人の求めに応じて個人情報の第三者への提供を停止すること
                    </Typography>
                  }
                />
              </ListItem>
              <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
                <ListItemText
                  disableTypography
                  primary={
                    <Typography variant="body2">
                      本人の求めを受け付ける方法
                    </Typography>
                  }
                />
              </ListItem>
            </List>
          </List>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  前項の定めにかかわらず，次に掲げる場合には，
                  当該情報の提供先は第三者に該当しないものとします。
                </Typography>
              }
            />
          </ListItem>
          <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    当社が利用目的の達成に必要な範囲内において
                    個人情報の取扱いの全部または一部を委託する場合
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    合併その他の事由による事業の承継に伴って個人情報が提供される場合
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    個人情報を特定の者との間で共同して利用する場合であって，
                    その旨並びに共同して利用される個人情報の項目，共同して利用する者の範囲，
                    利用する者の利用目的および当該個人情報の管理について
                    責任を有する者の氏名または名称について，
                    あらかじめ本人に通知し，または本人が容易に知り得る状態に置いた場合
                  </Typography>
                }
              />
            </ListItem>
          </List>
        </List>

        {/* 第6条（個人情報の開示） */}
        <Typography variant="subtitle1" gutterBottom>
          第6条（個人情報の開示）
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社は，本人から個人情報の開示を求められたときは，本人に対し，遅滞なくこれを開示します。
                  ただし，開示することにより次のいずれかに該当する場合は，
                  その全部または一部を開示しないこともあり，開示しない決定をした場合には，
                  その旨を遅滞なく通知します。
                  なお，個人情報の開示に際しては，1件あたり1,000円の手数料を申し受けます。
                </Typography>
              }
            />
          </ListItem>
          <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    本人または第三者の生命，身体，財産その他の権利利益を害するおそれがある場合
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    当社の業務の適正な実施に著しい支障を及ぼすおそれがある場合
                  </Typography>
                }
              />
            </ListItem>
            <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body2">
                    その他法令に違反することとなる場合
                  </Typography>
                }
              />
            </ListItem>
          </List>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  前項の定めにかかわらず，履歴情報および特性情報などの
                  個人情報以外の情報については，原則として開示いたしません。
                </Typography>
              }
            />
          </ListItem>
        </List>

        {/* 第7条（個人情報の訂正および削除） */}
        <Typography variant="subtitle1" gutterBottom>
          第7条（個人情報の訂正および削除）
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  ユーザーは，当社の保有する自己の個人情報が誤った情報である場合には，
                  当社が定める手続きにより，当社に対して個人情報の訂正，
                  追加または削除（以下，「訂正等」といいます。）を請求することができます。
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社は，ユーザーから前項の請求を受けてその請求に応じる必要があると
                  判断した場合には，遅滞なく，当該個人情報の訂正等を行うものとします。
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社は，前項の規定に基づき訂正等を行った場合，
                  または訂正等を行わない旨の決定をしたときは遅滞なく，
                  これをユーザーに通知します。
                </Typography>
              }
            />
          </ListItem>
        </List>

        {/* 第8条（個人情報の利用停止等） */}
        <Typography variant="subtitle1" gutterBottom>
          第8条（個人情報の利用停止等）
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社は，本人から，個人情報が，利用目的の範囲を超えて取り扱われているという理由，
                  または不正の手段により取得されたものであるという理由により，
                  その利用の停止または消去（以下，「利用停止等」といいます。）を求められた場合には，
                  遅滞なく必要な調査を行います。
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  前項の調査結果に基づき，その請求に応じる必要があると
                  判断した場合には，遅滞なく，当該個人情報の利用停止等を行います。
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社は，前項の規定に基づき利用停止等を行った場合，
                  または利用停止等を行わない旨の決定をしたときは，
                  遅滞なく，これをユーザーに通知します。
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  前2項にかかわらず，利用停止等に多額の費用を有する場合
                  その他利用停止等を行うことが困難な場合であって，
                  ユーザーの権利利益を保護するために必要なこれに代わるべき
                  措置をとれる場合は，この代替策を講じるものとします。
                </Typography>
              }
            />
          </ListItem>
        </List>

        {/* 第9条（プライバシーポリシーの変更） */}
        <Typography variant="subtitle1" gutterBottom>
          第9条（プライバシーポリシーの変更）
        </Typography>
        <List sx={{ listStyle: 'decimal', pl: 4, fontSize: '0.875rem' }}>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  本ポリシーの内容は，法令その他本ポリシーに別段の定めのある事項を除いて，
                  ユーザーに通知することなく，変更することができるものとします。
                </Typography>
              }
            />
          </ListItem>
          <ListItem sx={{ display: 'list-item', paddingY: 0 }}>
            <ListItemText
              disableTypography
              primary={
                <Typography variant="body2">
                  当社が別途定める場合を除いて，変更後のプライバシーポリシーは，
                  本ウェブサイトに掲載したときから効力を生じるものとします。
                </Typography>
              }
            />
          </ListItem>
        </List>

        {/* 第10条（お問い合わせ窓口） */}
        <Typography variant="subtitle1" gutterBottom>
          第10条（お問い合わせ窓口）
        </Typography>
        <Typography variant="body2" gutterBottom>
          本ポリシーに関するお問い合わせは，下記の窓口までお願いいたします。
        </Typography>
        <Typography variant="body2" gutterBottom>
          minato project<br />
          内山　良介<br />
          <a href="mailto:ryo-uchiyama@minatoproject.com">ryo-uchiyama@minatoproject.com</a>
        </Typography>

        <Typography variant="body2" sx={{ textAlign: 'right' }}>
          以上
        </Typography>
      </Stack>
    </Grid>
  )
};

export default PrivacyPolicy;
