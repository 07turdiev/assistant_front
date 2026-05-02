<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>{{ $t('nav.notifications') }}</span>
        <el-button size="small" @click="refresh">{{ $t('common.refresh') }}</el-button>
      </div>
    </template>

    <el-empty v-if="items.length === 0" :description="$t('notifications.empty')" />

    <el-table v-else :data="items" stripe>
      <el-table-column prop="title" :label="$t('notifications.title')" />
      <el-table-column prop="notification_type" :label="$t('notifications.type')" width="120" />
      <el-table-column :label="$t('notifications.date')" width="180">
        <template #default="{ row }">
          {{ row.date || row.created_at?.slice(0, 10) }}
        </template>
      </el-table-column>
      <el-table-column :label="$t('notifications.seen')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.seen ? 'success' : 'warning'">
            {{ row.seen ? $t('common.yes') : $t('common.no') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('common.actions')" width="120">
        <template #default="{ row }">
          <el-button size="small" type="danger" @click="onDelete(row.id)">
            {{ $t('common.delete') }}
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications'

const store = useNotificationsStore()
const items = computed(() => store.items)

async function refresh() {
  await store.fetchList()
}

async function onDelete(id: string) {
  await store.remove(id)
}

onMounted(refresh)
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
