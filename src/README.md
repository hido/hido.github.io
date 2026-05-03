# 開発・運用メモ

Astro + Tailwind CSS で構築。

## 開発

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # dist/ に静的ファイルを生成
npm run preview  # build 後のローカル確認
```

## コンテンツ追加

- 講演: `src/content/talks/<year>/<slug>.md`
- 論文: `src/content/publications/<year>/<slug>.md`
- メディア掲載: `src/content/press/<year>/<slug>.md`
- 表彰: `src/content/awards/<year>/<slug>.md`
- 2023 年以降は年度フォルダ、2022 年以前は `archive/` に配置。

スキーマは `src/content.config.ts` を参照。

## 外部リンクの Wayback Machine 保全

新カード追加・URL 変更時は必ず `npm run wayback` を実行して `src/data/wayback.json` を更新してください。詳細な運用手順・リンク切れ復旧方法・コマンド一覧は [`docs/wayback-policy.md`](../docs/wayback-policy.md) を参照。

## デプロイ

`main` への push で `.github/workflows/deploy.yml` が走り、GitHub Pages に自動公開されます。

旧 Jekyll 版のソースは `obsolete` ブランチに保存されています。
