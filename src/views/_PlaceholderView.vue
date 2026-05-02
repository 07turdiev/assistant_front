<template>
  <el-card>
    <template #header>
      <h2>{{ title || $t('placeholder.title') }}</h2>
    </template>
    <p>{{ $t('placeholder.description') }}</p>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{ title?: string }>()
</script>
