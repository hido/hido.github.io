# hido.github.io

比戸将平 (Shohei Hido) の個人サイト。Astro + Tailwind CSS で構築。

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
- 2023 年以降は年度フォルダ、2022 年以前は `archive/` に配置。

スキーマは `src/content.config.ts` を参照。

## デプロイ

`main` または `master` への push で `.github/workflows/deploy.yml` が走り、GitHub Pages に自動公開されます。

旧 Jekyll 版のソースは `obsolete` ブランチに保存されています。
