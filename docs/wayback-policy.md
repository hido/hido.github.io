# Wayback Machine 運用ポリシー

このサイトのコンテンツに含まれる**外部 URL**（講演ページ、メディア記事、論文、特許、動画など）は、リンク切れに備えて Internet Archive の Wayback Machine にスナップショットを保全します。元 URL → 保存済み Wayback URL のペアは [`src/data/wayback.json`](../src/data/wayback.json) に保存されています。

## なぜ必要か

- 新聞・専門メディアの古い記事はサイト改修や有料化で消えることが多い
- 学会・企業のイベントページは年度で消える
- 個人サイト・GitHub Pages・スライドリンクも頻繁にリンク切れする
- リンク切れ時に Wayback URL に差し替えればコンテンツは生き続ける

## 仕組み

`scripts/wayback-submit.mjs` が `src/content/` 配下の全 MD を走査し、frontmatter から外部 URL を抽出 → IA Save Page Now (SPN) に GET → リダイレクト先のスナップショット URL を `src/data/wayback.json` に記録します。

```
src/content/**/*.md
   ↓ 抽出
[external URLs]
   ↓ SPN GET (~10 sec/URL)
[snapshot URLs from redirect]
   ↓ 保存
src/data/wayback.json
```

`wayback.json` の形式：

```json
{
  "https://example.com/article": {
    "wayback": "https://web.archive.org/web/20260503/https://example.com/article",
    "capturedAt": "2026-05-03T08:00:00.000Z"
  }
}
```

## 運用コマンド

| コマンド | 用途 |
|---|---|
| `npm run wayback` | 未登録 URL のみ submit（通常運用） |
| `npm run wayback:check` | 全 URL が wayback.json に揃っているか検査、欠けていれば exit 1（CI 向き） |
| `npm run wayback:refresh` | 全 URL を再 submit してスナップショット更新（年 1 回程度） |

実行ペース：1 URL あたり約 10 秒（IA レート制限考慮）。75 URL で約 13 分。

## 日常運用

### コンテンツ追加・URL 変更時

新しい talks / press / awards / publications を追加した、または既存カードの `links.web` などを変えた **必ず**：

```bash
npm run wayback
```

成功すると `src/data/wayback.json` に新しい URL のペアが追加されます。コミット時に `wayback.json` の diff も含めてください。

### リンク切れに気付いたとき

1. `src/data/wayback.json` を grep して死んだ URL を探す
2. 対応する `wayback` フィールドの URL をコピー
3. 該当 MD ファイルの `links.web`（or 該当フィールド、`url` など）に差し替え
4. コミット

簡易チェックコマンド：

```bash
node scripts/check-dead-links.mjs           # 全 URL を HEAD で生存確認、死んでるものリスト表示
node scripts/check-dead-links.mjs --apply   # 死んでる URL を自動で wayback.json の値に差し替え（要レビュー）
```

### 年 1 回程度のメンテ

```bash
npm run wayback:refresh
```

全 URL を再 submit して新しいスナップショットを取り、`wayback.json` のペアを最新版に更新。これで「古いスナップショットしか残っていない」状態を防げます。

## 構造的に救えない URL

以下のサイトは IA SPN で安定的にアーカイブできません（4 回リトライしても snapshot 取得失敗、IA に過去キャプチャもなし）：

| サイト種別 | 原因 |
|---|---|
| IEEE Xplore (`ieeexplore.ieee.org`) | anti-bot |
| Google Patents の一部 | 重い JS、IA SPN レンダリング失敗 |
| note.com | SPA、IA レンダリング失敗 |
| 直接 PDF（特に企業ドメイン） | 大きなバイナリ + anti-bot |
| 古いランディングページ（ITmedia EXPO 等） | 既に消失している可能性 |

これらの URL がカードに含まれる場合、Wayback 保全はベストエフォートとなり、リンク切れ時に手動で代替を探すか諦める判断になります。新規追加時は可能な限り IA 保全可能なドメイン（公式な archive.org / journal DOI / Springer / J-STAGE 等）を優先するのが理想です。

## CI 連携（任意）

`npm run wayback:check` を `.github/workflows/deploy.yml` などに組み込むと、未登録 URL があるとビルドが失敗する仕組みになります。現状は未組み込み（`wayback` 実行は手動）。

## 関連ファイル

- スクリプト: [`scripts/wayback-submit.mjs`](../scripts/wayback-submit.mjs)
- リンク切れ検出: [`scripts/check-dead-links.mjs`](../scripts/check-dead-links.mjs)
- データ: [`src/data/wayback.json`](../src/data/wayback.json)
- 簡易メモ: [`src/README.md`](../src/README.md)
