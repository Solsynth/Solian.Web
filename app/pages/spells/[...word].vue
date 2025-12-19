<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"
import { Wand2, User, Clock, Calendar, Check } from "lucide-vue-next"
import { useSolarNetwork } from "~/composables/useSolarNetwork"

const route = useRoute()
const api = useSolarNetwork()

useHead({
  title: "Magic Spell"
})

const spellWord: string =
  typeof route.params.word === "string"
    ? route.params.word
    : route.params.word?.join("/") || ""

interface SnSpell {
  type: number
  account: {
    name: string
  }
  createdAt: string
  affectedAt: string
  expiredAt?: string
}

const spell = ref<SnSpell | null>(null)
const error = ref<string | null>(null)
const newPassword = ref<string>()
const submitting = ref(false)
const done = ref(false)
const loading = ref(true)

const spellTypes = [
  "Account Activation",
  "Account Deactivation",
  "Account Deletion",
  "Reset Password",
  "Contact Method Verification"
]

async function fetchSpell() {
  loading.value = true
  try {
    const resp = await api<SnSpell>(
      `/pass/spells/${encodeURIComponent(spellWord)}`
    )
    spell.value = resp
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    loading.value = false
  }
}

async function applySpell() {
  submitting.value = true
  try {
    await api(`/pass/spells/${encodeURIComponent(spellWord)}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: newPassword.value
        ? JSON.stringify({ new_password: newPassword.value })
        : null
    })
    done.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  } finally {
    submitting.value = false
  }
}

onMounted(() => fetchSpell())
</script>

<template>
  <div class="relative flex items-center justify-center min-h-layout px-4">
    <n-card class="w-full max-w-md shadow-lg" size="large">
      <div v-if="done" class="py-4">
        <n-result
          status="success"
          title="Spell Applied"
          description="The magic spell has been applied successfully. Now you can close this tab and return to the Solar Network!"
        >
        </n-result>
      </div>

      <div v-else-if="error">
        <n-alert title="Something went wrong" type="error" class="mb-4">
          {{ error }}
        </n-alert>
      </div>

      <div v-else-if="loading" class="flex justify-center py-12">
        <n-spin size="large" />
      </div>

      <div v-else-if="spell" class="flex flex-col gap-6">
        <!-- Header -->
        <div
          class="flex items-center gap-3 pb-4 border-b border-gray-100 dark:border-gray-800"
        >
          <div class="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <n-icon :component="Wand2" class="text-amber-500" :size="24" />
          </div>
          <div>
            <h2 class="text-xl font-bold">Magic Spell</h2>
            <p class="text-sm text-gray-500">
              {{ spellTypes[spell.type] ?? "Unknown Spell" }}
            </p>
          </div>
        </div>

        <!-- Details -->
        <div class="space-y-4">
          <div class="flex items-center gap-3">
            <n-icon :component="User" class="text-gray-400" :size="20" />
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 uppercase tracking-wider"
                >Account</span
              >
              <span class="font-medium">@{{ spell.account.name }}</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <n-icon :component="Clock" class="text-gray-400" :size="20" />
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 uppercase tracking-wider"
                >Available at</span
              >
              <span class="font-medium">{{
                new Date(spell.createdAt ?? spell.affectedAt).toLocaleString()
              }}</span>
            </div>
          </div>

          <div v-if="spell.expiredAt" class="flex items-center gap-3">
            <n-icon :component="Calendar" class="text-gray-400" :size="20" />
            <div class="flex flex-col">
              <span class="text-xs text-gray-500 uppercase tracking-wider"
                >Expires</span
              >
              <span class="font-medium">{{
                new Date(spell.expiredAt).toLocaleString()
              }}</span>
            </div>
          </div>
        </div>

        <!-- Action -->
        <div class="mt-2 space-y-4">
          <n-input
            v-if="spell.type == 3"
            v-model:value="newPassword"
            type="password"
            show-password-on="click"
            placeholder="New password"
            size="large"
          />

          <n-button
            type="primary"
            class="w-full"
            size="large"
            :loading="submitting"
            @click="applySpell"
          >
            <template #icon>
              <n-icon :component="Check" />
            </template>
            Apply Spell
          </n-button>
        </div>
      </div>
    </n-card>
  </div>
</template>
