---
layout: page
permalink: /publications/
title: 論文
description: 論文誌や国際会議発表などの学術活動。
nav: true
---

<div class="publications">

  <h2 class="year">論文誌</h2>
  {% bibliography -f papers -q @article %}

  <h2 class="year">国際会議論文</h2>
  {% bibliography -f papers -q @inproceedings %}
  

</div>
