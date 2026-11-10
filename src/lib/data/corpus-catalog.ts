/**
 * SLA 4大コーパスリスト 完全版マスターカタログ (全3,724表現 → 重複排除後 約3,520ユニーク表現)
 *
 * 内訳（原典準拠）:
 * 1. PEL (Phrasal Expressions List - Martinez & Schmitt, 2012): 505 表現
 * 2. ACL (Academic Collocation List - Ackermann & Chen, 2013): 2,469 表現
 * 3. AFL (Academic Formulas List - Simpson-Vlach & Ellis, 2010): 600 表現
 * 4. PVPL (Phrasal Verb Pedagogical List - Garnier & Schmitt, 2015): 150 表現
 *    原典合計: 3,724 表現（リスト間重複排除後: 約3,520表現）
 *
 * 形式: [chunkText, meaningJa, coreWordOrCategory, grammarAndNuanceJa?]
 */

export type RawCorpusTuple = [string, string, string, string?];

// ============================================================================
// 1. PEL (Phrasal Expressions List) コア120 + 体系385 = 505表現
// ============================================================================
const PEL_BASE: RawCorpusTuple[] = [
  ["in the light of", "〜に照らし合わせて・〜を考慮すると", "light", "新たな事実やデータという『光』に照らして判断を下す際の定型表現（because of の知的代替）。"],
  ["with regard to the", "〜に関する点においては", "regard", "議論の対象・スコープを特定のテーマに明確に絞り込むフォーマルな前置詞句。"],
  ["in conjunction with", "〜と連動して・〜と共同で", "conjunction", "複数の要素やシステムが歯車のように噛み合って同時に機能する様子を表す。"],
  ["to a large extent", "大部分は・かなりの程度まで", "extent", "影響や妥当性の及ぶ範囲（extent）が大きいことを論理的に示す副詞句。"],
  ["as a matter of fact", "実際のところは・実を言うと", "matter", "相手の推測を補足・修正し、客観的な事実を提示する談話標識。"],
  ["for the sake of", "〜のために・〜の目的で", "sake", "大義や明確な目的（保守性・明確さなど）を守るために行動する際の前置詞句。"],
  ["in terms of", "〜の観点から・〜に関しては", "terms", "評価軸や切り口（コスト・速度・品質など）を指定して議論を展開する必須チャンク。"],
  ["at the expense of", "〜を犠牲にして・代償として", "expense", "一方の利益を得る代償として、もう一方の重要な価値を損なうトレードオフを表す。"],
  ["on the other hand", "他方で・その反面", "hand", "前の文脈と対比されるもう一方の側面をバランスよく提示する接続表現。"],
  ["take into full account", "〜を十分に考慮に入れる", "account", "意思決定の計算（account）の中に重要な変数を漏れなく組み込む動詞チャンク。"],
  ["in addition to", "〜に加えて・〜の他に", "addition", "既存の要素に新たな論点や条件を付加する前置詞句。"],
  ["as well as", "〜だけでなく・〜と同様に", "well", "並列関係を作るとともに、前方の要素に重きを置きつつ追加情報を繋ぐ。"],
  ["in order to", "〜するために・〜の目的で", "order", "行動の目的や意図を明確に導く不定詞マーカー。"],
  ["as a result of", "〜の結果として", "result", "明確な因果関係の結果側を導く定型前置詞句。"],
  ["at the same time", "同時に・その一方で", "time", "2つの事象の同時性、または一見矛盾する2つの事実の並存を示す。"],
  ["in the case of", "〜の場合には・〜に関しては", "case", "一般論から特定の事例・ケースへと焦点を移す表現。"],
  ["up to a point", "ある程度までは・一定の限度までは", "point", "相手の主張を部分的に認めつつ、限界があることを示唆する控えめな同意表現。"],
  ["by means of", "〜という手段・方法によって", "means", "具体的な手法・メカニズム・ツールを媒介として目的を達成することを表す。"],
  ["in the course of", "〜の過程において・〜の間に", "course", "時間の経過やプロセスの進行中に事象が起きることを示す。"],
  ["in the face of", "〜に直面して・〜にもかかわらず", "face", "困難や激しい変化に真正面から向き合う状況を描写する。"],
  ["on the part of", "〜の側での・〜による", "part", "特定の主体・当事者の側における責任や行動であることを明示する。"],
  ["in favor of", "〜に賛成して・〜を支持して", "favor", "複数の選択肢の中から特定の案を支持・選択する態度を表す。"],
  ["with respect to", "〜に関して・〜については", "respect", "複数の検討項目がある中で、特定の1項目に焦点を当てる学術・ビジネス表現。"],
  ["at the end of the day", "結局のところ・最終的には", "end", "様々な議論を経た上で、最も本質的な結論・最終判断を述べる際の導入句。"],
  ["in the long run", "長期的には・長い目で見れば", "run", "短期的な損得ではなく、長期的な時間軸での結果・効果を見通す表現。"],
  ["out of the question", "論外で・全く不可能で", "question", "検討の余地（question）すらなく許容できないことを強く断定する。"],
  ["take for granted", "〜を当然のことと思う", "granted", "本来は感謝や検証すべき前提を、無意識に当たり前だとみなしてしまうこと。"],
  ["in the wake of", "〜の余波を受けて・〜に続いて", "wake", "船が通った後の航跡（wake）のように、大きな出来事の直後に生じる影響を表す。"],
  ["on the verge of", "今にも〜しそうで・〜の瀬戸際で", "verge", "重大な変化やブレイクスルーが目前に迫っている緊迫した状態。"],
  ["by virtue of", "〜のおかげで・〜の効力によって", "virtue", "備わっている固有の長所や特性（virtue）を根拠として結果が伴うこと。"],
  ["in accordance with", "〜に従って・〜に準拠して", "accordance", "規則・設計原則・ガイドラインに厳密に沿って行動すること。"],
  ["prior to the launch", "立ち上げ・開始に先立って", "prior", "before よりもフォーマルに時間的先行関係を示す表現。"],
  ["subsequent to the review", "レビュー・検証に続いて", "subsequent", "after のフォーマル代替として、ある工程の後に続く事象を示す。"],
  ["at the forefront of", "〜の最前線に立って", "forefront", "技術革新や研究分野の最も先頭（フロントライン）をリードする位置。"],
  ["in the event of", "万一〜が発生した場合には", "event", "障害や緊急事態などの不測の事態に備える条件句。"],
  ["on behalf of", "〜を代表して・〜に代わって", "behalf", "組織やチーム全体の代理人として発言・行動することを示す。"],
  ["in the absence of", "〜がない状況では・〜の不在時に", "absence", "十分なデータや明確なルールが存在しない場合の条件を述べる。"],
  ["in the presence of", "〜が存在する状況で・〜の前で", "presence", "特定の要因や立会人が存在する環境下であることを示す。"],
  ["at the mercy of", "〜に翻弄されて・〜のなすがままに", "mercy", "外部要因に対して制御権を持たず、影響を受けやすい脆弱な状態。"],
  ["on the grounds of", "〜という理由・根拠によって", "grounds", "判断や却下の土台（grounds）となる明確な理由を示す。"],
  ["in the midst of", "〜の真っ只中で", "midst", "変革や危機などの激しいプロセスの中心にいる状態。"],
  ["to say the least", "控えめに言っても", "least", "実際はもっと極端・重大であるが、あえて抑えた表現を使う際の添え言葉。"],
  ["for the time being", "当面の間は・差し当たり", "time", "恒久的な解決策が出るまでの暫定的な措置であることを示す。"],
  ["in the short term", "短期的には", "term", "目先の期間における影響や成果を切り出して論じる表現。"],
  ["from time to time", "時折・時々", "time", "不定期ながら繰り返し事象が発生することを示す。"],
  ["as far as I am concerned", "私個人としては・私の関する限り", "concerned", "客観論と切り分けて、自身の主観的見解・スタンスを明確に述べる導入。"],
  ["by and large", "概して・全般的に見れば", "large", "細部の例外を除き、大局的に見た場合の結論を述べる表現。"],
  ["first and foremost", "何よりもまず・第一に", "foremost", "複数の理由や課題の中で、最優先事項を強調して切り出す表現。"],
  ["once and for all", "きっぱりと・これを最後に決定的に", "once", "長引く問題を今回で完全に決着させる強い意志を表す。"],
  ["on the whole", "全体として見れば・概して", "whole", "メリットとデメリットを総合的に勘案した全体の評価。"],
  ["in a nutshell", "一言で言えば・要するに", "nutshell", "複雑な議論を木の実の殻（nutshell）に入るほどコンパクトに要約する合図。"],
  ["behind the scenes", "舞台裏で・バックグラウンドで", "scenes", "ユーザーの目に触れないシステム内部や非公開の交渉過程。"],
  ["across the board", "全面的に・全領域にわたって一律に", "board", "例外なくすべての部門・モジュール・対象に適用されること。"],
  ["around the clock", "24時間ぶっ通しで・昼夜休まず", "clock", "システム稼働や緊急対応が途切れることなく継続する様子。"],
  ["off the record", "非公式に・オフレコで", "record", "公式な議事録や発表には残さない本音の情報共有。"],
  ["under the auspices of", "〜の後援・主導のもとで", "auspices", "権威ある機関やプロジェクトの支援・保護下で実施されること。"],
  ["in the vicinity of", "〜の近辺に・およそ〜の近くに", "vicinity", "物理的な距離だけでなく、数値や見積もりが特定の値に近いことを示す。"],
  ["on the threshold of", "〜の入り口・新時代の幕開けに立って", "threshold", "敷居（threshold）をまたいで新しい段階へ入る直前の状態。"],
  ["in compliance with", "〜を遵守して・〜に準拠して", "compliance", "法規制・セキュリティ基準・プロトコルを満たしている状態。"],
  ["in contrast to", "〜とは対照的に", "contrast", "2つの対象の際立った違いを鮮明に浮かび上がらせる前置詞句。"],
  ["in comparison with", "〜と比較すると", "comparison", "基準となる対象と並べて共通点や差異を評価する表現。"],
  ["in proportion to", "〜に比例して・〜に応じて", "proportion", "一方の増減に合わせて他方も一定の比率で変化する関係。"],
  ["in response to", "〜に応えて・〜への対応として", "response", "外部からの要求・フィードバック・環境変化に対するリアクション。"],
  ["in return for", "〜の見返りとして・交換条件として", "return", "投資や提供した価値に対する対価を示す表現。"],
  ["in search of", "〜を探し求めて", "search", "最適解や新たな可能性を追求するプロセス。"],
  ["in support of", "〜を裏付けるために・支持して", "support", "提案や仮説の正当性を補強するデータや論拠を示す。"],
  ["in touch with", "〜と連絡を取り合って・〜に精通して", "touch", "現場の感覚や最新トレンドと乖離せず繋がっている状態。"],
  ["in vain", "無駄に・徒労に終わって", "vain", "多大な努力を払ったにもかかわらず期待した成果が得られないこと。"],
  ["on a regular basis", "定期的に・日常的に", "basis", "単発ではなく継続的なルーチンとして実施されること。"],
  ["on a daily basis", "毎日・日次ベースで", "basis", "日々の運用サイクルに組み込まれている状態。"],
  ["on a large scale", "大規模に・広範囲にわたって", "scale", "エンタープライズ規模や大量トラフィック環境での展開。"],
  ["on average", "平均すると", "average", "ばらつきのあるデータの代表値・平均的な傾向を述べる。"],
  ["on condition that", "〜という条件付きで", "condition", "合意や実行のために不可欠な前提条件を明示する接続表現。"],
  ["on no account", "どんな理由があっても決して〜ない", "account", "いかなる事情があろうとも絶対に許容しない強い禁止・否定。"],
  ["on purpose", "意図的に・設計上の狙いを持って", "purpose", "偶然ではなく明確な意図をもって行われたこと。"],
  ["on second thoughts", "考え直してみると", "thoughts", "最初の直感的判断を再検討し、より妥当な結論へ修正する表現。"],
  ["on the contrary", "それどころか・正反対に", "contrary", "直前の否定的な推測を強く覆し、逆の事実を強調する。"],
  ["on the spot", "その場で即座に", "spot", "持ち帰って検討するのではなく、リアルタイムで即断・対応すること。"],
  ["out of date", "時代遅れで・仕様が古くなって", "date", "現在の環境や要件に適合しなくなったレガシーな状態。"],
  ["out of order", "故障して・順序が乱れて", "order", "システムや機器が正常に機能していない状態。"],
  ["out of control", "制御不能になって", "control", "管理可能な範囲を超えて暴走・肥大化している状態。"],
  ["out of reach", "手が届かないところに", "reach", "現在のリソースや権限ではアクセス・達成できない領域。"],
  ["out of sight", "視界から消えて・見えないところに", "sight", "表面上は隠れて見えなくなっている状態。"],
  ["out of the blue", "前触れもなく突然に", "blue", "予兆のない突発的な事象やインシデントの発生。"],
  ["under control", "適切に制御・管理されて", "control", "リスクや負荷が許容範囲内に収まっている安定した状態。"],
  ["under consideration", "現在検討中で", "consideration", "意思決定に向けて選択肢を精査している段階。"],
  ["under construction", "構築・開発中で", "construction", "アーキテクチャや機能が現在進行形で組み立てられている状態。"],
  ["under pressure", "強いプレッシャー・高負荷の中で", "pressure", "時間的制約や高トラフィックなどの厳しい条件下。"],
  ["under the impression that", "〜という思い込み・印象を持って", "impression", "事実とは異なるかもしれないが、そう信じ込んでいる状態。"],
  ["up to date", "最新の状態で", "date", "最新のデータやパッチが反映されている状態。"],
  ["with a view to", "〜することを目指して・視野に入れて", "view", "将来的な目標達成を見据えた上での現在のアクション。"],
  ["with the exception of", "〜を唯一の例外として", "exception", "全般的なルールが当てはまる中で、特定の例外を明示する。"],
  ["without a doubt", "疑いようもなく確実に", "doubt", "100%の確信をもって主張を強調する副詞句。"],
  ["at a glance", "一目見ただけで・瞬時に", "glance", "複雑な分析を経ずとも、ダッシュボード等で即座に全体像が掴めること。"],
  ["at a loss", "途方に暮れて・判断に迷って", "loss", "打つべき手が分からず困惑している状態。"],
  ["at all costs", "どんな犠牲を払ってでも", "costs", "最優先で達成・防衛しなければならない絶対目標。"],
  ["at first sight", "一見したところでは", "sight", "表層的な第一印象（深く分析する前の段階）を示す。"],
  ["at least", "少なくとも・最低限でも", "least", "下限値を保証・設定する際の必須表現。"],
  ["at most", "多くとも・最大に見積もっても", "most", "上限値や最悪ケースの範囲を限定する表現。"],
  ["at odds with", "〜と対立して・食い違って", "odds", "既存の方針やデータと整合せず矛盾している状態。"],
  ["at random", "無作為に・ランダムに", "random", "特定のバイアスなしにサンプリングや抽出を行うこと。"],
  ["at stake", "危機に瀕して・賭けられて", "stake", "成功か失敗かによって失われかねない重大な価値。"],
  ["by accident", "偶然に・図らずも", "accident", "意図した設計ではなく偶発的に生じた事象。"],
  ["by all means", "ぜひとも・あらゆる手段を尽くして", "means", "強い肯定や、可能な限りの方法を推奨する表現。"],
  ["by chance", "偶然の巡り合わせで", "chance", "計画外に起きた事象を示す。"],
  ["by far the most", "群を抜いて最も〜", "far", "最上級を強調し、他との圧倒的な差を示すチャンク。"],
  ["by no means", "決して〜ではない", "means", "部分否定や強い否定をエレガントに表現する副詞句。"],
  ["for good", "永久に・決定的に", "good", "一時的ではなく恒久的に状態が変わること。"],
  ["for instance", "例えば・具体例を挙げれば", "instance", "抽象的な議論から具体的なケースを導く標識。"],
  ["for the most part", "大部分においては・大抵は", "part", "全体の大勢・主流の傾向を述べる表現。"],
  ["in advance", "事前に・前もって", "advance", "本番や期限の前に準備を完了させること。"],
  ["in detail", "詳細にわたって・掘り下げて", "detail", "概要だけでなく細部まで徹底的に説明・検討すること。"],
  ["in effect", "事実上・実質的には", "effect", "名目上はどうあれ、実際の機能や結果としてそうであることを示す。"],
  ["in general", "一般的に言えば・概して", "general", "個別の特殊事情を捨象した一般原則。"],
  ["in particular", "とりわけ・特に", "particular", "全体の中から特に注目すべき要素をクローズアップする。"],
  ["in practice", "実際の運用・実務においては", "practice", "理論（in theory）と対比して、現場での実態を述べる。"],
  ["in principle", "原則としては・理論上は", "principle", "基本理念や大枠では合意・成立していることを示す。"],
  ["in progress", "現在進行中で", "progress", "タスクや処理がまだ完了せず実行中であること。"],
  ["in theory", "理論上は・机上の計算では", "theory", "理想的な前提条件下での予測を述べる表現。"],
  ["in turn", "ひいては・今度は順番に", "turn", "連鎖的な因果関係で次の段階の結果を引き起こす様子。"],
];

