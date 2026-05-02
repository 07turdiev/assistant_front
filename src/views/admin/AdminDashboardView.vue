<template>
  <div class="admin-dashboard">
    <h1>{{ $t('admin.dashboard') }}</h1>

    <el-row :gutter="16">
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <span class="stat__label">{{ $t('admin.users') }}</span>
            <span class="stat__value">{{ stats.users }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <span class="stat__label">{{ $t('admin.directions') }}</span>
            <span class="stat__value">{{ stats.directions }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <span class="stat__label">{{ $t('admin.organisations') }}</span>
            <span class="stat__value">{{ stats.organisations }}</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card>
          <div class="stat">
            <span class="stat__label">{{ $t('admin.regions') }}</span>
            <span class="stat__value">{{ stats.regions }}</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="quick-links">
      <template #header>{{ $t('admin.quickLinks') }}</template>
      <el-space wrap>
        <el-button type="primary" @click="$router.push({ name: 'admin.users.create' })">
          {{ $t('admin.createUser') }}
        </el-button>
        <el-button @click="$router.push({ name: 'admin.users' })">
          {{ $t('admin.manageUsers') }}
        </el-button>
        <el-button @click="$router.push({ name: 'admin.directions' })">
          {{ $t('admin.manageDirections') }}
        </el-button>
      </el-space>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import { adminUsersApi, adminDirectionsApi, adminOrganisationsApi, adminRegionsApi } from '@/api/admin'

const stats = reactive({
  users: 0,
  directions: 0,
  organisations: 0,
  regions: 0,
})

onMounted(async () => {
  try {
    const [u, d, o, r] = await Promise.all([
      adminUsersApi.list({ page: 1, page_size: 1 }),
      adminDirectionsApi.list(),
      adminOrganisationsApi.list({ page: 1, page_size: 1 }),
      adminRegionsApi.list(),
    ])
    stats.users = u.data.count
    stats.directions = d.data.length
    stats.organisations = (o.data as { count?: number }).count ?? o.data.results?.length ?? 0
    stats.regions = r.data.length
  } catch (_e) {
    // backend hali tayyor bo'lmasa, 0 lar saqlanadi
  }
})
</script>

<style lang="scss" scoped>
.admin-dashboard h1 {
  margin: 0 0 24px;
  font-size: 20px;
}
.quick-links {
  margin-top: 24px;
}
.stat {
  display: flex;
  flex-direction: column;
  &__label {
    font-size: 13px;
    color: #5a6c7d;
    margin-bottom: 4px;
  }
  &__value {
    font-size: 28px;
    font-weight: 600;
  }
}
</style>
