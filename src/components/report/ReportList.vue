<template>
  <el-card>
    <template #header>
      <div class="header">
        <span>{{ title }}</span>
        <el-button
          v-if="canCreate"
          type="primary"
          @click="createDialogVisible = true"
        >
          {{ $t('reports.create') }}
        </el-button>
      </div>
    </template>

    <el-tabs v-model="activeTab">
      <el-tab-pane :label="`${$t('reports.activeTab')} (${activeCount})`" name="active">
        <el-empty v-if="activeItems.length === 0" :description="$t('reports.empty')" />
        <el-table v-else :data="activeItems" stripe v-loading="loading">
          <el-table-column :label="$t('reports.sender')" width="200">
            <template #default="{ row }">{{ formatUser(row.sender) }}</template>
          </el-table-column>
          <el-table-column :label="$t('reports.receiver')" width="200">
            <template #default="{ row }">{{ formatUser(row.receiver) }}</template>
          </el-table-column>
          <el-table-column prop="description" :label="$t('reports.description')" />
          <el-table-column :label="$t('reports.createdAt')" width="160">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column :label="$t('common.actions')" width="200" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="canReply(row)"
                size="small"
                type="primary"
                @click="openReply(row)"
              >
                {{ $t('reports.reply') }}
              </el-button>
              <el-button
                v-if="canDelete(row)"
                size="small"
                type="danger"
                @click="onDelete(row)"
              >
                {{ $t('common.delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane :label="$t('reports.historyTab')" name="inactive">
        <div class="search">
          <el-input
            v-model="search"
            :placeholder="$t('common.search')"
            clearable
            style="width: 300px"
            @input="onSearch"
          />
        </div>
        <el-table :data="inactiveItems" stripe v-loading="loading">
          <el-table-column :label="$t('reports.sender')" width="200">
            <template #default="{ row }">{{ formatUser(row.sender) }}</template>
          </el-table-column>
          <el-table-column :label="$t('reports.receiver')" width="200">
            <template #default="{ row }">{{ formatUser(row.receiver) }}</template>
          </el-table-column>
          <el-table-column prop="description" :label="$t('reports.description')" />
          <el-table-column :label="$t('reports.reply')" width="180">
            <template #default="{ row }">
              <el-tag v-if="row.reply" :color="replyColor(row.reply)"
                      :style="{ color:'#fff', backgroundColor: replyColor(row.reply), border:'none' }">
                {{ replyLabel(row.reply) }}
              </el-tag>
              <span v-else-if="row.notify_time">{{ row.notify_time }} min</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('reports.repliedAt')" width="160">
            <template #default="{ row }">{{ formatDate(row.reply_at) }}</template>
          </el-table-column>
        </el-table>
        <el-pagination
          class="pagination"
          :current-page="page"
          :page-size="pageSize"
          :total="totalInactive"
          layout="prev, pager, next, total"
          @current-change="onPageChange"
        />
      </el-tab-pane>
    </el-tabs>

    <ReplyDialog
      v-model="replyDialogVisible"
      :report-id="selectedReportId"
      :kind="kind"
      @replied="reload"
    />

    <el-dialog v-model="createDialogVisible" :title="$t('reports.create')" width="520px">
      <el-form :model="createForm" label-position="top">
        <el-form-item :label="$t('reports.description')" required>
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="4"
            :placeholder="$t('reports.descriptionHint')"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="creating" @click="onCreate">
          {{ $t('common.save') }}
        </el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { reportsApi } from '@/api/reports'
import { useAuthStore } from '@/stores/auth'
import { useLookupStore } from '@/stores/lookup'
import { formatDateTime } from '@/utils/date'
import { fullName } from '@/utils/format'
import { showApiError } from '@/utils/api-error'
import type { Report } from '@/types/report'
import ReplyDialog from './ReplyDialog.vue'

const props = defineProps<{
  kind: 'task' | 'request'
  title: string
  canCreate: boolean
}>()

const { t } = useI18n()
const auth = useAuthStore()
const lookup = useLookupStore()

const activeTab = ref<'active' | 'inactive'>('active')
const activeItems = ref<Report[]>([])
const inactiveItems = ref<Report[]>([])
const totalInactive = ref(0)
const activeCount = ref(0)
const loading = ref(false)

const page = ref(1)
const pageSize = ref(20)
const search = ref('')
let searchTimer: number | null = null

const replyDialogVisible = ref(false)
const selectedReportId = ref<string | null>(null)

const createDialogVisible = ref(false)
const creating = ref(false)
const createForm = reactive({ description: '' })

// "So'rov" oqimi olib tashlandi — bu komponent endi faqat topshiriq (task) bilan ishlaydi.
const apiActive = computed(() => reportsApi.tasksActive)
const apiInactive = computed(() => reportsApi.tasksInactive)
const apiCount = computed(() => reportsApi.tasksCount)

function formatUser(u: Report['sender']): string {
  return fullName(u)
}

function formatDate(s: string | null | undefined): string {
  if (!s) return '—'
  return formatDateTime(s)
}

function replyLabel(value: string): string {
  const list = props.kind === 'task' ? lookup.taskReplies : lookup.requestReplies
  return list.find((c) => c.value === value)?.label || value
}

function replyColor(value: string): string {
  const list = props.kind === 'task' ? lookup.taskReplies : lookup.requestReplies
  return list.find((c) => c.value === value)?.color || '#909399'
}

function canReply(r: Report): boolean {
  return auth.user !== null && r.receiver?.id === auth.user.id
}

function canDelete(r: Report): boolean {
  return auth.user !== null && r.sender?.id === auth.user.id
}

async function reload() {
  loading.value = true
  try {
    const [a, i, c] = await Promise.all([
      apiActive.value(),
      apiInactive.value({ page: page.value, page_size: pageSize.value, search: search.value || undefined }),
      apiCount.value(),
    ])
    activeItems.value = a.data
    inactiveItems.value = i.data.results
    totalInactive.value = i.data.count
    activeCount.value = c.data.count
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    loading.value = false
  }
}

function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    page.value = 1
    reload()
  }, 350)
}

function onPageChange(p: number) {
  page.value = p
  reload()
}

function openReply(r: Report) {
  selectedReportId.value = r.id
  replyDialogVisible.value = true
}

async function onDelete(r: Report) {
  await ElMessageBox.confirm(t('reports.confirmDelete'), t('common.confirm'), { type: 'warning' })
  try {
    await reportsApi.delete(r.id)
    ElMessage.success(t('common.success'))
    await reload()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  }
}

async function onCreate() {
  if (!createForm.description.trim()) return
  creating.value = true
  try {
    await reportsApi.create({ description: createForm.description.trim() })
    ElMessage.success(t('common.success'))
    createForm.description = ''
    createDialogVisible.value = false
    await reload()
  } catch (e: unknown) {
    showApiError(e, t('common.error'))
  } finally {
    creating.value = false
  }
}

onMounted(async () => {
  await lookup.loadAll()
  await reload()
})
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.search {
  margin-bottom: 12px;
}
.pagination {
  margin-top: 12px;
  justify-content: flex-end;
}
</style>