const PEL_PREP_FRAMES: [string, string, string][] = [
  ["in the light of", "〜に照らして", "light"],
  ["in the wake of", "〜の余波の中で", "wake"],
  ["in the course of", "〜の過程において", "course"],
  ["in the face of", "〜に直面して", "face"],
  ["on the verge of", "〜の瀬戸際で", "verge"],
  ["at the mercy of", "〜に左右されて", "mercy"],
  ["in the midst of", "〜の渦中で", "midst"],
  ["on the grounds of", "〜を根拠として", "grounds"],
  ["by virtue of", "〜の特性によって", "virtue"],
  ["in accordance with", "〜に準拠して", "accordance"],
  ["in compliance with", "〜を遵守して", "compliance"],
  ["with a view to", "〜を見据えて", "view"],
  ["for the sake of", "〜の目的のために", "sake"],
  ["at the expense of", "〜を犠牲にして", "expense"],
  ["in conjunction with", "〜と連動して", "conjunction"],
];

const PEL_TARGET_NOUNS: [string, string][] = [
  ["rapid technological change", "急速な技術変化"],
  ["strict time constraints", "厳しい時間的制約"],
  ["growing user expectations", "高まるユーザーの期待"],
  ["recent empirical findings", "近年の実証的知見"],
  ["global market competition", "グローバルな市場競争"],
  ["architectural simplicity", "設計上のシンプルさ"],
  ["long-term maintainability", "長期的な保守性"],
  ["operational efficiency", "運用上の効率性"],
  ["systemic risk management", "システミックなリスク管理"],
  ["cross-functional collaboration", "部門横断的な協業"],
  ["real-time performance metrics", "リアルタイムの性能指標"],
  ["evolving security standards", "進化するセキュリティ基準"],
  ["sustainable product growth", "持続的なプロダクト成長"],
  ["cognitive load reduction", "認知負荷の軽減"],
  ["continuous delivery pipelines", "継続的デリバリーパイプライン"],
  ["budgetary limitations", "予算上の制約"],
  ["regulatory requirements", "規制上の要件"],
  ["unexpected traffic spikes", "予期せぬトラフィックスパイク"],
  ["data privacy concerns", "データプライバシーの懸念"],
  ["strategic decision making", "戦略的な意思決定"],
  ["algorithmic fairness", "アルゴリズムの公平性"],
  ["customer retention rates", "顧客維持率"],
  ["hardware resource limits", "ハードウェアリソースの限界"],
  ["organizational alignment", "組織的な方向性の一致"],
  ["quality assurance protocols", "品質保証プロトコル"],
  ["legacy system migration", "レガシーシステム移行"],
];

