<template>
  <div v-if="chief" class="on-behalf">
    <el-icon class="on-behalf__icon"><UserFilled /></el-icon>
    <span>{{ $t('onBehalf.acting', { name: chiefName }) }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { UserFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { localize, localizeBilingual } from '@/utils/translit'

const auth = useAuthStore()

const chief = computed(() => auth.user?.chief ?? null)

const chiefName = computed(() => {
  const c = chief.value
  if (!c) return ''
  const name = localize([c.last_name, c.first_name].filter(Boolean).join(' '))
  const role = localizeBilingual(c.role_label_uz, c.role_label_ru)
  return role ? `${name} (${role})` : name
})
</script>

<style lang="scss" scoped>
@use '@/assets/styles/variables.scss' as *;

.on-behalf {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: $color-primary-soft;
  color: $color-primary-dark;
  border: 1px solid rgba(26, 115, 232, 0.25);
  border-radius: $radius-sm;
  font-size: 13px;
  font-weight: 500;

  &__icon {
    flex-shrink: 0;
    font-size: 16px;
  }
}
</style>
