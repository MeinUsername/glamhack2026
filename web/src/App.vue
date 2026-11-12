<script setup>
import { ref, onMounted } from 'vue'

const MAX_BYTES = 1024 * 1024 // 1 MB, same limit as the server

const state = ref('loading') // loading | anonymous | ready
const email = ref('')
const files = ref([])
const message = ref('')
const error = ref('')
const busy = ref(false)

async function api(path, options = {}) {
  const res = await fetch(path, { credentials: 'same-origin', ...options })
  const body = res.headers.get('content-type')?.includes('json') ? await res.json() : null
  return { ok: res.ok, status: res.status, body }
}

async function load() {
  const me = await api('/api/me')
  if (!me.ok) {
    state.value = 'anonymous'
    return
  }
  email.value = me.body.email
  const list = await api('/api/files')
  files.value = list.ok ? list.body : []
  state.value = 'ready'
}

async function upload(event) {
  error.value = ''
  message.value = ''
  const file = event.target.files[0]
  if (!file) return
  if (file.size > MAX_BYTES) {
    error.value = 'Die Datei ist größer als 1 MB.'
    event.target.value = ''
    return
  }
  busy.value = true
  const form = new FormData()
  form.append('file', file)
  const res = await api('/api/files', { method: 'POST', body: form })
  busy.value = false
  event.target.value = ''
  if (!res.ok) {
    error.value = res.body?.error ?? 'Upload fehlgeschlagen.'
    return
  }
  message.value = `„${res.body.name}“ hochgeladen.`
  files.value = [res.body, ...files.value]
}

onMounted(load)
</script>

<template>
  <section>
    <h1>Vue-App</h1>

    <p v-if="state === 'loading'" class="muted">Lade…</p>

    <div v-else-if="state === 'anonymous'">
      <p>Du bist nicht angemeldet.</p>
      <p><a href="/login">Zur Anmeldung</a></p>
    </div>

    <div v-else>
      <p class="muted">Angemeldet als {{ email }}. Maximal 1 Megabyte pro Datei.</p>

      <label class="upload">
        <input type="file" :disabled="busy" @change="upload" />
        <span>{{ busy ? 'Lade hoch…' : 'Datei auswählen' }}</span>
      </label>

      <p v-if="message" class="notice" role="status">{{ message }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <table v-if="files.length">
        <thead>
          <tr><th>Datei</th><th>Grösse</th><th>Hochgeladen</th></tr>
        </thead>
        <tbody>
          <tr v-for="f in files" :key="f.id">
            <td><a :href="`/files/${f.id}`">{{ f.name }}</a></td>
            <td>{{ (f.bytes / 1024).toFixed(1) }} KB</td>
            <td>{{ f.createdAt }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Noch keine Dateien.</p>
    </div>
  </section>
</template>

<style>
:root { color-scheme: light dark; --accent: #2563eb; }
body { font-family: system-ui, sans-serif; margin: 0; line-height: 1.5; }
section { max-width: 640px; margin: 0 auto; padding: 16px; }
.upload { display: inline-block; margin: 12px 0; padding: 10px 14px; border-radius: 8px; background: var(--accent); color: #fff; cursor: pointer; }
.upload input { display: none; }
table { width: 100%; border-collapse: collapse; }
td, th { text-align: left; padding: 8px 4px; border-bottom: 1px solid #8883; font-size: 0.95em; }
.error { color: #dc2626; }
.notice { color: #16a34a; }
.muted { opacity: 0.7; }
@media (max-width: 480px) { section { padding: 12px; } }
</style>
