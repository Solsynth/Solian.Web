<template>
  <v-card
    title="Post your reply"
    prepend-icon="mdi-post-lamp"
    flat
    border
    density="comfortable"
  >
    <v-card-text>
      <v-textarea
        placeholder="Talk about this post for a bit."
        disabled
        max-rows="5"
        auto-grow
        :hide-details="true"
      ></v-textarea>
      <div class="flex justify-end mt-4">
        <v-btn append-icon="mdi-send">Send</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>
