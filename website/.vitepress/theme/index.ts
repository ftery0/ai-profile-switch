import DefaultTheme from 'vitepress/theme'
import { useRoute } from 'vitepress'
import { h, onMounted, watch, nextTick } from 'vue'
import AccountSheet from './AccountSheet.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  // The home hero shows the install command under its buttons and the picker beside them.
  Layout: () => h(DefaultTheme.Layout, null, {
    'home-hero-actions-after': () => h('p', { class: 'install' }, ['$ ', h('code', 'npx ai-profile-switch@latest init')]),
    'home-hero-image': () => h(AccountSheet),
  }),
  setup() {
    const route = useRoute()

    function injectJsonLd() {
      // Remove previous injected JSON-LD
      document.querySelectorAll('script[data-jsonld]').forEach(el => el.remove())

      // Read JSON-LD from page frontmatter (client-side)
      const el = document.querySelector('[data-json-ld]')
      if (el) {
        const script = document.createElement('script')
        script.type = 'application/ld+json'
        script.setAttribute('data-jsonld', '')
        script.textContent = el.getAttribute('data-json-ld') || ''
        document.head.appendChild(script)
      }
    }

    onMounted(() => {
      injectJsonLd()
      watch(() => route.path, () => nextTick(injectJsonLd))
    })
  },
}
