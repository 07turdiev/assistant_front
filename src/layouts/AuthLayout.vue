<template>
  <div class="auth-layout">
    <div class="auth-layout__panel">
      <div class="auth-layout__brand">
        <h1>{{ $t('app.title') }}</h1>
        <p>{{ $t('app.subtitle') }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.auth-layout {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1976d2 0%, #2196f3 100%);
  padding: 16px;

  &__panel {
    width: 100%;
    max-width: 420px;
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    padding: 40px 32px;
  }

  &__brand {
    text-align: center;
    margin-bottom: 32px;

    h1 {
      margin: 0 0 8px;
      font-size: 24px;
      color: #1f2d3d;
    }
    p {
      margin: 0;
      font-size: 14px;
      color: #5a6c7d;
    }
  }
}

@include mobile {
  .auth-layout {
    padding: 12px;
    align-items: flex-start;
    padding-top: 32px;

    &__panel {
      padding: 28px 20px;
      border-radius: 14px;
    }

    &__brand {
      margin-bottom: 24px;

      h1 {
        font-size: 20px;
      }
    }
  }
}
</style>
