---
layout: page
permalink: /external/
title: 講演・メディア
description: 外部での講演や記事、書籍など。
nav: true
---

<div class="publications">

  <h2 class="year">外部講演</h2>
  {% bibliography -f papers -q @booklet %}

  <h2 class="year">書籍</h2>
  {% bibliography -f papers -q @book %}  

</div>


