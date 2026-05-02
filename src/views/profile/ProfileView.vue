<template>
  <el-card v-if="auth.user">
    <template #header>
      <div class="header">
        <span>{{ $t('nav.profile') }}</span>
        <el-button size="small" type="primary" @click="$router.push({ name: 'profile.edit' })">
          {{ $t('common.edit') }}
        </el-button>
      </div>
    </template>

    <div class="profile">
      <el-avatar :size="96" :src="auth.user.avatar_url || undefined">
        {{ initials }}
      </el-avatar>
      <el-descriptions :column="1" class="profile__desc">
        <el-descriptions-item :label="$t('profile.fullName')">
          {{ fullName }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('profile.position')">
          {{ position }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('profile.role')">
          {{ auth.user.role.label_uz }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('profile.email')">
          {{ auth.user.email || '—' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('profile.phone')">
          {{ auth.user.phone_number || '—' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('profile.status')">
          {{ auth.user.status }}
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const { locale } = useI18n()

const fullName = computed(() => {
  if (!auth.user) return ''
  return `${auth.user.last_name} ${auth.user.first_name} ${auth.user.father_name || ''}`.trim()
})

const initials = computed(() => {
  if (!auth.user) return ''
  return `${auth.user.last_name?.[0] ?? ''}${auth.user.first_name?.[0] ?? ''}`.toUpperCase()
})

const position = computed(() => {
  if (!auth.user) return ''
  return locale.value === 'ru' ? auth.user.position_ru : auth.user.position_uz
})
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.profile {
  display: flex;
  gap: 32px;
  align-items: flex-start;

  &__desc {
    flex: 1;
  }
}
</style>
