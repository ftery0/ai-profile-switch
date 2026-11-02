<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'

// An example of the picker `claude` opens: one profile per Claude account.
const { lang } = useData()
const ko = computed(() => lang.value === 'ko')

const profiles = [
  { name: 'Work', email: 'you@company.com', icon: 'work', tone: 'blue' },
  { name: 'Personal', email: 'you@gmail.com', icon: 'home', tone: 'green' },
  { name: 'Side project', email: 'you@studio.dev', icon: 'code', tone: 'orange' },
]
</script>

<template>
  <div
    class="account-sheet"
    role="img"
    :aria-label="ko ? '프로필 고르기 화면 예시: Work, Personal, Side project' : 'Example of the profile picker: Work, Personal, Side project'"
  >
    <p class="title" aria-hidden="true">{{ ko ? '어떤 프로필로 열까요?' : 'Choose a profile' }}</p>
    <ul aria-hidden="true">
      <li v-for="(profile, i) in profiles" :key="profile.name" :class="{ on: i === 0 }">
        <span class="avatar" :class="profile.tone">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <template v-if="profile.icon === 'work'">
              <rect x="3" y="7" width="18" height="13" rx="3" />
              <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" />
            </template>
            <path v-else-if="profile.icon === 'home'" d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />
            <path v-else d="M8 8l-4 4 4 4M16 8l4 4-4 4" />
          </svg>
        </span>
        <span class="info">
          <b>{{ profile.name }}</b>
          <span>{{ profile.email }}</span>
        </span>
        <span v-if="i === 0" class="check">
          <svg viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg>
        </span>
      </li>
    </ul>
    <p class="button" aria-hidden="true">{{ ko ? 'Work로 열기' : 'Open Work' }}</p>
  </div>
</template>

<style scoped>
.account-sheet {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
  padding: 24px 14px 14px;
  border-radius: 28px;
  background: var(--aps-sheet-bg);
  box-shadow: var(--aps-sheet-shadow);
  text-align: left;
}

.title {
  margin: 0;
  padding: 0 14px 12px;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border-radius: 16px;
}

li.on {
  background: var(--vp-c-brand-soft);
}

.avatar {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
}

.avatar svg {
  width: 20px;
  height: 20px;
}

.avatar.blue {
  background: var(--aps-blue-soft);
  color: var(--aps-blue-text);
}

.avatar.green {
  background: var(--aps-green-soft);
  color: var(--aps-green-text);
}

.avatar.orange {
  background: var(--aps-orange-soft);
  color: var(--aps-orange-text);
}

.info {
  flex: 1;
  min-width: 0;
}

.info b {
  display: block;
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
}

li.on .info b {
  color: var(--vp-c-brand-1);
}

.info span {
  display: block;
  margin-top: 2px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-3);
}

.check {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--vp-button-brand-bg);
}

.check svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--vp-button-brand-text);
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.button {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 14px 4px 0;
  border-radius: 14px;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
  font-size: 16px;
  font-weight: 600;
}
</style>
