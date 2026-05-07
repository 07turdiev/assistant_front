<template>
  <el-dropdown class="lang-dropdown" trigger="click" @command="onCommand">
    <span class="lang-switch">{{ currentLabel }}</span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="uz" :class="{ 'is-active': current === 'uz' }">
          O'zbek (lotin)
        </el-dropdown-item>
        <el-dropdown-item command="uz-Cyrl" :class="{ 'is-active': current === 'uz-Cyrl' }">
          Ўзбек (кирилл)
        </el-dropdown-item>
        <el-dropdown-item command="ru" :class="{ 'is-active': current === 'ru' }">
          Русский
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { setLocale, type Locale } from '@/i18n'

const { locale } = useI18n()

const current = computed(() => locale.value)

const currentLabel = computed(() => {
  switch (locale.value) {
    case 'ru': return 'RU'
    case 'uz-Cyrl': return 'УЗ'
    case 'uz':
    default: return 'UZ'
  }
})

function onCommand(value: Locale) {
  setLocale(value)
}
</script>

<style lang="scss" scoped>
/* Element Plus el-dropdown'ning tashqi border/outline'ini bekor qilamiz —
   faqat ichkaridagi `.lang-switch` border qoladi */
.lang-dropdown {
  outline: none !important;
  border: none !important;
  box-shadow: none !important;

  :deep(.el-tooltip__trigger) {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }

  &:focus,
  &:focus-visible,
  &:focus-within {
    outline: none !important;
    border: none !important;
    box-shadow: none !important;
  }
}

.lang-switch {
  cursor: pointer;
  font-weight: 600;
  color: #1f2d3d;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 13px;
  outline: none;
}

:global(.el-dropdown-menu__item.is-active) {
  background: rgba(26, 115, 232, 0.08);
  color: #1a73e8;
  font-weight: 600;
}
</style>
