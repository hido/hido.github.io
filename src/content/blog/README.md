# Blog（原稿置き場）

note が正（canonical）。このリポジトリは原稿と画像を保管するだけで、サイトに本文ページは作らない。
サイトには note へのリンクカードだけが出る。

- Blog ページ：書き出し約100字の抜粋つきの大きめカード
- トップの「最近の活動」：タイトルだけのカード（他のカードと同じサイズ）
- RSS：note の URL へリンク

## フォルダ構成

```
src/content/blog/<年>/<YYYY-MM-DD-slug>/
  index.md     原稿（Markdown）
  cover.jpg    カバー画像（任意）
  fig1.png …   本文中の画像
```

フォルダ名（`YYYY-MM-DD-slug`）がそのまま URL の slug になる。英数字とハイフンで付ける。

## index.md の書き方

```markdown
---
title: "記事タイトル"
date: 2026-11-20
note: "https://note.com/…/n/…"   # note 公開後に追加。未設定なら下書き扱いでサイトに出ない
x: "https://x.com/sla/article/…" # X 記事にも載せたら追加（任意）
cover: cover.jpg                  # 任意。なければタイトルカードを自動生成
# excerpt: "抜粋を手で書きたいときだけ"
---

本文。冒頭の約100字が抜粋になる（見出し・画像・リンクの URL は除く）。

![図1](./fig1.png)

…

初出：https://note.com/…（2026年11月20日）
```

## 公開の流れ

1. フォルダを作って `index.md` と画像を置き、push する（`note` はまだ書かない）。
   - この時点でカバー画像がビルドされる。下書きはサイトの一覧には出ない。
2. カバー画像をダウンロードして note / X に使う。
   - note 見出し画像（1280×670）：`https://hido.github.io/blog-covers/<slug>/note.jpg`
   - X 記事カバー（5:2, 1500×600）：`https://hido.github.io/blog-covers/<slug>/x.jpg`
   - サイトのカード（16:9）：`https://hido.github.io/blog-covers/<slug>/card.jpg`
   - 写真は中央で切り抜かれ、EXIF（位置情報など）は削除される。
3. note に投稿する。末尾に「初出」を書かない（note が正なので不要）。
4. X 記事にも載せるなら、末尾に note へのリンクを書く。
5. `index.md` に `note:`（と `x:`）を追加して push → サイトに出る。

## 注意

- **このリポジトリは公開**。下書きを push すると GitHub 上で誰でも読める。
  公開前の原稿を秘密にしたいときは、note の下書きか手元で書いて、公開時にここへ置く。
- 下書きのカバー画像も `/blog-covers/` に公開される（URL を知っていれば見える）。
- 原稿を直したら、note と X 記事も手で直す。