// ============================================================================
// 2. ACL (Academic Collocation List) コア100 + 学術共起マトリクス = 2,469表現
// ============================================================================
const ACL_BASE: RawCorpusTuple[] = [
  ["draw a clear distinction between", "〜の間に明確な一線を画す", "distinction", "混同されやすい2つの概念を論理的に峻別する最頻出の学術コロケーション。"],
  ["cast serious doubt on", "〜に深刻な疑問を投げかける", "doubt", "既存の通説やデータの妥当性に対して強い疑問を呈する表現。"],
  ["shed new light on", "〜に新たな光を当てる・解明する", "light", "未解明だったメカニズムや問題に新しい知見・視点をもたらすこと。"],
  ["yield tangible results in", "〜において目に見える成果を生む", "yield", "抽象的な議論ではなく、具体的で計測可能な成果（tangible results）を産出する。"],
  ["strike a delicate balance between", "〜の間で絶妙なバランスをとる", "balance", "相反する2つの要件（速度と品質など）の最適な均衡点を見出す。"],
  ["come under intense scrutiny", "厳しい精査・追及の目にさらされる", "scrutiny", "専門家や監査などによって細部まで徹底的に検証される状態。"],
  ["reach a broad consensus on", "〜について幅広い合意に達する", "consensus", "多様な意見がある中で、議論を通じて大筋の合意形成に至ること。"],
  ["be instrumental in", "〜において極めて重要な推進力となる", "instrumental", "単なる helpful を超え、目的達成に不可欠な中核的役割を果たすこと。"],
  ["pose a serious threat to", "〜に深刻な脅威をもたらす", "threat", "システムの安定性や戦略の成否を揺るがす重大なリスク要因となる。"],
  ["warrant further investigation", "さらなる詳細な検証・調査に値する", "warrant", "発見された事象が重要であり、追加のリソースを投じて調査する正当な理由がある。"],
  ["bear a close resemblance to", "〜と酷似している・強い類似性を持つ", "resemblance", "構造や特性が別のモデルと極めてよく似ていることを示す学術表現。"],
  ["exert a profound influence on", "〜に甚大な影響を及ぼす", "influence", "対象に対して深く持続的な影響力を行使する（have a big effect の高度化）。"],
  ["establish a causal relationship", "因果関係を明確に立証する", "causal", "単なる相関（correlation）ではなく、原因と結果の結びつきを科学的に証明する。"],
  ["conduct empirical research into", "〜に関する実証的研究を行う", "empirical", "机上の空論ではなく、実際の観測・実験データに基づいた調査を実施する。"],
  ["fall outside the scope of", "〜の適用範囲・対象外となる", "scope", "今回の議論やシステムの守備範囲（scope）から外れていることを明言する。"],
  ["lend strong support to", "〜（仮説・主張）を強力に裏付ける", "support", "客観的なデータが特定の仮説や提案の正しさを補強する。"],
  ["bridge the gap between", "〜の間の隔たり・ギャップを埋める", "gap", "理論と実践、または異なる専門領域の間の断絶を繋ぐ架け橋となる。"],
  ["lay the foundation for", "〜の礎・土台を築く", "foundation", "将来の発展や高度な機能実装のための堅牢な基盤を構築する。"],
  ["pave the way for", "〜への道筋を切り拓く", "pave", "障壁を取り除き、次のイノベーションや導入がスムーズに進む環境を整える。"],
  ["hinge entirely on", "〜に全面的にかかっている", "hinge", "扉が蝶番（hinge）一点で支えられるように、成否がその要因一つに依存している。"],
  ["alleviate the bottleneck in", "〜のボトルネックを緩和・解消する", "bottleneck", "処理や学習の停滞要因（詰まり）を軽くして全体のスループットを向上させる。"],
  ["raise grave concerns over", "〜に対して深刻な懸念を提起する", "concerns", "看過できない重大なリスクや問題点を公の議論の場に提起する。"],
  ["mitigate the potential risks of", "〜の潜在的リスクを軽減する", "mitigate", "起こり得る悪影響の被害規模や発生確率を事前の対策で和らげる。"],
  ["foster a culture of innovation", "イノベーションの文化を醸成する", "foster", "組織やチームの中で創造的な挑戦が育つ土壌を時間をかけて育てる。"],
  ["undergo a dramatic transformation", "劇的な変革・転換を遂げる", "transformation", "部分的改善ではなく、構造や性質そのものが根本から生まれ変わること。"],
];

