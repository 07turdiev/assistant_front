<template>
  <ReportList kind="task" :title="$t('nav.tasks')" :can-create="canCreate" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReportList from '@/components/report/ReportList.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Faqat Premier va Head task yarata oladi
const canCreate = computed(() => auth.hasRole('PREMIER_MINISTER', 'HEAD'))
</script>
