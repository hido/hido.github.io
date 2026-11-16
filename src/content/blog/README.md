# Blog（原稿置き場）

note が正（canonical）。このリポジトリは原稿と画像を保管するだけで、サイトに本文ページは作らない。
サイトには note へのリンクカードだけが出る。

- Blog ページ：書き出し約100字の抜粋つきの大きめカード
- トップの「最近の活動」：タイトルだけのカード（他のカードと同じサイズ）
- RSS：note の URL へリンク

## フォルダ構成

```
src/content/blog/<年>/<YYYY-MM-DD-slug>/
  <好きな名前>.md          原稿（Markdown、1フォルダに1つ）
  cover.jpg / cover.png   カバー画像（任意。この名前なら自動で使われる）
  fig1.png …              本文中の画像
```

フォルダ名（`YYYY-MM-DD-slug`）がそのまま URL の slug になる。英数字とハイフンで付ける。

## 原稿 md の書き方

```markdown
---
title: "記事タイトル"
date: 2026-11-20
note: "https://note.com/…/n/…"   # note 公開後に追加。未設定なら下書き扱いでサイトに出ない
x: "https://x.com/sla/article/…" # X 記事にも載せたら追加（任意）
caption: "トップページのカード用の一言（30字以内）"  # 任意。なければ抜粋の先頭を2行で切る
# excerpt: "抜粋を手で書きたいときだけ"
---

本文。冒頭の約100字が抜粋になる（見出し・画像・リンクの URL は除く）。

![図1](./fig1.png)

…
```

## 公開の流れ

1. フォルダを作って原稿 md と画像（あれば cover.jpg / cover.png）を置き、push する（`note` はまだ書かない）。
   - cover がなければタイトルカードが自動生成される。
   - この時点でカバー画像がビルドされる。下書きはサイトの一覧には出ない。
2. カバー画像をダウンロードして note / X に使う。
   - note 見出し画像（1280×670）：`https://hido.github.io/blog-covers/<slug>/note.jpg`
   - X 記事カバー（5:2, 1500×600）：`https://hido.github.io/blog-covers/<slug>/x.jpg`
   - サイトのカード（16:9）：`https://hido.github.io/blog-covers/<slug>/card.jpg`
   - 写真は中央で切り抜かれ、EXIF（位置情報など）は削除される。
3. note に投稿する。末尾に「初出」を書かない（note が正なので不要）。
4. X 記事にも載せるなら、冒頭に「（オリジナルはnoteに）」と書いて note の記事 URL をリンクする。
5. 原稿 md に `note:`（と `x:`）を追加して push → サイトに出る。

## 注意

- **このリポジトリは公開**。下書きを push すると GitHub 上で誰でも読める。
  公開前の原稿を秘密にしたいときは、note の下書きか手元で書いて、公開時にここへ置く。
- 下書きのカバー画像も `/blog-covers/` に公開される（URL を知っていれば見える）。
- 原稿を直したら、note と X 記事も手で直す。