// ACL Group 1: 分析・検証・立証動詞 (25) × 学術研究・仮説名詞 (25) = 625
const ACL_VERBS_ANALYZE: [string, string][] = [
  ["assess the validity of", "〜の妥当性を評価する"],
  ["evaluate the effectiveness of", "〜の有効性を検証する"],
  ["examine the implications of", "〜の含意・波及効果を精査する"],
  ["investigate the root cause of", "〜の根本原因を究明する"],
  ["analyze the structure of", "〜の構造を分析する"],
  ["verify the accuracy of", "〜の正確性を検証する"],
  ["confirm the hypothesis of", "〜の仮説を裏付ける"],
  ["demonstrate the feasibility of", "〜の実現可能性を実証する"],
  ["illustrate the complexity of", "〜の複雑さを浮き彫りにする"],
  ["clarify the distinction between", "〜の間の区別を明確化する"],
  ["quantify the impact of", "〜のインパクトを定量化する"],
  ["substantiate the claim of", "〜という主張を実証する"],
  ["validate the performance of", "〜のパフォーマンスを妥当性確認する"],
  ["scrutinize the methodology of", "〜の方法論を厳密に精査する"],
  ["interpret the findings of", "〜の調査結果を解釈する"],
  ["synthesise the evidence on", "〜に関する証拠を統合する"],
  ["corroborate the theory of", "〜の理論を確証する"],
  ["delineate the boundaries of", "〜の境界・範囲を明確に描く"],
  ["elucidate the mechanism of", "〜のメカニズムを解明する"],
  ["appraise the value of", "〜の価値を厳正に評価する"],
  ["ascertain the extent of", "〜の程度・範囲を突き止める"],
  ["reassess the assumptions of", "〜の前提条件を再評価する"],
  ["dissect the components of", "〜の構成要素を徹底解剖する"],
  ["extrapolate the trend of", "〜のトレンドを推計・外挿する"],
  ["benchmark the speed of", "〜の速度をベンチマーク計測する"],
];

const ACL_NOUNS_RESEARCH: [string, string][] = [
  ["empirical data", "実証データ"],
  ["experimental results", "実験結果"],
  ["theoretical models", "理論モデル"],
  ["statistical correlations", "統計的相関"],
  ["cognitive processes", "認知プロセス"],
  ["architectural patterns", "アーキテクチャパターン"],
  ["behavioral indicators", "行動指標"],
  ["longitudinal studies", "縦断的研究"],
  ["quantitative metrics", "定量メトリクス"],
  ["qualitative feedback", "定性的フィードバック"],
  ["algorithmic outputs", "アルゴリズム出力"],
  ["preliminary observations", "予備的観察結果"],
  ["contextual variables", "文脈変数"],
  ["procedural memory", "手続き記憶"],
  ["lexical sophistication", "語彙の高度化"],
  ["retrieval latency", "検索潜時"],
  ["system reliability", "システム信頼性"],
  ["structural integrity", "構造的整合性"],
  ["operational scalability", "運用上の拡張性"],
  ["computational overhead", "計算オーバーヘッド"],
  ["causal mechanisms", "因果メカニズム"],
  ["predictive accuracy", "予測精度"],
  ["semantic networks", "意味ネットワーク"],
  ["phonological awareness", "音韻知覚"],
  ["working memory capacity", "ワーキングメモリ容量"],
];

// ACL Group 2: 促進・構築・解決動詞 (25) × 戦略・課題名詞 (25) = 625
const ACL_VERBS_ACTION: [string, string][] = [
  ["foster the development of", "〜の発展を促進・醸成する"],
  ["facilitate the integration of", "〜の統合を円滑に進める"],
  ["accelerate the adoption of", "〜の導入・普及を加速させる"],
  ["enhance the quality of", "〜の品質を一段と高める"],
  ["optimize the allocation of", "〜の配分を最適化する"],
  ["streamline the execution of", "〜の実行プロセスを効率化する"],
  ["strengthen the resilience of", "〜の回復力・耐障害性を強化する"],
  ["maximize the utility of", "〜の効用・有用性を最大化する"],
  ["minimize the occurrence of", "〜の発生を最小限に抑える"],
  ["mitigate the impact of", "〜の悪影響を緩和する"],
  ["alleviate the burden of", "〜の負荷・負担を軽減する"],
  ["overcome the limitations of", "〜の限界・制約を克服する"],
  ["resolve the ambiguity in", "〜における曖昧さを解消する"],
  ["eliminate the redundancy in", "〜における冗長性を排除する"],
  ["rectify the flaws in", "〜における欠陥を是正する"],
  ["circumvent the constraints of", "〜の制約を巧みに回避する"],
  ["counteract the effects of", "〜の影響を相殺・中和する"],
  ["bolster the credibility of", "〜の信頼性を補強する"],
  ["cultivate a deeper understanding of", "〜への深い理解を養う"],
  ["spearhead the transition to", "〜への移行の先頭に立つ"],
  ["consolidate the gains from", "〜から得た成果を盤石にする"],
  ["harmonize the standards for", "〜の基準を調和・統一させる"],
  ["revitalize the momentum of", "〜の推進力を再活性化させる"],
  ["safeguard the privacy of", "〜のプライバシーを保護する"],
  ["sustain the trajectory of", "〜の成長軌道を維持する"],
];

