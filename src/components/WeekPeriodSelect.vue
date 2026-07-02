<script setup lang="ts">
import { computed } from 'vue'
import type { WeekOption } from '@/utils/week'

const props = defineProps<{
  modelValue: string
  options: WeekOption[]
  placeholder?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
}>()

const selectedOption = computed(() =>
  props.options.find((o) => o.weekStart === props.modelValue),
)

function onChange(val: string) {
  emit('update:modelValue', val)
  emit('change', val)
}
</script>

<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    clearable
    filterable
    fit-input-width
    class="week-period-select"
    popper-class="week-period-popper"
    @update:model-value="onChange"
  >
    <template v-if="selectedOption" #label>
      <div class="week-opt week-opt--selected">
        <span class="week-opt__title">{{ selectedOption.workDayTitle }}</span>
        <span class="week-opt__detail">{{ selectedOption.workDayDetail }}</span>
      </div>
    </template>
    <el-option
      v-for="opt in options"
      :key="opt.weekStart"
      :label="opt.label"
      :value="opt.weekStart"
    >
      <div class="week-opt">
        <span class="week-opt__title">{{ opt.workDayTitle }}</span>
        <span class="week-opt__detail">{{ opt.workDayDetail }}</span>
      </div>
    </el-option>
  </el-select>
</template>

<style scoped>
.week-period-select {
  width: 100%;
}

.week-period-select :deep(.el-select__wrapper) {
  min-height: 48px;
  height: auto;
  padding-top: 6px;
  padding-bottom: 6px;
  border-radius: 10px;
  box-shadow: none;
  background: #f8fafc;
  border: 1px solid #e8edf3;
}

.week-opt {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 2px 0;
  line-height: 1.4;
  min-width: 0;
}

.week-opt--selected {
  padding: 0;
}

.week-opt__title {
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.week-opt__detail {
  font-size: 12px;
  color: #64748b;
  white-space: normal;
  word-break: break-word;
}
</style>

<style>
.week-period-popper.el-select__popper {
  box-sizing: border-box;
}

.week-period-popper .el-select-dropdown__item {
  height: auto;
  min-height: 48px;
  padding: 10px 12px;
  line-height: 1.4;
  white-space: normal;
}
</style>
