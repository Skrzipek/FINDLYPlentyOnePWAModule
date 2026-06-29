import { unrefElement, useResizeObserver } from '@vueuse/core';

type GhostAlignRefs = {
  containerRef: Ref<HTMLElement | null>;
  inputWrapperRef: Ref<HTMLElement | null | undefined>;
  inputValue: Ref<string>;
};

export const useFindlyInlineGhostAlign = ({ containerRef, inputWrapperRef, inputValue }: GhostAlignRefs) => {
  const ghostStyle = ref<Record<string, string>>({});

  const syncGhostAlign = () => {
    if (!import.meta.client) {
      return;
    }

    const container = containerRef.value;
    const input = unrefElement(inputWrapperRef)?.querySelector('input');

    if (!container || !input) {
      ghostStyle.value = {};
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    const inputStyles = getComputedStyle(input);

    ghostStyle.value = {
      top: `${inputRect.top - containerRect.top}px`,
      left: `${inputRect.left - containerRect.left}px`,
      width: `${inputRect.width}px`,
      height: `${inputRect.height}px`,
      paddingTop: inputStyles.paddingTop,
      paddingRight: inputStyles.paddingRight,
      paddingBottom: inputStyles.paddingBottom,
      paddingLeft: inputStyles.paddingLeft,
      font: inputStyles.font,
      letterSpacing: inputStyles.letterSpacing,
      textTransform: inputStyles.textTransform,
    };
  };

  watch(inputValue, () => nextTick(syncGhostAlign));

  useResizeObserver(containerRef, () => nextTick(syncGhostAlign));

  onMounted(() => {
    nextTick(syncGhostAlign);
  });

  return {
    ghostStyle,
    syncGhostAlign,
  };
};
