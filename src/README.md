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

## 外部リンクの Wayback Machine 保全（ポリシー）

リンク切れに備え、コンテンツ内の外部 URL は Internet Archive の Wayback Machine にスナップショットを保存し、`src/data/wayback.json` に元 URL → 保存済み URL のペアを記録します。

- 新しいカード（talks / press / awards / publications）を追加または既存カードの URL を変更した場合は、必ず以下を実行：

  ```bash
  npm run wayback           # 未登録 URL を IA にサブミットして wayback.json を更新
  npm run wayback:check     # 全 URL が wayback.json に揃っているかチェック（CI 用）
  npm run wayback:refresh   # 全 URL を再サブミット（年に 1 回程度の更新用）
  ```

- リンク切れに気付いたら、`src/data/wayback.json` から元 URL を引いて、対応する `wayback` URL を該当 MD ファイルの `links.web` などに置き換えます。
- IA はレート制限が厳しいので、`npm run wayback` は 1 URL あたり 7 秒程度かかります（75 URL で約 10 分）。

## デプロイ

`main` への push で `.github/workflows/deploy.yml` が走り、GitHub Pages に自動公開されます。

旧 Jekyll 版のソースは `obsolete` ブランチに保存されています。
