export type ActiveFilterTag = {
  key: string;
  facetName: string;
  valueLabel: string;
  type: 'term' | 'price' | 'range';
  compositeId?: string;
  rangeField?: string;
};