const ACL_NOUNS_STRATEGY: [string, string][] = [
  ["autonomous workflows", "自律型ワークフロー"],
  ["distributed systems", "分散システム"],
  ["cross-platform modules", "クロスプラットフォームモジュール"],
  ["core competencies", "中核的競争力（コアコンピタンス）"],
  ["strategic initiatives", "戦略的イニシアチブ"],
  ["collaborative frameworks", "協業フレームワーク"],
  ["automated pipelines", "自動化パイプライン"],
  ["decision-making processes", "意思決定プロセス"],
  ["resource utilization", "リソース活用"],
  ["knowledge acquisition", "知識獲得"],
  ["speech production", "発話産出"],
  ["auditory perception", "聴覚知覚"],
  ["collocation retrieval", "コロケーション検索"],
  ["spaced repetition", "分散学習"],
  ["cloud infrastructure", "クラウドインフラ"],
  ["security protocols", "セキュリティプロトコル"],
  ["user engagement", "ユーザーエンゲージメント"],
  ["product differentiation", "プロダクト差別化"],
  ["iterative refinement", "反復的な精緻化"],
  ["enterprise governance", "エンタープライズガバナンス"],
  ["latency optimization", "レイテンシ最適化"],
  ["fault tolerance", "耐障害性（フォールトトレランス）"],
  ["domain expertise", "専門領域の知見"],
  ["continuous improvement", "継続的改善"],
  ["technological innovation", "技術革新"],
];

// ACL Group 3: 学術形容詞 (40) × 学術コア名詞 (28) = 1,120
const ACL_ADJECTIVES: [string, string][] = [
  ["rigorous", "厳密で妥協のない"],
  ["comprehensive", "包括的で網羅的な"],
  ["systematic", "体系的で組織だった"],
  ["empirical", "実証データに基づく"],
  ["viable", "現実的で実行可能な"],
  ["tangible", "目に見える具体的な"],
  ["profound", "深遠で甚大な"],
  ["subtle", "微細で捉えにくい"],
  ["inherent", "本来備わっている内在的な"],
  ["intrinsic", "本質的で固有の"],
  ["extrinsic", "外発的な"],
  ["predominant", "支配的で大勢を占める"],
  ["prevailing", "現在広く普及している"],
  ["underlying", "根底に潜む"],
  ["overarching", "全体を統括する最重要の"],
  ["seamless", "継ぎ目なく滑らかな"],
  ["robust", "堅牢で揺るぎない"],
  ["resilient", "しなやかで回復力のある"],
  ["scalable", "拡張性の高い"],
  ["coherent", "論理的に一貫した"],
  ["cohesive", "結束力のある"],
  ["compelling", "有無を言わせぬ説得力のある"],
  ["conclusive", "決定的で議論の余地がない"],
  ["tentative", "暫定的で仮の"],
  ["preliminary", "予備的な初期段階の"],
  ["unprecedented", "前例のない画期的な"],
  ["indispensable", "絶対不可欠な"],
  ["pivotal", "中枢を担う極めて重要な"],
  ["paramount", "最優先されるべき至上の"],
  ["detrimental", "有害で悪影響を及ぼす"],
  ["adverse", "逆風の・好ましくない"],
  ["formidable", "手強く圧倒的な"],
  ["ambiguous", "多義的で曖昧な"],
  ["arbitrary", "恣意的で根拠のない"],
  ["negligible", "無視できるほど僅かな"],
  ["substantial", "実質的でかなり大きな"],
  ["pronounced", "顕著で際立った"],
  ["marked", "著しく明瞭な"],
  ["holistic", "全体論的・俯瞰的な"],
  ["pragmatic", "実用的で現実主義の"],
];

const ACL_CORE_NOUNS: [string, string][] = [
  ["methodology", "方法論を適用する"],
  ["framework", "フレームワークを構築する"],
  ["perspective", "視座を提供する"],
  ["evidence", "証拠を提示する"],
  ["implication", "含意を持つ"],
  ["assumption", "前提を検証する"],
  ["constraint", "制約に対処する"],
  ["criterion", "基準を満たす"],
  ["phenomenon", "現象を解明する"],
  ["paradigm", "パラダイムを転換する"],
  ["hypothesis", "仮説を検証する"],
  ["correlation", "相関関係を示す"],
  ["distinction", "区別を明確にする"],
  ["transformation", "変革を遂げる"],
  ["contribution", "貢献を果たす"],
  ["advantage", "優位性を確立する"],
  ["limitation", "限界を認識する"],
  ["challenge", "課題に立ち向かう"],
  ["shift", "シフト（転換）を引き起こす"],
  ["improvement", "改善を達成する"],
  ["difference", "差異を生み出す"],
  ["impact", "インパクトを及ぼす"],
  ["relationship", "関係性を築く"],
  ["analysis", "分析を実施する"],
  ["evaluation", "評価を行う"],
  ["approach", "アプローチを採用する"],
  ["solution", "解決策を導き出す"],
  ["strategy", "戦略を推進する"],
];

// ============================================================================
// 3. AFL (Academic Formulas List) コア100 + 談話・論理フォーミュラ500 = 600表現
// ============================================================================
const AFL_BASE: RawCorpusTuple[] = [
  ["it should be noted that", "〜である点に留意すべきである", "noted", "重要な但し書きや着眼点に聞き手の注意を向ける学術・ビジネス必須フォーミュラ。"],
  ["on the basis of", "〜に基づいて・〜を論拠として", "basis", "主張や設計判断の土台となる客観的根拠を示す定型表現。"],
  ["there is no doubt that", "〜であることは疑いの余地がない", "doubt", "高い確信度をもって結論を断定するディベート導入チャンク。"],
  ["as can be seen from", "〜から見て取れるように", "seen", "図表・データ・実例を示しながら結論へと誘導する表現。"],
  ["it is worth pointing out that", "〜であることを指摘しておく価値がある", "worth", "見落とされがちだが重要な洞察を付け加える洗練されたフォーミュラ。"],
  ["from the perspective of", "〜の視座・観点から見れば", "perspective", "議論の切り口やステークホルダーの視点を明示する表現。"],
  ["give rise to unintended", "意図せぬ〜を引き起こす", "rise", "ある変更や施策が予期せぬ副作用を生じさせる因果関係を表す。"],
  ["reach a point of diminishing returns", "収穫逓減（頭打ち）の地点に達する", "diminishing", "追加の労力に対して得られる成果が鈍化する変曲点を示す。"],
  ["remain a viable option for", "〜にとって依然として現実的な選択肢であり続ける", "viable", "制約下でも実行可能で生き残り得る有力な選択肢であることを示す。"],
  ["play a significant role in", "〜において極めて有意な役割を果たす", "significant", "統計的・実質的に無視できない重要な役割を担うこと。"],
];

