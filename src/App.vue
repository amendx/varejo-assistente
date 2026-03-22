<template>
  <AssistenteCompras
    :userData="userData"
    :themeData="themeData"
    :eventBus="eventBus"
  />
</template>

<script>
import AssistenteCompras from "./AssistenteCompras.vue";

export default {
  name: "App",
  components: {
    AssistenteCompras,
  },
  props: {
    userData: {
      type: Object,
      default: null,
    },
    themeData: {
      type: String,
      default: null,
    },
    eventBus: {
      type: Object,
      default: null,
    },
  },
};
</script>
