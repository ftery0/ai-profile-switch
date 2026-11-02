---
layout: home
title: ai-profile-switch — Multi-account Profile Manager for Claude Code
description: Keep work and personal Claude Code accounts on one machine. Pick one each time you run claude; each keeps its own sign-in, history and settings.
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
  description: "Multi-account profile manager for Claude Code. Switch between work and personal accounts instantly."
  url: "https://ftery0.github.io/ai-profile-switch/"
  downloadUrl: "https://www.npmjs.com/package/ai-profile-switch"
  author:
    "@type": "Person"
    name: "haejun"
  license: "https://opensource.org/licenses/MIT"

hero:
  name: ai-profile-switch
  text: Pick an account.<br>That's it.
  tagline: Keep work and personal Claude Code accounts on one machine. Each has its own sign-in, history and settings.
  actions:
    - theme: brand
      text: Get started
      link: /guide/
    - theme: alt
      text: GitHub
      link: https://github.com/ftery0/ai-profile-switch

features:
  - title: Pick when you start
    details: Run <code>claude</code> and choose a profile. Each one shows its email, plan and recent usage first.
  - title: Nothing mixes
    details: Sign-in, history and projects stay in their own profile. Switching never touches the others.
  - title: Share what you want
    details: Settings are shared from the start. Add <code>CLAUDE.md</code>, skills and more with <code>cpf share add</code>.
---

<div class="home-steps">

## Up and running in a minute

<ol class="steps">
  <li>
    <b>Install</b>
    <span>Type profile names such as <code>work, personal</code>. Your current <code>~/.claude</code> can come along.</span>
    <code class="cmd">npx ai-profile-switch@latest init</code>
  </li>
  <li>
    <b>Open a new terminal and run Claude</b>
    <span>With one profile it starts right away. With more, you pick.</span>
    <code class="cmd">claude</code>
  </li>
  <li>
    <b>Switch or manage any time</b>
    <span>Rename, sign in again, check usage or share settings.</span>
    <code class="cmd">cpf</code>
  </li>
</ol>

<figure class="demo">
  <img src="/demo.gif" alt="Running claude and picking a profile, switching with cpf, and sharing CLAUDE.md with cpf share" width="865" height="518" loading="lazy">
</figure>

</div>