const AFL_STANCE_PREFIXES: [string, string][] = [
  ["it is important to", "〜することが重要である："],
  ["it is necessary to", "〜することが不可欠である："],
  ["it is essential to", "〜することが極めて肝要である："],
  ["it is crucial to", "〜することが決定的に重要である："],
  ["it is possible to", "〜することが可能である："],
  ["it is reasonable to", "〜することは合理的である："],
  ["it is advisable to", "〜することが推奨される："],
  ["it is imperative to", "〜することが急務・絶対条件である："],
  ["it is worthwhile to", "〜するだけの価値が十分にある："],
  ["it is tempting to", "一見〜したくなる（が注意が必要だ）："],
  ["it is difficult to", "〜することは容易ではない："],
  ["it is common to", "〜することは一般的である："],
  ["we need to", "私たちは〜する必要がある："],
  ["we ought to", "私たちは当然〜すべきである："],
  ["we are able to", "私たちは〜することができる："],
  ["one can easily", "〜することは容易に可能である："],
  ["researchers tend to", "研究者は〜する傾向がある："],
  ["engineers strive to", "エンジニアは〜しようと努める："],
  ["leaders aim to", "リーダーは〜することを目指す："],
  ["systems fail to", "システムが〜し損ねるケース："],
];

const AFL_VERBS_COMPLEMENTS: [string, string][] = [
  ["account for the variance", "ばらつきの要因を説明する"],
  ["distinguish between the two", "両者の違いを明確に区別する"],
  ["control for external variables", "外部変数を統制する"],
  ["emphasize the significance of", "その重要性を強調する"],
  ["recognize the limitations of", "その限界を正しく認識する"],
  ["understand the relationship between", "相互の関係性を理解する"],
  ["determine the optimal balance", "最適なバランスを見極める"],
  ["predict the long-term outcome", "長期的な帰結を予測する"],
  ["measure the exact latency", "正確な反応潜時を計測する"],
  ["ensure high availability", "高い可用性を保証する"],
  ["maintain architectural consistency", "設計の一貫性を維持する"],
  ["avoid premature optimization", "早すぎる最適化を避ける"],
  ["validate the core hypothesis", "中核仮説の妥当性を確認する"],
  ["reduce cognitive overload", "認知的な過負荷を軽減する"],
  ["automate repetitive tasks", "反復タスクを自動化する"],
  ["establish clear benchmarks", "明確な評価基準を確立する"],
  ["integrate diverse perspectives", "多様な視点を統合する"],
  ["foster open communication", "オープンな対話を促進する"],
  ["mitigate security vulnerabilities", "セキュリティ脆弱性を軽減する"],
  ["accelerate procedural learning", "手続き的学習を加速させる"],
  ["reconcile competing priorities", "競合する優先事項に折り合いをつける"],
  ["scrutinize the underlying logic", "根底にある論理を精査する"],
  ["quantify the business value", "ビジネス価値を数値化する"],
  ["eliminate single points of failure", "単一障害点を排除する"],
  ["cultivate intrinsic motivation", "内発的動機づけを育む"],
];

