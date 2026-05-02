<template>
  <component :is="layoutComponent">
    <RouterView />
  </component>
</template>

<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const route = useRoute()

const layoutComponent = shallowRef<typeof AuthLayout | typeof DefaultLayout>(DefaultLayout)

watch(
  () => route.meta.layout,
  (layout) => {
    layoutComponent.value = layout === 'auth' ? AuthLayout : DefaultLayout
  },
  { immediate: true }
)

const _ = computed(() => route.name)
</script>
