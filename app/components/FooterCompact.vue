<template>
  <v-container class="footer">
    <div class="d-flex justify-space-between align-center">
      <v-select
        :items="['English (United States)']"
        model-value="English (United States)"
        variant="plain"
        density="compact"
        hide-details
        class="flex-grow-0"
      />
      <div class="d-flex">
        <v-btn variant="text" size="small" class="text-capitalize">Help</v-btn>
        <v-btn variant="text" size="small" class="text-capitalize"
          >Privacy</v-btn
        >
        <v-btn variant="text" size="small" class="text-capitalize">Terms</v-btn>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
.footer {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