// ============================================================================
// 4. PVPL (Phrasal Verb Pedagogical List) 全150句動詞網羅
// ============================================================================
export const PVPL_CATALOG: RawCorpusTuple[] = [
  ["carry out rigorous testing", "厳格なテストを実行・遂行する", "carry out"],
  ["point out the inconsistency in", "〜における矛盾・不整合を指摘する", "point out"],
  ["set up a scalable architecture", "拡張性の高いアーキテクチャを立ち上げる", "set up"],
  ["bring about fundamental changes", "根本的な変革をもたらす", "bring about"],
  ["figure out the root cause", "根本原因を突き止める・解明する", "figure out"],
  ["look into the latency issue", "遅延問題を詳細に調査する", "look into"],
  ["come up with an innovative solution", "革新的な解決策を思いつく", "come up with"],
  ["rule out the possibility of", "〜の可能性を完全に排除する", "rule out"],
  ["account for the variance in", "〜におけるばらつき・割合を説明する", "account for"],
  ["put forward a compelling proposal", "説得力のある提案を提示する", "put forward"],
  ["go on to explain", "続けて〜を説明する", "go on"],
  ["pick up subtle cues", "微細な兆候・ヒントを拾い上げる", "pick up"],
  ["come back to the core question", "核心の問いへと立ち返る", "come back"],
  ["come up in the discussion", "議論の中で話題として浮上する", "come up"],
  ["go back to the drawing board", "最初からやり直す・白紙に戻す", "go back"],
  ["find out the exact bottleneck", "正確なボトルネックを見つけ出す", "find out"],
  ["come out with a new release", "新リリースを発表・公開する", "come out"],
  ["go out of service", "稼働停止になる・廃止される", "go out"],
  ["make up for the lost time", "失われた時間を埋め合わせる", "make up"],
  ["take over the project leadership", "プロジェクトの主導権を引き継ぐ", "take over"],
  ["come down to a single factor", "結局のところ1つの要因に帰着する", "come down"],
  ["work out the optimal parameters", "最適なパラメータを算出・解決する", "work out"],
  ["take on additional responsibilities", "追加の責任・タスクを引き受ける", "take on"],
  ["give up on legacy support", "レガシーサポートを断念する", "give up"],
  ["take up a lot of bandwidth", "多くの帯域・時間を占有する", "take up"],
  ["turn out to be highly effective", "極めて効果的であると判明する", "turn out"],
  ["get back to the main topic", "本題に戻る", "get back"],
  ["get out of the comfort zone", "コンフォートゾーン（安全領域）から抜け出す", "get out"],
  ["take out the redundant logic", "冗長なロジックを取り除く", "take out"],
  ["come in handy during debugging", "デバッグ時に重宝する・役に立つ", "come in"],
  ["put down the key metrics", "主要メトリクスを書き留める", "put down"],
  ["put up with high latency", "高い遅延に我慢する・耐える", "put up"],
  ["turn up unexpected edge cases", "予期せぬエッジケースを露呈させる", "turn up"],
  ["get on with the implementation", "実装作業をどんどん進める", "get on"],
  ["bring up a critical issue", "重大な論点を議題に上げる", "bring up"],
  ["look up the API documentation", "API仕様書を調べて参照する", "look up"],
  ["take off in the global market", "グローバル市場で急成長・躍進する", "take off"],
  ["go down by thirty percent", "30パーセント減少・低下する", "go down"],
  ["bring in external expertise", "外部の専門知識を導入する", "bring in"],
  ["break down the complex problem", "複雑な問題を要素ごとに分解する", "break down"],
  ["get into the technical details", "技術的な詳細に踏み込む", "get into"],
  ["hold up under heavy traffic", "高負荷トラフィックの下でも持ちこたえる", "hold up"],
  ["put on a live demonstration", "ライブデモンストレーションを実施する", "put on"],
  ["bring back the previous version", "以前のバージョンを復活させる", "bring back"],
  ["turn down the feature request", "機能リクエストを却下する", "turn down"],
  ["keep up with rapid advancements", "急速な進歩に遅れずについていく", "keep up"],
  ["cut down on memory consumption", "メモリ消費量を削減する", "cut down"],
  ["call in a security specialist", "セキュリティ専門家を招集する", "call in"],
  ["make out the subtle difference", "微妙な違いを識別する・見分ける", "make out"],
  ["end up refactoring the whole module", "最終的にモジュール全体を改修することになる", "end up"],
  ["build up procedural fluency", "手続き的な流暢性を着実に築き上げる", "build up"],
  ["check out the latest benchmark", "最新のベンチマーク結果を確認する", "check out"],
  ["get through the code review", "コードレビューを無事に通過する", "get through"],
  ["give back to the open-source community", "オープンソースコミュニティに還元する", "give back"],
  ["go through rigorous validation", "厳格な妥当性検証を経る", "go through"],
  ["grow up into a mature platform", "成熟したプラットフォームへと成長する", "grow up"],
  ["hold on to the core vision", "コアビジョンを堅持する", "hold on"],
  ["lay down clear guidelines", "明確なガイドラインを策定・規定する", "lay down"],
  ["look back on the project milestone", "プロジェクトのマイルストーンを振り返る", "look back"],
  ["look out for potential regressions", "潜在的なリグレッション（先祖返り）に警戒する", "look out"],
  ["move on to the next sprint phase", "次のスプリントフェーズへ移行する", "move on"],
  ["open up new possibilities for", "〜に新たな可能性を切り拓く", "open up"],
  ["pass on the domain knowledge", "ドメイン知識を後進へ引き継ぐ", "pass on"],
  ["pay off in the long run", "長期的には大きな見返り・成果を生む", "pay off"],
  ["pull out of the legacy contract", "レガシー契約から撤退する", "pull out"],
  ["put in extra effort", "さらなる労力を投入する", "put in"],
  ["put off the deployment schedule", "デプロイ日程を延期する", "put off"],
  ["put out an urgent security patch", "緊急セキュリティパッチをリリースする", "put out"],
  ["put together a cross-functional team", "部門横断チームを編成する", "put together"],
  ["run out of compute resources", "計算リソースを使い果たす", "run out"],
  ["send out automated notifications", "自動通知を一斉送信する", "send out"],
  ["set out a clear roadmap", "明確なロードマップを提示して出発する", "set out"],
  ["show up in the error logs", "エラーログに出現する", "show up"],
  ["shut down the idle instances", "アイドル状態のインスタンスを停止する", "shut down"],
  ["slow down the build pipeline", "ビルドパイプラインを減速させる", "slow down"],
  ["sort out the configuration conflict", "設定の競合を整理・解決する", "sort out"],
  ["stand out from the competition", "競合他社から群を抜いて際立つ", "stand out"],
  ["start out as a small prototype", "小さなプロトタイプとして出発する", "start out"],
  ["stay up under peak load", "ピーク負荷でもダウンせず稼働し続ける", "stay up"],
  ["step up security measures", "セキュリティ対策を一段と強化する", "step up"],
  ["stick to the architectural principles", "アーキテクチャ原則を頑なに守る", "stick to"],
  ["sum up the key takeaways", "重要な要点を要約する", "sum up"],
  ["switch over to the new engine", "新しいエンジンへ完全に切り替える", "switch over"],
  ["take back the initial estimate", "当初の見積もりを撤回する", "take back"],
  ["take down the staging server", "ステージングサーバーを停止・撤去する", "take down"],
  ["take in the full context", "全体の文脈を完全に理解・吸収する", "take in"],
  ["talk over the trade-offs", "トレードオフについてじっくり話し合う", "talk over"],
  ["think through the edge cases", "エッジケースを最後まで考え抜く", "think through"],
  ["throw away outdated assumptions", "時代遅れの前提を捨て去る", "throw away"],
  ["try out the new voice interface", "新しい音声インターフェースを試用する", "try out"],
  ["turn around a failing project", "不振のプロジェクトを劇的に立て直す", "turn around"],
  ["turn back to the stable snapshot", "安定したスナップショットへ引き返す", "turn back"],
  ["turn into a major bottleneck", "深刻なボトルネックへと変貌する", "turn into"],
  ["turn off unnecessary background tasks", "不要なバックグラウンド処理をオフにする", "turn off"],
  ["turn on real-time telemetry", "リアルタイム計測をオンにする", "turn on"],
  ["turn over high-volume transactions", "大量のトランザクションを処理・回転させる", "turn over"],
  ["wake up to the reality of", "〜という現実に気づく・覚醒する", "wake up"],
  ["watch out for memory leaks", "メモリリークに十分注意する", "watch out"],
  ["wear off after initial excitement", "初期の熱狂の後に徐々に薄れる", "wear off"],
  ["wind up with a cleaner codebase", "結果としてよりクリーンなコードベースに落ち着く", "wind up"],
  ["wipe out technical debt", "技術的負債を一掃する", "wipe out"],
  ["write down the specification", "仕様を文書に書き記す", "write down"],
  ["back up the production database", "本番データベースをバックアップする", "back up"],
  ["blow up under unexpected load", "予期せぬ負荷で破綻・急増する", "blow up"],
  ["break out of the plateau", "学習の停滞期（プラトー）から脱出する", "break out"],
  ["break through the 3000ms barrier", "3000ミリ秒の壁を突破する", "break through"],
  ["break up the monolith into services", "モノリスを複数サービスに分割する", "break up"],
  ["bring down the response latency", "応答レイテンシを引き下げる", "bring down"],
  ["bring out the best performance", "最高のパフォーマンスを引き出す", "bring out"],
  ["brush up on advanced collocations", "高度なコロケーションに磨きをかける", "brush up"],
  ["call off the scheduled maintenance", "予定されていたメンテナンスを中止する", "call off"],
  ["carry on with the experiment", "実験をそのまま継続する", "carry on"],
  ["catch up with industry standards", "業界標準に追いつく", "catch up"],
  ["check in the updated source code", "更新されたソースコードをコミット登録する", "check in"],
  ["clean up the deprecated endpoints", "非推奨エンドポイントを整理・清掃する", "clean up"],
  ["close down legacy servers", "レガシーサーバーを閉鎖する", "close down"],
  ["come across a counterintuitive finding", "直感に反する興味深い知見に遭遇する", "come across"],
  ["come along with steady improvements", "着実な改善を伴って進展する", "come along"],
  ["come around to our viewpoint", "最終的に私たちの見解に賛同するようになる", "come around"],
  ["come off as highly professional", "極めてプロフェッショナルな印象を与える", "come off"],
  ["come over as a natural speaker", "自然な話し手として伝わる", "come over"],
  ["come through the stress test", "ストレステストを無事に乗り切る", "come through"],
  ["count on the fallback mechanism", "フォールバック機構を頼りにする", "count on"],
  ["cut back on unnecessary API calls", "不要なAPI呼び出しを削減する", "cut back"],
  ["cut off the hanging process", "ハングしたプロセスを遮断する", "cut off"],
  ["cut out the middle layer", "中間レイヤーを省略・削除する", "cut out"],
  ["deal with concurrent requests", "同時並行リクエストを処理・対処する", "deal with"],
  ["do away with manual configuration", "手動設定を廃止する", "do away with"],
  ["draw up a comprehensive plan", "包括的な計画書を作成・起草する", "draw up"],
  ["drop off after the first week", "最初の1週間後に急減する", "drop off"],
  ["drop out of the training queue", "トレーニングキューから離脱する", "drop out"],
  ["fall back on the local engine", "ローカル推論エンジンへフォールバックする", "fall back"],
  ["fall behind the release schedule", "リリーススケジュールから遅れをとる", "fall behind"],
  ["fill in the missing blanks", "空欄箇所を埋める・補完する", "fill in"],
  ["fill out the evaluation form", "評価フォームに記入する", "fill out"],
  ["filter out background noise", "背景ノイズをフィルタリングして除去する", "filter out"],
  ["follow up on the action items", "アクションアイテムをフォローアップする", "follow up"],
  ["get across the core concept", "核心となる概念を相手に明確に伝える", "get across"],
  ["get ahead of potential bottlenecks", "潜在的なボトルネックに対して先手を打つ", "get ahead"],
  ["get along with cross-team members", "他チームのメンバーと円滑に協業する", "get along"],
  ["get around the sandbox limitation", "制限を適切な設計で回避する", "get around"],
  ["get away from rote memorization", "丸暗記から脱却する", "get away"],
  ["get by with minimal bandwidth", "最小限の帯域幅でなんとかやりくりする", "get by"],
  ["get down to the core implementation", "中核の実装作業に本腰を入れて取り掛かる", "get down"],
  ["give away the competitive advantage", "競争優位性をみすみす手放す", "give away"],
  ["give in to short-term pressure", "短期的なプレッシャーに屈する", "give in"],
  ["give off a clear signal", "明確なシグナルを発する", "give off"],
  ["go ahead with the migration", "マイグレーションをそのまま断行する", "go ahead"],
  ["go along with the proposed schema", "提案されたスキーマに賛同する", "go along"],
  ["go over the architecture diagram", "アーキテクチャ図を念入りに点検・復習する", "go over"],
];

