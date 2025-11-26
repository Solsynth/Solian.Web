<template>
  <div class="container absolute bottom-5 left-1/2 -translate-x-1/2">
    <div class="flex justify-between items-center">
      <n-select
        :options="[{ label: 'English (United States)', value: 'en-us' }]"
        model-value="en-us"
        size="small"
        class="flex-grow-0"
      />
      <div class="flex">
        <n-button text size="small">Help</n-button>
        <n-button text size="small">Privacy</n-button>
        <n-button text size="small">Terms</n-button>
      </div>
    </div>
  </div>
</template>
