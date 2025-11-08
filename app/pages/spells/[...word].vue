<template>
  <div class="d-flex align-center justify-center fill-height">
    <v-card max-width="400" title="Magic Spell" prepend-icon="mdi-magic-staff" class="pa-2">
      <v-card-text>
        <v-alert v-if="done" type="success" class="mb-4">
          The magic spell has been applied successfully. Now you can close this
          tab and back to the Solar Network!
        </v-alert>
        <v-alert
          v-else-if="!!error"
          type="error"
          title="Something went wrong"
          class="mb-4"
          >{{ error }}</v-alert
        >
        <div v-else-if="!!spell">
          <p class="mb-2">
            Magic spell for {{ spellTypes[spell.type] ?? "unknown" }}
          </p>
          <div class="d-flex align-center gap-2 mb-2">
            <v-icon size="18">mdi-account-circle</v-icon>
            <strong>@{{ spell.account.name }}</strong>
          </div>
          <div class="d-flex align-center gap-2 mb-2">
            <v-icon size="18">mdi-play</v-icon>
            <span>Available at</span>
            <strong>{{
              new Date(spell.createdAt ?? spell.affectedAt).toLocaleString()
            }}</strong>
          </div>
          <div v-if="spell.expiredAt" class="d-flex align-center gap-2 mb-4">
            <v-icon size="18">mdi-calendar</v-icon>
            <span>Until</span>
            <strong>{{ spell.expiredAt.toString() }}</strong>
          </div>
          <div class="mt-4">
            <v-text-field
              v-if="spell.type == 3"
              v-model="newPassword"
              label="New password"
              type="password"
              density="comfortable"
            ></v-text-field>
            <v-btn color="primary" :loading="submitting" @click="applySpell">
              <v-icon left>mdi-check</v-icon>
              Apply
            </v-btn>
          </div>
        </div>
        <v-progress-circular
          v-else
          indeterminate
          size="32"
          class="mt-4"
        ></v-progress-circular>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue"
import { useRoute } from "vue-router"

const route = useRoute()

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

const spellTypes = [
  "Account Activation",
  "Account Deactivation",
  "Account Deletion",
  "Reset Password",
  "Contact Method Verification"
]

const api = useSolarNetwork()

async function fetchSpell() {
  try {
    const resp = await api(`/id/spells/${encodeURIComponent(spellWord)}`)
    spell.value = resp
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

async function applySpell() {
  submitting.value = true
  try {
    await api(`/id/spells/${encodeURIComponent(spellWord)}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: newPassword.value
        ? JSON.stringify({ new_password: newPassword.value })
        : null
    })
    done.value = true
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : String(err)
  }
}

onMounted(() => fetchSpell())
</script>
