<template>
  <div class="auth-shell">
    <!-- Chap brand panel — desktop'da to'liq, mobile'da pastdan kompakt -->
    <aside class="auth-brand">
      <div class="auth-brand__pattern" aria-hidden="true"></div>

      <div class="auth-brand__top">
        <img src="/favicon.svg" alt="Davlat ramzi" class="auth-brand__seal" />
        <div class="auth-brand__ministry">
          <div class="auth-brand__country">{{ $t('app.ministry1') }}</div>
          <div class="auth-brand__name">{{ $t('app.ministry2') }}</div>
        </div>
      </div>

      <div class="auth-brand__center">
        <h1 class="auth-brand__title">Raqamli yordamchi tizimi</h1>
      </div>

      <div class="auth-brand__footer">
        <span class="auth-brand__copyright">© 2026 — Madaniyat vazirligi</span>
      </div>
    </aside>

    <!-- O'ng forma paneli -->
    <main class="auth-form-side">
      <div class="auth-form-side__top">
        <LangSwitch />
      </div>

      <div class="auth-form-side__center">
        <div class="auth-form-wrap">
          <header class="auth-form-wrap__header">
            <h2 class="auth-form-wrap__welcome">Xush kelibsiz</h2>
            <p class="auth-form-wrap__hint">
              Hisobingizga kirib davom eting
            </p>
          </header>
          <slot />
        </div>
      </div>

      <footer class="auth-form-side__footer">
        <span>Texnik yordam: <a href="mailto:info@madaniyhayot.uz">info@madaniyhayot.uz</a></span>
      </footer>
    </main>
  </div>
</template>

<script setup lang="ts">
import LangSwitch from '@/components/common/LangSwitch.vue'
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

// Davlat tashkiloti uchun rasmiy palette — sofistikatsiyalangan charcoal/teal
$bg-900: #0b1418;
$bg-800: #122026;
$bg-700: #1a2f37;
$accent: #1f6f74;       // ko'k-yashil aksent (madaniy meros, sokin)
$gold: #c9a961;
$gold-soft: rgba(201, 169, 97, 0.16);

.auth-shell {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  background: #f5f7fa;
}

/* ============================================================
   Chap brand panel (desktop)
   ============================================================ */
.auth-brand {
  position: relative;
  flex: 0 0 46%;
  max-width: 620px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 48px 56px;
  color: #fff;
  background:
    radial-gradient(ellipse at 20% 0%, rgba(31, 111, 116, 0.35) 0%, transparent 55%),
    radial-gradient(ellipse at 90% 100%, rgba(201, 169, 97, 0.10) 0%, transparent 45%),
    linear-gradient(155deg, $bg-700 0%, $bg-800 45%, $bg-900 100%);
  overflow: hidden;
  isolation: isolate;

  &__pattern {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.10;
    background-image:
      radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.6) 1px, transparent 1px),
      url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><g fill="none" stroke="white" stroke-width="0.6"><path d="M80 10 L100 40 L130 50 L100 60 L80 90 L60 60 L30 50 L60 40 Z"/><path d="M80 70 L95 90 L115 95 L95 100 L80 120 L65 100 L45 95 L65 90 Z"/></g></svg>');
    background-size: 4px 4px, 200px 200px;
    z-index: -1;
  }

  &::after {
    /* Tilla aksent chiziq */
    content: '';
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 3px;
    background: linear-gradient(180deg, transparent 0%, $gold 50%, transparent 100%);
  }

  &__top {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__seal {
    width: 64px;
    height: 64px;
    filter: drop-shadow(0 4px 16px rgba(201, 169, 97, 0.30));
  }

  &__ministry {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__country {
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: $gold;
    font-weight: 500;
  }

  &__name {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #fff;
  }

  &__center {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 480px;
  }

  &__title {
    margin: 0;
    font-size: 38px;
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -0.01em;

    background: linear-gradient(120deg, #ffffff 0%, #e6d9b3 100%);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  &__quote {
    margin: 0;
    font-size: 15px;
    font-style: italic;
    color: rgba(255, 255, 255, 0.75);
    line-height: 1.55;
    padding-left: 16px;
    border-left: 2px solid $gold;
  }

  &__footer {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.50);
    letter-spacing: 0.04em;
  }

  &__copyright {
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.12em;
  }
}

/* ============================================================
   O'ng forma paneli
   ============================================================ */
.auth-form-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  position: relative;

  &__top {
    padding: 24px 32px 0;
    display: flex;
    justify-content: flex-end;
  }

  &__center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 32px;
  }

  &__footer {
    padding: 20px 32px 24px;
    font-size: 12px;
    color: #909399;
    text-align: center;

    a {
      color: $color-primary;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
  }
}

.auth-form-wrap {
  width: 100%;
  max-width: 380px;

  &__header {
    margin-bottom: 32px;
  }

  &__welcome {
    margin: 0 0 8px;
    font-size: 26px;
    font-weight: 700;
    color: $bg-900;
    letter-spacing: -0.01em;
  }

  &__hint {
    margin: 0;
    font-size: 14px;
    color: #5a6c7d;
  }
}

/* ============================================================
   Tablet (≤ 1024px) — brand panel kichkina bo'ladi
   ============================================================ */
@media (max-width: 1024px) {
  .auth-brand {
    flex: 0 0 40%;
    padding: 36px 32px;

    &__title { font-size: 30px; }
    &__seal { width: 48px; height: 48px; }
  }
}

/* ============================================================
   Mobile (≤ 768px) — brand pastdan kompakt, formdan keyin
   ============================================================ */
@media (max-width: 768px) {
  .auth-shell {
    flex-direction: column;
  }

  .auth-brand {
    flex: 0 0 auto;
    max-width: none;
    padding: 24px 20px 28px;
    text-align: center;
    order: 1;

    &__top {
      justify-content: center;
      gap: 12px;
    }

    &__seal {
      width: 44px;
      height: 44px;
    }

    &__name {
      font-size: 15px;
    }

    &__country {
      font-size: 10px;
    }

    &__center {
      align-items: center;
      text-align: center;
      max-width: none;
      margin-top: 18px;
      gap: 10px;
    }

    &__title {
      font-size: 22px;
    }

    &__quote {
      font-size: 13px;
      padding: 0;
      border-left: none;
      max-width: 320px;
    }

    &__footer {
      display: none;  // Mobile'da o'ng paneldagi footer bilan almashtirish
    }
  }

  .auth-form-side {
    order: 2;
    flex: 1;

    &__top {
      padding: 16px 16px 0;
    }

    &__center {
      padding: 24px 20px;
    }

    &__footer {
      padding: 16px 16px 20px;
    }
  }
}

@media (max-width: 480px) {
  .auth-brand {
    padding: 20px 16px 22px;

    &__title { font-size: 19px; }
  }
}
</style>
