import { addComponent, addImports, addPlugin, createResolver, defineNuxtModule } from '@nuxt/kit';

export interface ModuleOptions {
  /**
   * When false, the module registers no composable overrides.
   * @default true
   */
  enabled?: boolean;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@findly.tech/shop-module-pwa',
    configKey: 'findly',
    compatibility: {
      nuxt: '>=3.0.0',
    },
  },
  defaults: {
    enabled: true,
  },
  setup(options, nuxt) {
    if (options.enabled === false) {
      return;
    }

    const resolver = createResolver(import.meta.url);

    nuxt.options.build.transpile = nuxt.options.build.transpile || [];
    nuxt.options.build.transpile.push('@findly.tech/shop-module-pwa');

    addComponent({
      name: 'FindlyRangeFilter',
      filePath: resolver.resolve('../runtime/components/FindlyRangeFilter.vue'),
      global: true,
      priority: 100,
    });

    addComponent({
      name: 'FindlyTileFilter',
      filePath: resolver.resolve('../runtime/components/FindlyTileFilter.vue'),
      global: true,
      priority: 100,
    });

    addComponent({
      name: 'FindlyActiveFilterTags',
      filePath: resolver.resolve('../runtime/components/FindlyActiveFilterTags.vue'),
      global: true,
      priority: 100,
    });

    addImports({
      name: 'useFindlyActiveFilterTags',
      as: 'useFindlyActiveFilterTags',
      from: resolver.resolve('../runtime/composables/useFindlyActiveFilterTags'),
    });

    addImports({
      name: 'useFindlyRangeFilter',
      as: 'useFindlyRangeFilter',
      from: resolver.resolve('../runtime/composables/useFindlyRangeFilter'),
    });

    addImports({
      name: 'useFindlyContext',
      as: 'useFindlyContext',
      from: resolver.resolve('../runtime/composables/useFindlyContext'),
    });

    addImports({
      name: 'useFindlyAutocompleteAssist',
      as: 'useFindlyAutocompleteAssist',
      from: resolver.resolve('../runtime/composables/useFindlyAutocompleteAssist'),
    });

    addImports([
      {
        name: 'useFindlyInlineAutocomplete',
        as: 'useFindlyInlineAutocomplete',
        from: resolver.resolve('../runtime/composables/useFindlyInlineAutocomplete'),
      },
      {
        name: 'useFindlyInlineGhostAlign',
        as: 'useFindlyInlineGhostAlign',
        from: resolver.resolve('../runtime/composables/useFindlyInlineAutocomplete'),
      },
    ]);

    addImports([
      {
        name: 'useSearch',
        as: 'useSearch',
        from: resolver.resolve('../runtime/composables/useSearch'),
        priority: 100,
      },
      {
        name: 'useSearchSuggestions',
        as: 'useSearchSuggestions',
        from: resolver.resolve('../runtime/composables/useSearchSuggestions'),
        priority: 100,
      },
      {
        name: 'useProducts',
        as: 'useProducts',
        from: resolver.resolve('../runtime/composables/useProducts'),
        priority: 100,
      },
    ]);

    addPlugin({
      src: resolver.resolve('../runtime/plugins/findly-settings.client'),
      mode: 'client',
    });
  },
});
