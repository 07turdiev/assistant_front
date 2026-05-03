<template>
  <ReportList kind="request" :title="$t('nav.requests')" :can-create="canCreate" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ReportList from '@/components/report/ReportList.vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

// Faqat Assistant va Assistant Premier request yarata oladi
const canCreate = computed(() => auth.hasRole('ASSISTANT', 'ASSISTANT_PREMIER'))
</script>
