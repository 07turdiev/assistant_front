<template>
  <el-card v-loading="loading">
    <template #header>
      <div class="header">
        <span class="title">Qoralamalar</span>
        <el-radio-group v-model="activeKind" size="default" @change="loadDrafts">
          <el-radio-button label="event">📅 Tadbirlar ({{ eventCount }})</el-radio-button>
          <el-radio-button label="report">📋 Topshiriqlar ({{ reportCount }})</el-radio-button>
        </el-radio-group>
      </div>
    </template>

    <el-empty v-if="!drafts.length" description="Qoralama yo'q. Telegram botda 🎤 tugmasi orqali yarating." />

    <el-table v-else :data="drafts" stripe @row-click="onRowClick">
      <el-table-column label="Sarlavha" prop="title" min-width="240">
        <template #default="{ row }">
          <div>
            <strong>{{ row.title }}</strong>
            <el-tag v-if="row.is_important" type="danger" size="small" style="margin-left: 8px">Muhim</el-tag>
            <el-tag v-if="row.is_private" type="warning" size="small" style="margin-left: 4px">Yopiq</el-tag>
          </div>
          <div style="color: var(--el-text-color-secondary); font-size: 12px; margin-top: 4px">
            {{ row.raw_transcript?.slice(0, 100) }}{{ row.raw_transcript && row.raw_transcript.length > 100 ? '…' : '' }}
          </div>
        </template>
      </el-table-column>

      <el-table-column v-if="activeKind === 'event'" label="Sana / Vaqt" width="160">
        <template #default="{ row }">
          <div v-if="row.date">{{ row.date }}</div>
          <div v-if="row.start_time" style="color: var(--el-text-color-secondary)">
            {{ row.start_time }}<span v-if="row.end_time"> — {{ row.end_time }}</span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="Yaratuvchi" width="180">
        <template #default="{ row }">
          <span v-if="row.created_by">{{ row.created_by.last_name }} {{ row.created_by.first_name }}</span>
        </template>
      </el-table-column>

      <el-table-column label="Tayinlangan" width="180">
        <template #default="{ row }">
          <span v-if="row.assigned_to">{{ row.assigned_to.last_name }} {{ row.assigned_to.first_name }}</span>
          <el-tag v-else-if="row.target_direction_name" size="small">{{ row.target_direction_name }}</el-tag>
          <span v-else style="color: var(--el-text-color-placeholder)">— tanlanmagan</span>
        </template>
      </el-table-column>

      <el-table-column label="Holat" width="140">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>

      <el-table-column label="Yaratilgan" width="160">
        <template #default="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { eventDraftsApi, reportDraftsApi } from '@/api/drafts'
import type { EventDraft, ReportDraft, DraftStatus } from '@/types/draft'
import { showApiError } from '@/utils/api-error'

const router = useRouter()
const activeKind = ref<'event' | 'report'>('event')
const drafts = ref<(EventDraft | ReportDraft)[]>([])
const loading = ref(false)
const eventCount = ref(0)
const reportCount = ref(0)

async function loadDrafts() {
  loading.value = true
  try {
    if (activeKind.value === 'event') {
      const { data } = await eventDraftsApi.list({ page_size: 50 })
      drafts.value = data.results
      eventCount.value = data.count
    } else {
      const { data } = await reportDraftsApi.list({ page_size: 50 })
      drafts.value = data.results
      reportCount.value = data.count
    }
  } catch (e: unknown) {
    showApiError(e, 'Qoralamalarni yuklashda xato')
  } finally {
    loading.value = false
  }
}

async function loadCounts() {
  try {
    const [evt, rep] = await Promise.all([
      eventDraftsApi.list({ page_size: 1 }),
      reportDraftsApi.list({ page_size: 1 }),
    ])
    eventCount.value = evt.data.count
    reportCount.value = rep.data.count
  } catch {}
}

function onRowClick(row: EventDraft | ReportDraft) {
  router.push({
    name: activeKind.value === 'event' ? 'drafts.event.edit' : 'drafts.report.edit',
    params: { id: row.id },
  })
}

function statusType(s: DraftStatus): 'primary' | 'success' | 'warning' | 'info' | 'danger' | undefined {
  const map = {
    PENDING_REVIEW: 'warning' as const,
    PUBLISHED: 'success' as const,
    REJECTED: 'info' as const,
    EXPIRED: 'danger' as const,
  }
  return map[s] || undefined
}

function statusLabel(s: DraftStatus): string {
  return {
    PENDING_REVIEW: 'Tahrir kutilmoqda',
    PUBLISHED: 'Joylangan',
    REJECTED: 'Rad etilgan',
    EXPIRED: "Muddati o'tgan",
  }[s] || s
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(() => {
  loadCounts()
  loadDrafts()
})
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-size: 18px;
  font-weight: 600;
}
:deep(.el-table__row) {
  cursor: pointer;
}
</style>
