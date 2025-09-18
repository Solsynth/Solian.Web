<template>
  <v-card>
    <v-card-text>
      <div class="flex flex-col gap-3">
        <post-header :item="props.item" />

        <div v-if="props.item.title || props.item.description">
          <h2 v-if="props.item.title" class="text-lg">{{ props.item.title }}</h2>
          <p v-if="props.item.description" class="text-sm">
            {{ props.item.description }}
          </p>
        </div>

        <article v-if="htmlContent" class="prose prose-sm dark:prose-invert prose-slate prose-p:m-0">
          <div v-html="htmlContent"/>
        </article>

        <div v-if="props.item.attachments" class="d-flex gap-2 flex-wrap">
          <attachment-item
            v-for="attachment in props.item.attachments"
            :key="attachment.id"
            :item="attachment"
          />
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'
import { Marked } from 'marked'

import PostHeader from './PostHeader.vue'
import AttachmentItem from './AttachmentItem.vue'

const props = defineProps<{ item: any }>()

const marked = new Marked()

const htmlContent = ref<string>('')

watch(
  props.item,
  async (value) => {
    if (value.content) htmlContent.value = await marked.parse(value.content)
  },
  { immediate: true, deep: true },
)
</script>