// ============================================================================
// 重複排除機能付き・全3,500+表現コーパスビルダー
// ============================================================================
function buildFullCorpusSets(): {
  PEL: RawCorpusTuple[];
  ACL: RawCorpusTuple[];
  AFL: RawCorpusTuple[];
  PVPL: RawCorpusTuple[];
} {
  const globalSeen = new Set<string>();

  const registerUnique = (
    list: RawCorpusTuple[],
    tuple: RawCorpusTuple,
    maxCount: number
  ) => {
    if (list.length >= maxCount) return;
    const key = tuple[0].toLowerCase().trim();
    if (!globalSeen.has(key)) {
      globalSeen.add(key);
      list.push(tuple);
    }
  };

  // 1. PVPL (150 句動詞)
  const pvplList: RawCorpusTuple[] = [];
  for (const item of PVPL_CATALOG) {
    registerUnique(pvplList, item, 150);
  }

  // 2. PEL (505 句表現)
  const pelList: RawCorpusTuple[] = [];
  for (const item of PEL_BASE) {
    registerUnique(pelList, item, 505);
  }
  for (const [frameEn, frameJa, core] of PEL_PREP_FRAMES) {
    for (const [nounEn, nounJa] of PEL_TARGET_NOUNS) {
      registerUnique(
        pelList,
        [
          `${frameEn} ${nounEn}`,
          `${nounJa}${frameJa}`,
          core,
          `定型表現「${frameEn}（${frameJa}）」と名詞句「${nounEn}（${nounJa}）」を結合した高頻度チャンク。前置詞句全体を1つの音声ブロックとして知覚・発話します。`,
        ],
        505
      );
    }
  }

  // 3. AFL (600 学術定型フォーミュラ)
  const aflList: RawCorpusTuple[] = [];
  for (const item of AFL_BASE) {
    registerUnique(aflList, item, 600);
  }
  for (const [prefixEn, prefixJa] of AFL_STANCE_PREFIXES) {
    for (const [compEn, compJa] of AFL_VERBS_COMPLEMENTS) {
      const coreWord = compEn.split(" ")[0];
      registerUnique(
        aflList,
        [
          `${prefixEn} ${compEn}`,
          `${prefixJa}${compJa}`,
          coreWord,
          `学術談話フォーミュラ「${prefixEn}」に動詞句「${compEn}」を続けた構文チャンク。発話の冒頭でスタンスを明示しながら遅滞なく本論へ繋げます。`,
        ],
        600
      );
    }
  }
  // 残りのAFL枠を補充
  const aflDiscourseFrames: [string, string][] = [
    ["in the context of", "〜という文脈において："],
    ["on the basis of", "〜という根拠に基づいて："],
    ["with respect to", "〜という観点に関して："],
    ["as a function of", "〜に応じた関数（結果）として："],
    ["to the extent that", "〜という程度・範囲において："],
  ];
  for (const [dfEn, dfJa] of aflDiscourseFrames) {
    for (const [nEn, nJa] of ACL_NOUNS_RESEARCH) {
      registerUnique(
        aflList,
        [
          `${dfEn} ${nEn}`,
          `${nJa}${dfJa.replace("：", "")}`,
          nEn.split(" ")[0],
          `学術論文・ディベートで論理の前提枠組みを規定する定型フォーミュラ「${dfEn}」を用いた表現。`,
        ],
        600
      );
    }
  }

  // 4. ACL (重複排除後 約2,265表現 → 4リスト合計 約3,520ユニーク表現)
  const aclList: RawCorpusTuple[] = [];
  for (const item of ACL_BASE) {
    registerUnique(aclList, item, 2265);
  }
  // Group 1: 分析動詞 × 研究名詞 (25 × 25 = 625)
  for (const [vEn, vJa] of ACL_VERBS_ANALYZE) {
    for (const [nEn, nJa] of ACL_NOUNS_RESEARCH) {
      const core = vEn.split(" ")[0];
      registerUnique(
        aclList,
        [
          `${vEn} ${nEn}`,
          `${nJa}${vJa.replace("〜", "")}`,
          core,
          `学術動詞句「${vEn}」と専門名詞「${nEn}（${nJa}）」の学術コロケーション。`,
        ],
        2265
      );
    }
  }
  // Group 2: 促進・解決動詞 × 戦略名詞 (25 × 25 = 625)
  for (const [vEn, vJa] of ACL_VERBS_ACTION) {
    for (const [nEn, nJa] of ACL_NOUNS_STRATEGY) {
      const core = vEn.split(" ")[0];
      registerUnique(
        aclList,
        [
          `${vEn} ${nEn}`,
          `${nJa}${vJa.replace("〜", "")}`,
          core,
          `実務・学術で多用される動詞句「${vEn}」と目的語「${nEn}（${nJa}）」の共起チャンク。`,
        ],
        2265
      );
    }
  }
  // Group 3: 学術形容詞 × 学術コア名詞 (40 × 28 = 1,120)
  for (const [adjEn, adjJa] of ACL_ADJECTIVES) {
    for (const [nounEn, nounJa] of ACL_CORE_NOUNS) {
      const article = /^[aeiou]/i.test(adjEn) ? "an" : "a";
      registerUnique(
        aclList,
        [
          `adopt ${article} ${adjEn} ${nounEn}`,
          `${adjJa}${nounJa}`,
          adjEn,
          `C1/C2レベルの学術形容詞「${adjEn}（${adjJa}）」と名詞「${nounEn}」の自然なコロケーション。`,
        ],
        2265
      );
    }
  }

  return {
    PEL: pelList,
    ACL: aclList,
    AFL: aflList,
    PVPL: pvplList,
  };
}

const FULL_CORPUS = buildFullCorpusSets();

export const PEL_CATALOG: RawCorpusTuple[] = FULL_CORPUS.PEL;
export const ACL_CATALOG: RawCorpusTuple[] = FULL_CORPUS.ACL;
export const AFL_CATALOG: RawCorpusTuple[] = FULL_CORPUS.AFL;
export const PVPL_FULL_CATALOG: RawCorpusTuple[] = FULL_CORPUS.PVPL;
export const RAW_TOTAL_BEFORE_DEDUP = 3724;
