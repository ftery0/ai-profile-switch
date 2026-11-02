---
layout: home
title: ai-profile-switch — Claude Code 멀티 계정 프로필 관리 도구
description: 회사·개인 Claude Code 계정을 한 컴퓨터에서 쓰세요. claude 를 실행할 때 고르고, 로그인·기록·설정은 프로필마다 따로 남아요.
jsonLd:
  "@context": "https://schema.org"
  "@type": "SoftwareApplication"
  name: "ai-profile-switch"
  applicationCategory: "DeveloperApplication"
  operatingSystem: "macOS, Linux, Windows"
  offers:
    "@type": "Offer"
    price: "0"
    priceCurrency: "USD"
  description: "Claude Code를 위한 멀티 계정 프로필 관리 도구. 회사와 개인 계정을 즉시 전환합니다."
  url: "https://ftery0.github.io/ai-profile-switch/ko/"
  downloadUrl: "https://www.npmjs.com/package/ai-profile-switch"
  author:
    "@type": "Person"
    name: "haejun"
  license: "https://opensource.org/licenses/MIT"

hero:
  name: ai-profile-switch
  text: 쓸 계정만 고르면 끝
  tagline: 회사·개인 Claude Code 계정을 한 컴퓨터에서 써요. 로그인, 기록, 설정이 프로필마다 따로 남아요.
  actions:
    - theme: brand
      text: 시작하기
      link: /ko/guide/
    - theme: alt
      text: GitHub
      link: https://github.com/ftery0/ai-profile-switch

features:
  - title: 시작할 때 고르기
    details: <code>claude</code> 를 실행하면 프로필을 골라요. 고르기 전에 이메일, 요금제, 최근 사용량이 보여요.
  - title: 서로 섞이지 않아요
    details: 로그인, 대화 기록, 프로젝트가 프로필마다 따로 남아요. 바꿔도 다른 프로필은 그대로예요.
  - title: 원하는 것만 함께
    details: 설정은 처음부터 같이 써요. <code>CLAUDE.md</code>, skills 같은 것도 <code>cpf share add</code> 로 더할 수 있어요.
---

<div class="home-steps">

## 1분이면 시작해요

<ol class="steps">
  <li>
    <b>설치하기</b>
    <span><code>work, personal</code> 처럼 프로필 이름을 적어요. 지금 쓰는 <code>~/.claude</code> 도 가져올 수 있어요.</span>
    <code class="cmd">npx ai-profile-switch@latest init</code>
  </li>
  <li>
    <b>새 터미널에서 Claude 실행</b>
    <span>프로필이 하나면 바로 켜지고, 여럿이면 골라요.</span>
    <code class="cmd">claude</code>
  </li>
  <li>
    <b>언제든 바꾸고 관리하기</b>
    <span>이름 바꾸기, 다시 로그인, 사용량 보기, 설정 함께 쓰기.</span>
    <code class="cmd">cpf</code>
  </li>
</ol>

<figure class="demo">
  <img src="/demo.gif" alt="claude 로 프로필을 고르고, cpf 로 바꾸고, cpf share 로 CLAUDE.md 를 함께 쓰는 화면" width="865" height="518" loading="lazy">
</figure>

</div>
