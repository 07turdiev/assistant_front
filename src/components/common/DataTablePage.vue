<template>
  <el-card v-loading="loading" class="data-table-page">
    <template #header>
      <div class="data-table-page__header">
        <div class="data-table-page__title">
          <slot name="title">{{ title }}</slot>
        </div>
        <div class="data-table-page__actions">
          <slot name="header-actions">
            <el-button
              v-if="$slots['create-button'] === undefined && createLabel"
              type="primary"
              @click="$emit('create')"
            >
              {{ createLabel }}
            </el-button>
            <slot name="create-button" />
          </slot>
        </div>
      </div>
    </template>

    <div v-if="$slots.filters" class="data-table-page__filters">
      <slot name="filters" />
    </div>

    <slot />

    <div v-if="showPagination" class="data-table-page__pagination">
      <el-pagination
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        :layout="paginationLayout"
        background
        @current-change="$emit('page-change', $event)"
      />
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    loading?: boolean
    createLabel?: string
    page?: number
    pageSize?: number
    total?: number
    showPagination?: boolean
    paginationLayout?: string
  }>(),
  {
    title: '',
    loading: false,
    createLabel: '',
    page: 1,
    pageSize: 20,
    total: 0,
    showPagination: false,
    paginationLayout: 'prev, pager, next, total',
  },
)

defineEmits<{
  create: []
  'page-change': [page: number]
}>()

// Foydalanmasak ham — silent unused warning'ni oldini olish uchun
const _ = computed(() => props.total)
</script>

<style lang="scss" scoped>
.data-table-page {
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__title {
    font-weight: 500;
    font-size: 15px;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  &__filters {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    > * {
      flex: 1 1 200px;
      min-width: 0;
      max-width: 280px;
    }
  }

  &__pagination {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}

@media (max-width: 767px) {
  .data-table-page {
    &__filters > * {
      flex: 1 1 100%;
      max-width: none;
    }
    &__pagination {
      justify-content: center;
    }
  }
}
</style>
