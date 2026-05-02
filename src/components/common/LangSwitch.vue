<template>
  <el-dropdown trigger="click" @command="onCommand">
    <span class="lang-switch">{{ current.toUpperCase() }}</span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="uz">O'zbek</el-dropdown-item>
        <el-dropdown-item command="ru">Русский</el-dropdown-item>
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

function onCommand(value: Locale) {
  setLocale(value)
}
</script>

<style lang="scss" scoped>
.lang-switch {
  cursor: pointer;
  font-weight: 600;
  color: #1f2d3d;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  font-size: 13px;
}
</style>
