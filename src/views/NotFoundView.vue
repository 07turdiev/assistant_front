<template>
  <el-empty :description="$t('notFound.description')">
    <el-button type="primary" @click="$router.push({ name: 'dashboard' })">
      {{ $t('notFound.goHome') }}
    </el-button>
  </el-empty>
</template>
