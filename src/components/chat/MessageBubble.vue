<template>
  <div class="bubble" :class="{ 'bubble--mine': isMine }">
    <div class="bubble__content" :class="{ 'bubble__content--mine': isMine }">
      <p v-if="message.message" class="bubble__text">{{ message.message }}</p>
      <div v-if="message.files?.length" class="bubble__files">
        <a
          v-for="f in message.files"
          :key="f.id"
          :href="f.url"
          target="_blank"
          class="bubble__file"
        >
          <el-icon><Paperclip /></el-icon>
          <span>{{ f.file_name }}</span>
        </a>
      </div>
      <span class="bubble__time">{{ time }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Paperclip } from '@element-plus/icons-vue'
import { formatTime } from '@/utils/date'
import type { ChatMessage } from '@/types/chat'

const props = defineProps<{
  message: ChatMessage
  isMine: boolean
}>()

const time = computed(() => formatTime(props.message.created_at))
</script>

<style lang="scss" scoped>
.bubble {
  display: flex;
  margin-bottom: 8px;

  &--mine {
    justify-content: flex-end;
  }

  &__content {
    max-width: 70%;
    padding: 8px 12px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);

    &--mine {
      background: #d4e9ff;
    }
  }

  &__text {
    margin: 0 0 4px;
    word-break: break-word;
    white-space: pre-wrap;
  }

  &__files {
    margin: 4px 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__file {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #1976d2;
    font-size: 13px;
    text-decoration: none;
    &:hover { text-decoration: underline; }

    .el-icon { font-size: 14px; }
  }

  &__time {
    display: block;
    text-align: right;
    font-size: 11px;
    color: #909399;
  }
}
</style>
